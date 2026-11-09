import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

import { captureRecord, verifiedBlandRecord, verifyBlandCall } from "../lib/voice/bland.mjs";
import { config } from "../lib/voice/config.mjs";
import { sendReport } from "../lib/voice/delivery.mjs";
import { handle } from "../lib/voice/http.mjs";
import { validateRecord } from "../lib/voice/store.mjs";
import { transferOpen } from "../lib/voice/transfer.mjs";

const CALL_ID = "11111111-1111-4111-8111-111111111111";
const AGENT_ID = "a14c385f-e975-454f-a6f3-01d334da0d59";
const CALLER = "+15172157573";
const NOW = Date.parse("2026-11-09T21:00:00.000Z");
const SEND = "https://www.googleapis.com/auth/gmail.send";
const SECRET = "s".repeat(40);

function voiceEnv(overrides = {}) {
  return {
    VOICE_PUBLIC_ORIGIN: "https://www.dreki-solutions.ai",
    VOICE_TWILIO_ACCOUNT_SID: `AC${"a".repeat(32)}`,
    VOICE_INBOUND_NUMBER: CALLER,
    VOICE_TRANSFER_NUMBER: "+16026775926",
    VOICE_TWILIO_APP_SID: `AP${"b".repeat(32)}`,
    VOICE_TWILIO_AUTH_TOKEN: "twilio-token-value",
    VOICE_CLICKUP_TOKEN: "pk_test_clickup",
    VOICE_GMAIL_CREDENTIALS: JSON.stringify({
      scope: SEND,
      sender: "brett@dreki-solutions.com",
      client_id: "existing-client.apps.googleusercontent.com",
      client_secret: "existing-client-secret",
      refresh_token: "existing-refresh-token",
    }),
    VOICE_WORKER_SECRET: "w".repeat(32),
    VOICE_BLAND_TOKEN: "bland-token",
    VOICE_BLAND_WEBHOOK_SECRET: SECRET,
    VOICE_CLICKUP_LIST_ID: "901423130318",
    VOICE_NOTIFY_EMAIL: "brett@dreki-solutions.com",
    ...overrides,
  };
}

function report(overrides = {}) {
  return {
    call_id: CALL_ID,
    kind: "callback",
    name: "Ada Lovelace",
    message: "Please call about the audit.",
    callback_number: "+15175551212",
    callback_confirmed: true,
    ...overrides,
  };
}

function jsonResponse(body, ok = true) {
  const bytes = Buffer.from(JSON.stringify(body));
  return {
    ok,
    body: {
      getReader() {
        let sent = false;
        return {
          async read() {
            if (sent) return { done: true, value: undefined };
            sent = true;
            return { done: false, value: bytes };
          },
          async cancel() {},
        };
      },
    },
  };
}

function blandCall(overrides = {}) {
  return {
    call_id: CALL_ID,
    inbound: true,
    from: "+15175550199",
    to: CALLER,
    created_at: new Date(NOW - 60_000).toISOString(),
    completed: false,
    queue_status: "started",
    agent_id: AGENT_ID,
    persona_id: "persona-no-longer-checked",
    pathway_id: "pathway-no-longer-checked",
    agent_version_id: "22222222-2222-4222-8222-222222222222",
    sid: `CA${"ab".repeat(16)}`,
    ...overrides,
  };
}

function blandClient(call = blandCall()) {
  const seen = [];
  const request = async (url, options) => {
    seen.push({ url, options });
    return jsonResponse(call);
  };
  return { seen, request, identity: { blandToken: "bland-token", caller: CALLER, agentId: AGENT_ID } };
}

test("capture accepts a confirmed callback and normalizes US numbers", () => {
  const tenDigit = captureRecord({ ...report(), callback_number: "(517) 555-1212", message_confirmed: true });
  assert.equal(tenDigit.callback_number, "+15175551212");
  assert.equal(tenDigit.message_confirmed, undefined);
  assert.equal(validateRecord(tenDigit), `${CALL_ID}:callback`);

  const withCountry = captureRecord({ ...report({ kind: "lead" }), callback_number: "1 517 555 1212", message_confirmed: true });
  assert.equal(withCountry.kind, "lead");
  assert.equal(withCountry.callback_number, "+15175551212");
});

test("capture accepts a null callback and rejects unconfirmed or extra fields", () => {
  const saved = captureRecord({
    ...report({ callback_number: null, callback_confirmed: false }),
    message_confirmed: true,
  });
  assert.equal(saved.callback_number, null);
  assert.equal(validateRecord(saved), `${CALL_ID}:callback`);

  assert.throws(
    () => captureRecord({ ...report({ callback_number: null, callback_confirmed: true }), message_confirmed: true }),
    /Invalid report/,
  );
  assert.throws(() => captureRecord({ ...report(), message_confirmed: false }), /approval required/);
  assert.throws(() => captureRecord({ ...report(), callback_confirmed: false, message_confirmed: true }), /Callback confirmation/);
  assert.throws(() => captureRecord({ ...report(), message_confirmed: true, urgent: true }), /Invalid report/);
  assert.throws(() => captureRecord({ ...report({ kind: "urgent" }), message_confirmed: true }), /Invalid report/);
  assert.throws(() => captureRecord({ ...report({ message: "   " }), message_confirmed: true }), /Invalid report/);
  assert.throws(() => captureRecord({ ...report({ message: "x".repeat(4001) }), message_confirmed: true }), /Invalid report/);
  assert.throws(() => captureRecord({ ...report({ name: "n".repeat(201) }), message_confirmed: true }), /Invalid report/);
});

test("capture HTTP rejects an invalid report before persistence", async () => {
  const request = new Request("https://www.dreki-solutions.ai/api/voice/capture", {
    method: "POST",
    headers: { authorization: `Bearer ${SECRET}`, "content-type": "application/json" },
    body: JSON.stringify({ ...report(), message_confirmed: true, extra: true }),
  });
  let usedPool = false;
  const response = await handle(request, {
    pool: { query: () => { usedPool = true; throw new Error("pool used"); } },
    c: { blandWebhookSecret: SECRET },
  });
  assert.equal(response.status, 422);
  assert.deepEqual(await response.json(), { saved: false, error: "Invalid report" });
  assert.equal(usedPool, false);
});

test("ClickUp list comes only from VOICE_CLICKUP_LIST_ID", () => {
  const configured = config(voiceEnv());
  assert.equal(configured.list, "901423130318");
  assert.equal(configured.email, "brett@dreki-solutions.com");
  assert.equal(configured.agentId, AGENT_ID);
  assert.equal(configured.personaId, undefined);
  assert.equal(configured.pathwayId, undefined);

  const missing = voiceEnv();
  delete missing.VOICE_CLICKUP_LIST_ID;
  assert.throws(() => config(missing), /VOICE_CLICKUP_LIST_ID must be a digits-only ClickUp list id/);
  for (const list of ["", "901421122364 ", "9014-231", "abc", "901423130318\n"]) {
    assert.throws(() => config(voiceEnv({ VOICE_CLICKUP_LIST_ID: list })), /VOICE_CLICKUP_LIST_ID/);
  }
  assert.throws(() => config(voiceEnv({ VOICE_NOTIFY_EMAIL: "brett@dreki-solutions" })), /VOICE_NOTIFY_EMAIL must be a single email address/);
  assert.throws(() => config(voiceEnv({ VOICE_NOTIFY_EMAIL: "brett@dreki-solutions.com\nBcc:evil@example.com" })), /VOICE_NOTIFY_EMAIL/);
  assert.equal(config(voiceEnv({ VOICE_BLAND_AGENT_ID: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" })).agentId, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
  assert.throws(() => config(voiceEnv({ VOICE_BLAND_AGENT_ID: "sofia" })), /VOICE_BLAND_AGENT_ID must be a UUID/);
});

test("ClickUp task name includes the caller and keeps the call id in the description", async () => {
  const seen = [];
  const record = report({ kind: "lead", callback_number: null, callback_confirmed: false, name: "Ada\r\nLovelace" });
  const id = await sendReport("clickup", record, config(voiceEnv()), `${CALL_ID}:lead`, async (url, options) => {
    seen.push({ url, options });
    return jsonResponse({ id: "task_1" });
  });
  assert.equal(id, "task_1");
  assert.equal(seen[0].url, "https://api.clickup.com/api/v2/list/901423130318/task");
  const body = JSON.parse(seen[0].options.body);
  assert.equal(body.name, "Sofia lead: Ada Lovelace (no number)");
  assert.match(body.description, new RegExp(`Call reference: ${CALL_ID}`));
  assert.equal(seen[0].options.headers.Authorization, "pk_test_clickup");

  const numbered = [];
  await sendReport("clickup", report(), config(voiceEnv()), `${CALL_ID}:callback`, async (url, options) => {
    numbered.push(JSON.parse(options.body));
    return jsonResponse({ id: "task_2" });
  });
  assert.equal(numbered[0].name, "Sofia callback: Ada Lovelace (+15175551212)");
});

test("email delivery sends through Gmail and keeps the existing send credential", async () => {
  const seen = [];
  const record = report({ kind: "lead", name: "Ada\r\nBcc: evil@example.com" });
  const id = await sendReport("email", record, config(voiceEnv()), `${CALL_ID}:lead`, async (url, options) => {
    seen.push({ url, options });
    if (String(url).includes("oauth2.googleapis.com")) return jsonResponse({ access_token: "ya29.test" });
    return jsonResponse({ id: "msg_1" });
  });
  assert.equal(id, "msg_1");
  assert.equal(seen[0].url, "https://oauth2.googleapis.com/token");
  const token = new URLSearchParams(seen[0].options.body);
  assert.equal(token.get("grant_type"), "refresh_token");
  assert.equal(token.get("client_id"), "existing-client.apps.googleusercontent.com");
  assert.equal(token.get("refresh_token"), "existing-refresh-token");
  assert.equal(seen[1].url, "https://gmail.googleapis.com/gmail/v1/users/me/messages/send");
  assert.equal(seen[1].options.headers.Authorization, "Bearer ya29.test");
  const payload = JSON.parse(seen[1].options.body);
  assert.deepEqual(Object.keys(payload), ["raw"]);
  const mime = Buffer.from(payload.raw, "base64url").toString("utf8").replaceAll("\r", "");
  assert.match(mime, /^From: brett@dreki-solutions\.com/m);
  assert.match(mime, /^To: brett@dreki-solutions\.com/m);
  assert.match(mime, /^Subject: Sofia: lead from Ada Bcc: evil@example.com$/m);
  assert.doesNotMatch(mime, /^(Bcc|Cc):/m);
  assert.equal(seen.some((call) => String(call.url).includes("/drafts")), false);
});

test("Gmail rejects a compose scope or a sender that differs from VOICE_NOTIFY_EMAIL", async () => {
  const configured = config(voiceEnv());
  const composeScoped = { ...configured, gmail: { ...configured.gmail, scope: "https://www.googleapis.com/auth/gmail.compose" } };
  let called = false;
  await assert.rejects(
    () => sendReport("email", report(), composeScoped, `${CALL_ID}:callback`, async () => { called = true; throw new Error("network"); }),
    (error) => error.definitelyNotSent === true,
  );
  assert.equal(called, false);

  const otherSender = { ...configured, gmail: { ...configured.gmail, sender: "other@dreki-solutions.com" } };
  await assert.rejects(
    () => sendReport("email", report(), otherSender, `${CALL_ID}:callback`, async () => { throw new Error("network"); }),
    (error) => error.definitelyNotSent === true,
  );
});

test("voice mail uses Gmail send and does not create drafts", () => {
  const source = readdirSync(new URL("../lib/voice/", import.meta.url))
    .filter((name) => name.endsWith(".mjs"))
    .map((name) => readFileSync(new URL(`../lib/voice/${name}`, import.meta.url), "utf8"))
    .join("\n");
  assert.match(source, /gmail\/v1\/users\/me\/messages\/send/);
  assert.match(source, /https:\/\/www\.googleapis\.com\/auth\/gmail\.send/);
  assert.doesNotMatch(source, /\/drafts/);
  assert.doesNotMatch(source, /gmail\.compose/);
});

test("Bland verification requires Sofia's agent id and ignores persona and pathway ids", async () => {
  const inbound = blandClient();
  const call = await verifyBlandCall(CALL_ID, inbound.identity, inbound.request, NOW);
  assert.equal(call.agent_id, AGENT_ID);
  assert.match(inbound.seen[0].url, /agent_id/);
  assert.match(inbound.seen[0].url, /(?:^|[?&,])from(?:,|&|$)/);
  assert.doesNotMatch(inbound.seen[0].url, /persona_id|pathway_id/);
  assert.equal(inbound.seen[0].options.headers.authorization, "bland-token");

  const wrongAgent = blandClient(blandCall({ agent_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" }));
  await assert.rejects(() => verifyBlandCall(CALL_ID, wrongAgent.identity, wrongAgent.request, NOW), /not verified/);
  const missingAgent = blandClient(blandCall({ agent_id: null }));
  await assert.rejects(() => verifyBlandCall(CALL_ID, missingAgent.identity, missingAgent.request, NOW), /not verified/);
  const otherNumber = blandClient(blandCall({ to: "+16026775926" }));
  await assert.rejects(() => verifyBlandCall(CALL_ID, otherNumber.identity, otherNumber.request, NOW), /not verified/);
  const finished = blandClient(blandCall({ completed: true }));
  await assert.rejects(() => verifyBlandCall(CALL_ID, finished.identity, finished.request, NOW), /not verified/);
  const stale = blandClient(blandCall({ created_at: new Date(NOW - 600_001).toISOString() }));
  await assert.rejects(() => verifyBlandCall(CALL_ID, stale.identity, stale.request, NOW), /not verified/);
});

test("capture accepts an in-progress outbound call from the configured number", async () => {
  const outbound = blandClient(blandCall({ inbound: false, from: CALLER, to: "+15175551212" }));
  await assert.rejects(() => verifyBlandCall(CALL_ID, outbound.identity, outbound.request, NOW), /not verified/);
  const saved = await verifiedBlandRecord(report(), outbound.identity, outbound.request, NOW);
  assert.equal(saved.call_id, CALL_ID);

  const otherFrom = blandClient(blandCall({ inbound: false, from: "+16026775926", to: "+15175551212" }));
  await assert.rejects(() => verifiedBlandRecord(report(), otherFrom.identity, otherFrom.request, NOW), /not verified/);
});

test("handoff hours are Monday through Friday, 9 AM until 5 PM America/New_York", () => {
  const at = (iso) => transferOpen(new Date(iso));
  assert.equal(at("2026-11-09T13:59:00.000Z"), false);
  assert.equal(at("2026-11-09T14:00:00.000Z"), true);
  assert.equal(at("2026-11-06T20:59:00.000Z"), true);
  assert.equal(at("2026-11-06T21:00:00.000Z"), true);
  assert.equal(at("2026-11-06T21:59:00.000Z"), true);
  assert.equal(at("2026-11-06T22:00:00.000Z"), false);
  assert.equal(at("2026-11-08T15:00:00.000Z"), false);
  assert.equal(at("2026-07-10T19:59:00.000Z"), true);
  assert.equal(at("2026-07-10T20:00:00.000Z"), true);
  assert.equal(at("2026-07-10T21:00:00.000Z"), false);
});
