import test from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import { BILLING_SCOPE, billingOffers } from "../lib/billing/catalog.ts";
import {
  cancellationToken,
  readCancellationToken,
  commitmentEnd,
  managedSubscription,
  ensureCommitment,
  cancelManagedSubscription,
  createServiceCheckout,
  handleBillingEvent,
} from "../lib/billing/stripe.ts";
const at = (text) => Date.parse(text) / 1000;
const start = at("2026-11-21T17:00:00Z");
const end = at("2027-02-21T17:00:00Z");
function subscription(overrides = {}) {
  return {
    id: "sub_test",
    status: "active",
    start_date: start,
    metadata: { integration: BILLING_SCOPE, offer: "social-media-marketing" },
    schedule: null,
    items: {
      data: [
        {
          quantity: 1,
          price: {
            id: "price_test",
            product: billingOffers["social-media-marketing"].product,
            currency: "usd",
            unit_amount: 100000,
            recurring: { interval: "month", interval_count: 1 },
          },
          current_period_end: at("2026-12-21T17:00:00Z"),
        },
      ],
    },
    ...overrides,
  };
}
function fakeStripe(sub = subscription()) {
  const calls = [];
  const schedule = {
    id: "sub_sched_test",
    status: "active",
    phases: [{ start_date: start, end_date: end }],
    metadata: {},
  };
  return {
    calls,
    schedule,
    sub,
    subscriptionSchedules: {
      create: async (params) => {
        calls.push(["create", params]);
        sub.schedule = schedule.id;
        return structuredClone(schedule);
      },
      retrieve: async () => structuredClone(schedule),
      update: async (id, params) => {
        calls.push(["schedule", id, params]);
        if (params.phases) schedule.phases = params.phases;
        if (params.metadata) Object.assign(schedule.metadata, params.metadata);
        if (params.end_behavior) schedule.end_behavior = params.end_behavior;
        return structuredClone(schedule);
      },
    },
    subscriptions: {
      retrieve: async () => structuredClone(sub),
      update: async (id, params) => {
        calls.push(["subscription", id, params]);
        if (params.metadata) Object.assign(sub.metadata, params.metadata);
        if (params.cancel_at_period_end) sub.cancel_at_period_end = true;
        return structuredClone(sub);
      },
    },
  };
}
test("three-month calendar term preserves UTC billing time and clamps month ends", () => {
  assert.equal(commitmentEnd(start), end);
  assert.equal(
    commitmentEnd(at("2027-01-31T23:12:00Z")),
    at("2027-04-30T23:12:00Z"),
  );
  assert.equal(
    commitmentEnd(at("2027-11-30T10:00:00Z")),
    at("2028-02-29T10:00:00Z"),
  );
});
test("term enforcement only accepts the exact two monthly website offers and fixed quantity", () => {
  assert.equal(managedSubscription(subscription()), true);
  for (const mutation of [
    { metadata: {} },
    { items: { data: [] } },
    { metadata: { integration: BILLING_SCOPE, offer: "business-brand-kit" } },
  ])
    assert.equal(managedSubscription(subscription(mutation)), false);
  const sub = subscription();
  sub.items.data[0].quantity = 2;
  assert.equal(managedSubscription(sub), false);
});
test("new subscription gets a three-month locked schedule and releases to monthly renewal", async () => {
  const stripe = fakeStripe();
  assert.equal(await ensureCommitment(stripe, stripe.sub, start), end);
  assert.equal(stripe.schedule.end_behavior, "release");
  assert.equal(stripe.schedule.phases[0].end_date, end);
  assert.equal(stripe.schedule.phases[0].items[0].quantity, 1);
  assert.equal(stripe.sub.metadata.commitment_end, String(end));
  const writes = stripe.calls.length;
  await ensureCommitment(stripe, stripe.sub, start + 10);
  assert.equal(stripe.calls.length, writes);
});
test("cancellation during month one or two retains the entire commitment phase", async () => {
  for (const now of [start, at("2027-01-21T17:00:00Z")]) {
    const stripe = fakeStripe();
    const result = await cancelManagedSubscription(stripe, stripe.sub, now);
    assert.equal(result.end, end);
    assert.equal(stripe.schedule.end_behavior, "cancel");
    assert.equal(stripe.schedule.phases[0].end_date, end);
    assert.equal(stripe.sub.cancel_at_period_end, undefined);
  }
});
test("after release, cancellation ends the current monthly period without re-locking", async () => {
  const sub = subscription({
    metadata: {
      integration: BILLING_SCOPE,
      offer: "social-media-marketing",
      commitment_end: String(end),
      commitment_schedule: "sub_sched_old",
    },
  });
  sub.items.data[0].current_period_end = at("2027-03-21T17:00:00Z");
  const stripe = fakeStripe(sub);
  const result = await cancelManagedSubscription(stripe, sub, end + 86400);
  assert.equal(result.end, at("2027-03-21T17:00:00Z"));
  assert.equal(sub.cancel_at_period_end, true);
  assert.equal(
    stripe.calls.some((c) => c[0] === "create"),
    false,
  );
});
test("recovery preserves the original commitment end when a schedule is missing", async () => {
  const stripe = fakeStripe(
    subscription({
      metadata: {
        integration: BILLING_SCOPE,
        offer: "social-media-marketing",
        commitment_end: String(end),
        commitment_schedule: "sub_sched_old",
      },
    }),
  );
  await ensureCommitment(stripe, stripe.sub, start + 86400 * 40);
  assert.equal(stripe.schedule.phases[0].end_date, end);
});
test("cancellation tokens reject tampering, expiry, other secrets and malformed data", () => {
  const secret = "test signing secret ".repeat(4),
    now = Date.now();
  const token = cancellationToken("sub_test", now, secret);
  assert.equal(readCancellationToken(token, now, secret), "sub_test");
  for (const value of [
    token + "x",
    "x" + token,
    "junk",
    "",
    null,
    token + ".extra",
  ])
    assert.equal(readCancellationToken(value, now, secret), null);
  assert.equal(readCancellationToken(token, now + 86400001, secret), null);
  assert.equal(readCancellationToken(token, now, "different ".repeat(6)), null);
});
test("checkout enforces catalogue amount, term consent, fixed quantity, option choice and idempotency", async () => {
  const offer = billingOffers["social-media-marketing"],
    requests = [];
  const stripe = {
    products: {
      retrieve: async () => ({
        active: true,
        tax_code: "txcd_10701100",
        default_price: {
          id: "price_test",
          active: true,
          currency: "usd",
          unit_amount: 100000,
          recurring: { interval: "month", interval_count: 1 },
        },
      }),
    },
    checkout: {
      sessions: {
        create: async (params, opts) => {
          requests.push({ params, opts });
          return { status: "open" };
        },
      },
    },
  };
  await assert.rejects(
    createServiceCheckout(stripe, "social-media-marketing", "both", "attempt"),
  );
  await createServiceCheckout(
    stripe,
    "social-media-marketing",
    "mixed",
    "attempt",
  );
  await createServiceCheckout(
    stripe,
    "social-media-marketing",
    "mixed",
    "attempt",
  );
  assert.deepEqual(requests[0], requests[1]);
  const p = requests[0].params;
  assert.equal(p.mode, "subscription");
  assert.deepEqual(p.line_items, [{ price: "price_test", quantity: 1 }]);
  assert.equal(p.consent_collection.terms_of_service, "required");
  assert.equal(p.subscription_data.metadata.content_option, "mixed");
  assert.equal(p.subscription_data.metadata.offer, "social-media-marketing");
  assert.equal(Object.hasOwn(p, "payment_method_types"), false);
  stripe.products.retrieve = async () => ({
    active: true,
    tax_code: "txcd_10701100",
    default_price: {
      active: true,
      currency: "usd",
      unit_amount: offer.amount - 1,
    },
  });
  await assert.rejects(
    createServiceCheckout(stripe, "social-media-marketing", "mixed", "attempt"),
  );
});
test("signed webhook verification rejects altered payloads before billing work", () => {
  const stripe = new Stripe("sk_test_fixture");
  const payload = JSON.stringify({ id: "evt_fixture", type: "invoice.paid" });
  const secret = "whsec_fixture";
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
  assert.equal(
    stripe.webhooks.constructEvent(payload, header, secret).id,
    "evt_fixture",
  );
  assert.throws(() =>
    stripe.webhooks.constructEvent(payload + " ", header, secret),
  );
});
test("unpaid one-time checkout and unrelated subscriptions never trigger fulfillment", async () => {
  let notified = 0;
  const stripe = fakeStripe(subscription({ metadata: {} }));
  await handleBillingEvent(
    stripe,
    {
      id: "evt_unrelated",
      type: "customer.subscription.updated",
      data: { object: { id: "sub_test" } },
    },
    async () => notified++,
  );
  stripe.checkout = {
    sessions: {
      retrieve: async () => ({
        metadata: { integration: BILLING_SCOPE },
        mode: "payment",
        payment_status: "unpaid",
      }),
    },
  };
  await handleBillingEvent(
    stripe,
    {
      id: "evt_unpaid",
      type: "checkout.session.completed",
      data: { object: { id: "cs_test" } },
    },
    async () => notified++,
  );
  assert.equal(notified, 0);
  assert.equal(stripe.calls.length, 0);
});
