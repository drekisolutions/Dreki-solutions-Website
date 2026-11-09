import test from "node:test";
import assert from "node:assert/strict";

import { handle } from "../lib/voice/http.mjs";
import { claimUrgentText } from "../lib/voice/store.mjs";
import { isUrgent, notifyUrgentCapture, urgentBody } from "../lib/voice/urgent.mjs";

const ACCOUNT = `AC${"a".repeat(32)}`;
const TOKEN = "voice-auth-token";
const TO = "+16025550199";
const FROM = "+15172157573";
const SERVICE = `MG${"c".repeat(32)}`;
const CALLER_CALLBACK = "+19995550100";
const AGENT = "a14c385f-e975-454f-a6f3-01d334da0d59";
const SECRET = "s".repeat(40);

function smsEnv(overrides = {}) {
  return {
    VOICE_TWILIO_ACCOUNT_SID: ACCOUNT,
    VOICE_TWILIO_AUTH_TOKEN: TOKEN,
    TWILIO_ACCOUNT_SID: `AC${"b".repeat(32)}`,
    TWILIO_AUTH_TOKEN: "fallback-token",
    VOICE_URGENT_SMS_TO: TO,
    TWILIO_FROM_NUMBER: FROM,
    ...overrides,
  };
}

function record(overrides = {}) {
  return {
    call_id: "11111111-1111-4111-8111-111111111111",
    kind: "callback",
    name: "Ada Lovelace",
    message: "The boiler is down.",
    callback_number: CALLER_CALLBACK,
    callback_confirmed: true,
    to: "+18885550123",
    urgent: true,
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

function smsPool() {
  const rows = [];
  const client = {
    async query(sql, params = []) {
      if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK" || sql.startsWith("SET LOCAL") || sql.includes("pg_advisory")) return { rows: [] };
      if (sql.startsWith("SELECT call_id FROM voice_urgent_sms")) {
        return { rows: rows.filter((row) => row.callId === params[0]).map((row) => ({ call_id: row.callId })) };
      }
      if (sql.startsWith("SELECT count(*)")) {
        return { rows: [{ n: rows.filter((row) => row.date === params[0]).length }] };
      }
      if (sql.startsWith("INSERT INTO voice_urgent_sms")) {
        rows.push({ callId: params[0], date: params[1] });
        return { rows: [] };
      }
      throw new Error(`unexpected sql ${sql}`);
    },
    release() {},
  };
  return { rows, async connect() { return client; } };
}

function captureCalls() {
  const seen = [];
  const request = async (url, options) => {
    seen.push({ url, options });
    return { ok: true };
  };
  return { seen, request };
}

test("urgent is a boolean or a message that starts with the word URGENT", () => {
  assert.equal(isUrgent(record()), true);
  assert.equal(isUrgent(record({ urgent: false, message: "URGENT: the line is down" })), true);
  assert.equal(isUrgent(record({ urgent: false, message: "  urgent the roof leaked" })), true);
  assert.equal(isUrgent(record({ urgent: false, message: "urgently needing a call" })), false);
  assert.equal(isUrgent(record({ urgent: false })), false);
});

test("SMS body stays under 320 characters and does not use the callback as the destination", () => {
  const body = urgentBody(record({ name: "N".repeat(200), message: "M".repeat(4000) }));
  assert.ok(body.length <= 319);
  assert.match(body, /^URGENT Sofia msg: N+, \+19995550100: M/);
  assert.doesNotMatch(body, /reply stop|opt out|unsubscribe/i);
});

test("Twilio form uses the allowlisted To and Basic auth from the voice credential", async () => {
  const { seen, request } = captureCalls();
  const result = await notifyUrgentCapture(smsPool(), record(), smsEnv(), request, new Date("2026-11-07T15:00:00.000Z"));
  assert.equal(result.sent, true);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].url, `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT}/Messages.json`);
  assert.equal(seen[0].options.headers["Content-Type"], "application/x-www-form-urlencoded");
  assert.equal(seen[0].options.body.startsWith("{"), false);
  const form = new URLSearchParams(seen[0].options.body);
  assert.equal(form.get("To"), TO);
  assert.notEqual(form.get("To"), CALLER_CALLBACK);
  assert.notEqual(form.get("To"), "+18885550123");
  assert.equal(form.get("From"), FROM);
  assert.equal(form.get("MessagingServiceSid"), null);
  assert.match(form.get("Body"), /^URGENT Sofia msg: Ada Lovelace, \+19995550100: The boiler is down\.$/);
  assert.equal(Buffer.from(seen[0].options.headers.Authorization.replace("Basic ", ""), "base64").toString(), `${ACCOUNT}:${TOKEN}`);
});

test("a messaging service replaces From, and an API key is used only without an auth token", async () => {
  const service = captureCalls();
  await notifyUrgentCapture(smsPool(), record({ call_id: "22222222-2222-4222-8222-222222222222" }), smsEnv({ TWILIO_MESSAGING_SERVICE_SID: SERVICE }), service.request, new Date("2026-11-07T15:00:00.000Z"));
  const serviceForm = new URLSearchParams(service.seen[0].options.body);
  assert.equal(serviceForm.get("MessagingServiceSid"), SERVICE);
  assert.equal(serviceForm.get("From"), null);
  assert.equal(serviceForm.get("To"), TO);

  const keyed = captureCalls();
  const env = smsEnv({
    VOICE_TWILIO_AUTH_TOKEN: "",
    TWILIO_AUTH_TOKEN: "",
    TWILIO_API_KEY_SID: "SK123",
    TWILIO_API_KEY_SECRET: "key-secret",
  });
  await notifyUrgentCapture(smsPool(), record({ call_id: "33333333-3333-4333-8333-333333333333" }), env, keyed.request, new Date("2026-11-07T15:00:00.000Z"));
  assert.equal(Buffer.from(keyed.seen[0].options.headers.Authorization.replace("Basic ", ""), "base64").toString(), "SK123:key-secret");
  assert.match(keyed.seen[0].url, new RegExp(`/Accounts/${ACCOUNT}/`));
});

test("after-hours gate includes weekends, the 5 PM boundary, and ordinary holiday weekdays", async () => {
  const cases = [
    ["2026-11-07T15:00:00.000Z", true],
    ["2026-11-09T13:59:00.000Z", true],
    ["2026-11-09T14:00:00.000Z", false],
    ["2026-11-06T21:59:00.000Z", false],
    ["2026-11-06T22:00:00.000Z", true],
    ["2026-07-10T21:00:00.000Z", true],
    ["2026-12-25T15:00:00.000Z", false],
  ];
  for (const [iso, expectSend] of cases) {
    const { seen, request } = captureCalls();
    const result = await notifyUrgentCapture(smsPool(), record(), smsEnv(), request, new Date(iso));
    assert.equal(result.sent, expectSend, iso);
    assert.equal(seen.length, expectSend ? 1 : 0, iso);
  }
});

test("each call texts once and the Detroit day stops at 10", async () => {
  const pool = smsPool();
  const { seen, request } = captureCalls();
  const when = new Date("2026-11-07T15:00:00.000Z");
  const first = await notifyUrgentCapture(pool, record(), smsEnv(), request, when);
  const again = await notifyUrgentCapture(pool, record({ message: "URGENT second try" }), smsEnv(), request, when);
  assert.equal(first.sent, true);
  assert.deepEqual(again, { sent: false, reason: "suppressed" });
  assert.equal(seen.length, 1);

  const capped = smsPool();
  const calls = captureCalls();
  for (let i = 0; i < 10; i += 1) {
    const sent = await notifyUrgentCapture(capped, record({ call_id: `call-${i}` }), smsEnv(), calls.request, when);
    assert.equal(sent.sent, true);
  }
  const blocked = await notifyUrgentCapture(capped, record({ call_id: "call-10" }), smsEnv(), calls.request, when);
  assert.deepEqual(blocked, { sent: false, reason: "suppressed" });
  assert.equal(calls.seen.length, 10);
  assert.equal(await claimUrgentText(capped, "call-0", "2026-11-07"), false);
});

test("missing SMS configuration is skipped and a Twilio error does not throw", async () => {
  const quiet = captureCalls();
  const missing = await notifyUrgentCapture(smsPool(), record(), smsEnv({ VOICE_URGENT_SMS_TO: "" }), quiet.request, new Date("2026-11-07T15:00:00.000Z"));
  assert.deepEqual(missing, { sent: false, reason: "config" });
  assert.equal(quiet.seen.length, 0);

  const failed = await notifyUrgentCapture(smsPool(), record(), smsEnv(), async () => { throw new Error("socket hang up"); }, new Date("2026-11-07T15:00:00.000Z"));
  assert.deepEqual(failed, { sent: false, reason: "error" });
  const rejected = await notifyUrgentCapture(smsPool(), record({ call_id: "44444444-4444-4444-8444-444444444444" }), smsEnv(), async () => ({ ok: false }), new Date("2026-11-07T15:00:00.000Z"));
  assert.deepEqual(rejected, { sent: false, reason: "twilio" });
});

test("a Twilio failure still saves the capture and queues email and ClickUp", async () => {
  const callId = "55555555-5555-4555-8555-555555555555";
  let queued = false;
  const pool = {
    async query(sql) {
      if (sql.includes("FROM voice_records")) return { rows: [] };
      throw new Error(sql);
    },
    async connect() {
      return {
        async query(sql) {
          if (sql === "BEGIN" || sql === "COMMIT" || sql.startsWith("SET LOCAL")) return { rows: [] };
          if (sql.includes("voice_records")) return { rows: [{ same: true }] };
          if (sql.includes("voice_delivery")) return { rows: [] };
          throw new Error(sql);
        },
        release() {},
      };
    },
  };
  const created = new Date(Date.now() - 60_000).toISOString();
  const response = await handle(new Request("https://www.dreki-solutions.ai/api/voice/capture", {
    method: "POST",
    headers: { authorization: `Bearer ${SECRET}`, "content-type": "application/json" },
    body: JSON.stringify({
      call_id: callId,
      kind: "lead",
      name: "Ada Lovelace",
      message: "URGENT the line is down",
      callback_number: CALLER_CALLBACK,
      callback_confirmed: true,
      message_confirmed: true,
    }),
  }), {
    pool,
    c: { blandWebhookSecret: SECRET, blandToken: "bland", caller: FROM, agentId: AGENT },
    after() { queued = true; },
    blandRequest: async () => jsonResponse({
      call_id: callId,
      inbound: true,
      from: CALLER_CALLBACK,
      to: FROM,
      created_at: created,
      completed: false,
      queue_status: "started",
      agent_id: AGENT,
      agent_version_id: "66666666-6666-4666-8666-666666666666",
      sid: `CA${"ab".repeat(16)}`,
    }),
    notifyUrgent: async () => { throw new Error("twilio exploded"); },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { saved: true, delivery: "queued" });
  assert.equal(queued, true);
});
