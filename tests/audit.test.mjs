import test from "node:test";
import assert from "node:assert/strict";
import { validateAuditRequest } from "../lib/audit/validation.ts";
import { buildAuditEmail, deliverAuditRequest } from "../lib/audit/delivery.ts";
import { normalizeBusinessUrl } from "../lib/audit/validation.ts";
import { buildHandoffPayload, handOffAuditRequest, HANDOFF_SECRET_HEADER } from "../lib/audit/handoff.ts";

const payload = (overrides = {}) => ({
  submissionId: "2f3ff35d-76be-4d47-ae8b-daf6c56b44ad",
  firstName: " Avery ", lastName: "Morgan", email: "AVERY@example.com",
  company: "Example Services", businessUrl: "ExampleServices.com", industry: "Plumber",
  city: "Miami", state: "Florida",
  phone: "+1 (202) 555-0142", smsConsent: false, termsAccepted: true, website: "", elapsedMs: 3000,
  ...overrides,
});

test("audit accepts both consent choices and normalizes details", () => {
  for (const smsConsent of [false, true]) {
    const data = validateAuditRequest(payload({ smsConsent }));
    assert.equal(data.firstName, "Avery");
    assert.equal(data.email, "avery@example.com");
    assert.equal(data.smsConsent, smsConsent);
    assert.equal(data.termsAccepted, true);
  }
});

test("audit requires all fields and rejects malformed requests", () => {
  for (const key of ["firstName", "lastName", "email", "company", "businessUrl", "industry", "city", "state", "phone", "submissionId"]) {
    assert.equal(validateAuditRequest(payload({ [key]: "" })), null, key);
  }
  for (const override of [{ email: "bad" }, { phone: "123" }, { phone: "1234567890123456" },
    { smsConsent: "true" }, { smsConsent: undefined }, { website: "bot" },
    { elapsedMs: 50 }, { elapsedMs: Infinity }, { state: "not a state" },
    { company: "bad\r\nBcc: nobody@example.com" }, { city: "x".repeat(101) }]) {
    assert.equal(validateAuditRequest(payload(override)), null);
  }
});

test("Terms agreement is required independently of optional SMS consent", () => {
  for (const smsConsent of [true, false]) {
    for (const termsAccepted of [false, undefined, "true", "on", 1]) {
      assert.equal(validateAuditRequest(payload({ smsConsent, termsAccepted })), null);
    }
    assert.ok(validateAuditRequest(payload({ smsConsent, termsAccepted: true })));
  }
});

test("email keeps consent evidence and a fixed recipient", () => {
  const data = validateAuditRequest(payload());
  const email = buildAuditEmail(data);
  assert.deepEqual(email.to, ["brett@dreki-solutions.ai"]);
  assert.equal(email.reply_to, "avery@example.com");
  assert.match(email.text, /NO — do not text/);
  assert.match(email.text, /Consent wording version: 2026-10-10\.5/);
  assert.match(email.text, /Terms and Privacy Policy agreement: YES — agreed/);
  assert.match(email.text, /Terms version: 2026-10-10\.4/);
  assert.match(email.text, /Privacy Policy version: 2026-10-26\.1/);
  assert.match(email.text, /Terms: https:\/\/www\.dreki-solutions\.ai\/terms/);
  assert.match(email.text, /Msg & data rates may apply/);
  assert.match(email.text, /Reply HELP for help\. Reply STOP to opt out\./);
  assert.match(email.text, /City: Miami/);
  assert.match(email.text, /State: Florida/);
  assert.match(buildAuditEmail({ ...data, smsConsent: true }).text, /YES — opted in/);
});

test("delivery requires provider acceptance and uses stable retry keys", async (t) => {
  const previousKey = process.env.RESEND_API_KEY;
  const previousFrom = process.env.AUDIT_FROM_EMAIL;
  process.env.RESEND_API_KEY = "test-only";
  process.env.AUDIT_FROM_EMAIL = "test@example.com";
  t.after(() => {
    if (previousKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousKey;
    if (previousFrom === undefined) delete process.env.AUDIT_FROM_EMAIL;
    else process.env.AUDIT_FROM_EMAIL = previousFrom;
    t.mock.restoreAll();
  });
  const data = validateAuditRequest(payload());
  const fetchMock = t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "https://api.resend.com/emails");
    assert.equal(options.headers["Idempotency-Key"], `audit/${data.submissionId}`);
    return Response.json({ id: "message-id" });
  });
  assert.equal(await deliverAuditRequest(data), true);
  fetchMock.mock.mockImplementation(async () => Response.json({ error: "failed" }, { status: 500 }));
  assert.equal(await deliverAuditRequest(data), false);
  fetchMock.mock.mockImplementation(async () => Response.json({}));
  assert.equal(await deliverAuditRequest(data), false);
  delete process.env.RESEND_API_KEY;
  assert.equal(await deliverAuditRequest(data), false);
});

test("business website is normalized to a fetchable https URL", () => {
  assert.equal(normalizeBusinessUrl("ExampleServices.com"), "https://exampleservices.com");
  assert.equal(normalizeBusinessUrl("www.example.com/"), "https://www.example.com");
  assert.equal(normalizeBusinessUrl("http://example.co.uk/home"), "http://example.co.uk/home");
  for (const bad of ["", "example", "localhost", "ftp://example.com", "https://user:pw@example.com",
    "https://example.com:8080", "https://10.0.0.1", "not a url", "javascript:alert(1)"]) {
    assert.equal(normalizeBusinessUrl(bad), "", bad);
  }
  assert.equal(validateAuditRequest(payload({ businessUrl: "localhost" })), null);
  assert.equal(validateAuditRequest(payload({ industry: "x" })), null);
  assert.equal(validateAuditRequest(payload()).businessUrl, "https://exampleservices.com");
});

test("request email includes the website and industry", () => {
  const email = buildAuditEmail(validateAuditRequest(payload()));
  assert.match(email.text, /Website: https:\/\/exampleservices\.com/);
  assert.match(email.text, /Industry: Plumber/);
});

test("hand-off maps the request to the audit's fields", () => {
  const body = buildHandoffPayload(validateAuditRequest(payload({ smsConsent: true })));
  assert.deepEqual(body, {
    submissionId: "2f3ff35d-76be-4d47-ae8b-daf6c56b44ad",
    businessName: "Example Services",
    website: "https://exampleservices.com",
    owner: "Avery Morgan",
    email: "avery@example.com",
    phone: "+1 (202) 555-0142",
    industry: "Plumber",
    location: "Miami, Florida",
    smsConsent: true,
    source: "free-audit",
  });
});

test("hand-off is skipped when unconfigured and never throws", async (t) => {
  const saved = { url: process.env.N8N_AUDIT_INTAKE_URL, secret: process.env.N8N_AUDIT_INTAKE_SECRET };
  t.after(() => {
    for (const [key, value] of [["N8N_AUDIT_INTAKE_URL", saved.url], ["N8N_AUDIT_INTAKE_SECRET", saved.secret]]) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    t.mock.restoreAll();
  });
  const data = validateAuditRequest(payload());
  delete process.env.N8N_AUDIT_INTAKE_URL;
  delete process.env.N8N_AUDIT_INTAKE_SECRET;
  const fetchMock = t.mock.method(globalThis, "fetch", async () => Response.json({}));
  assert.deepEqual(await handOffAuditRequest(data), { ok: false, skipped: true });
  assert.equal(fetchMock.mock.callCount(), 0);

  process.env.N8N_AUDIT_INTAKE_URL = "https://n8n.example/webhook/dreki-audit-intake";
  process.env.N8N_AUDIT_INTAKE_SECRET = "intake-secret";
  fetchMock.mock.mockImplementation(async (url, options) => {
    assert.equal(url, "https://n8n.example/webhook/dreki-audit-intake");
    assert.equal(options.headers[HANDOFF_SECRET_HEADER], "intake-secret");
    assert.equal(JSON.parse(options.body).source, "free-audit");
    return new Response("{}", { status: 200 });
  });
  assert.deepEqual(await handOffAuditRequest(data), { ok: true, status: 200 });

  fetchMock.mock.mockImplementation(async () => new Response("no", { status: 403 }));
  assert.deepEqual(await handOffAuditRequest(data), { ok: false, status: 403 });

  fetchMock.mock.mockImplementation(async () => { throw new Error("ECONNREFUSED"); });
  assert.deepEqual(await handOffAuditRequest(data), { ok: false });
});
