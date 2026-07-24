import test from "node:test";
import assert from "node:assert/strict";

import {
  MINIMUM_SUBMISSION_TIME_MS,
  validateLeadPayload,
} from "../lib/leads/validation.ts";

const now = 2_000_000;

function validPayload(overrides = {}) {
  return {
    submissionId: "2f3ff35d-76be-4d47-ae8b-daf6c56b44ad",
    fullName: "  Avery   Morgan ",
    email: " Avery.Morgan@Example.com ",
    company: " Northstar Services ",
    industry: "professional_services",
    areaOfInterest: "workflow_coordination",
    workflowChallenge: "Our intake handoffs create slow customer follow-up.",
    timeline: "one_to_three_months",
    phone: "",
    processingAcknowledgment: true,
    marketingConsent: false,
    contactWebsite: "",
    submissionElapsedMs: MINIMUM_SUBMISSION_TIME_MS + 1,
    pagePath: "/contact",
    source: "contact",
    utmSource: "LinkedIn",
    utmCampaign: "Service Agents 2026",
    ...overrides,
  };
}

test("normalizes an accepted lead and keeps bounded attribution", () => {
  const result = validateLeadPayload(validPayload(), { now });

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.data.fullName, "Avery Morgan");
  assert.equal(
    result.data.submissionId,
    "2f3ff35d-76be-4d47-ae8b-daf6c56b44ad",
  );
  assert.equal(result.data.email, "avery.morgan@example.com");
  assert.equal(result.data.company, "Northstar Services");
  assert.equal(result.data.phone, undefined);
  assert.equal(result.data.utmSource, "LinkedIn");
});

test("requires processing acknowledgment", () => {
  const result = validateLeadPayload(
    validPayload({ processingAcknowledgment: false }),
    { now },
  );

  assert.deepEqual(result, { ok: false, kind: "invalid" });
});

test("requires a version-four submission id", () => {
  const result = validateLeadPayload(
    validPayload({ submissionId: "not-an-idempotency-key" }),
    { now },
  );

  assert.deepEqual(result, { ok: false, kind: "invalid" });
});

test("rejects a completed honeypot and an implausibly fast submission", () => {
  assert.deepEqual(
    validateLeadPayload(validPayload({ contactWebsite: "bot.example" }), {
      now,
    }),
    { ok: false, kind: "suspected_spam" },
  );
  assert.deepEqual(
    validateLeadPayload(validPayload({ submissionElapsedMs: 500 }), { now }),
    { ok: false, kind: "suspected_spam" },
  );
});

test("rejects oversized fields and malformed page paths", () => {
  assert.equal(
    validateLeadPayload(
      validPayload({ workflowChallenge: "x".repeat(1_501) }),
      { now },
    ).ok,
    false,
  );
  assert.equal(
    validateLeadPayload(validPayload({ pagePath: "//attacker.example" }), {
      now,
    }).ok,
    false,
  );
});

test("drops unsafe campaign values instead of forwarding personal data", () => {
  const result = validateLeadPayload(
    validPayload({
      utmSource: "person@example.com",
      utmCampaign: "spring/sale",
    }),
    { now },
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.data.utmSource, undefined);
  assert.equal(result.data.utmCampaign, undefined);
});
