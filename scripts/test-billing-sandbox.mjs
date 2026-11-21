// Disposable test-clock acceptance checks. Refuses every live API key.
import Stripe from "stripe";
import assert from "node:assert/strict";
import { BILLING_SCOPE, billingOffers } from "../lib/billing/catalog.ts";
import {
  ensureCommitment,
  cancelManagedSubscription,
  commitmentEnd,
} from "../lib/billing/stripe.ts";
if (!process.env.STRIPE_SECRET_KEY?.includes("_test_"))
  throw new Error("A disposable test key is required");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const taxSettings = await stripe.tax.settings.retrieve();
// The existing sandbox has no tax head-office setup. Exercise real billing clocks
// with tax off; production tax is independently checked by live empty sessions.
// Do not alter shared sandbox account settings to make a fixture pass.
const taxActive = taxSettings.status === "active";
const updateSchedule = stripe.subscriptionSchedules.update.bind(
  stripe.subscriptionSchedules,
);
stripe.subscriptionSchedules.update = (id, params, options) =>
  updateSchedule(
    id,
    {
      ...params,
      ...(params.phases && !taxActive
        ? {
            phases: params.phases.map((phase) => ({
              ...phase,
              automatic_tax: { enabled: false },
            })),
          }
        : {}),
    },
    options,
  );
const frozen = Math.floor(Date.now() / 1000);
async function advance(clock, time) {
  await stripe.testHelpers.testClocks.advance(clock, { frozen_time: time });
  for (let tries = 0; tries < 90; tries++) {
    const value = await stripe.testHelpers.testClocks.retrieve(clock);
    if (value.status === "ready") return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Test clock did not finish");
}
function plusMonths(start, months) {
  const d = new Date(start * 1000),
    day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
  ).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return Math.floor(d.getTime() / 1000);
}
for (const offer of ["social-media-marketing", "monthly-content-retainer"]) {
  const product = await stripe.products.create({
    name: "TEST ONLY " + billingOffers[offer].name,
    tax_code: "txcd_10701100",
  });
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 100000,
    currency: "usd",
    tax_behavior: "exclusive",
    recurring: { interval: "month" },
  });
  // This mapping exists only inside this disposable test process.
  billingOffers[offer].product = product.id;
  for (const scenario of ["early-cancellation", "monthly-renewal"]) {
    const clock = await stripe.testHelpers.testClocks.create({
      frozen_time: frozen,
      name: "Dreki " + offer + " " + scenario,
    });
    const customer = await stripe.customers.create({
      name: "Synthetic billing test",
      email: "billing-test@example.invalid",
      test_clock: clock.id,
      address: {
        country: "US",
        state: "MI",
        postal_code: "48201",
        city: "Detroit",
        line1: "123 Test Street",
      },
      payment_method: "pm_card_visa",
      invoice_settings: { default_payment_method: "pm_card_visa" },
    });
    let sub = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      payment_behavior: "error_if_incomplete",
      metadata: { integration: BILLING_SCOPE, offer, terms: "2026-11-21" },
      automatic_tax: { enabled: taxActive },
    });
    const end = await ensureCommitment(stripe, sub, frozen);
    assert.equal(end, commitmentEnd(sub.start_date));
    sub = await stripe.subscriptions.retrieve(sub.id);
    if (scenario === "early-cancellation") {
      const result = await cancelManagedSubscription(stripe, sub, frozen);
      assert.equal(result.end, end);
    }
    for (let month = 1; month <= 3; month++)
      await advance(clock.id, plusMonths(frozen, month) + 7200);
    sub = await stripe.subscriptions.retrieve(sub.id);
    let invoices = (
      await stripe.invoices.list({ customer: customer.id, limit: 100 })
    ).data.filter((i) => i.status === "paid");
    if (scenario === "early-cancellation") {
      assert.equal(sub.status, "canceled");
      assert.equal(invoices.length, 3);
      assert.equal(
        invoices.reduce((sum, invoice) => sum + invoice.amount_paid, 0),
        300000,
      );
    } else {
      assert.equal(sub.status, "active");
      assert.equal(sub.schedule, null);
      assert.equal(invoices.length, 4);
      const result = await cancelManagedSubscription(stripe, sub, end + 7200);
      assert.equal(result.end, sub.items.data[0].current_period_end);
      await advance(clock.id, plusMonths(frozen, 4) + 7200);
      sub = await stripe.subscriptions.retrieve(sub.id);
      assert.equal(sub.status, "canceled");
      invoices = (
        await stripe.invoices.list({ customer: customer.id, limit: 100 })
      ).data.filter((i) => i.status === "paid");
      assert.equal(invoices.length, 4);
    }
    console.log(
      JSON.stringify({
        offer,
        scenario,
        status: sub.status,
        paidInvoices: invoices.length,
        passed: true,
      }),
    );
    await stripe.testHelpers.testClocks.del(clock.id);
  }
}
