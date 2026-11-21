// Creates and immediately expires empty Checkout Sessions. Never submits payment.
import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { billingOffers, type OfferKey } from "../lib/billing/catalog.ts";
import { stripeClient, createServiceCheckout } from "../lib/billing/stripe.ts";
const stripe = stripeClient();
for (const key of Object.keys(billingOffers) as OfferKey[]) {
  let session;
  try {
    session = await createServiceCheckout(
      stripe,
      key,
      key === "social-media-marketing" ? "mixed" : "",
      randomUUID(),
    );
    if (
      session.status !== "open" ||
      !session.url ||
      session.consent_collection?.terms_of_service !== "required" ||
      !session.automatic_tax?.enabled
    )
      throw new Error("Checkout settings mismatch");
    console.log(
      JSON.stringify({
        offer: key,
        mode: session.mode,
        status: session.status,
        termsRequired: true,
        automaticTax: true,
      }),
    );
  } finally {
    if (session?.status === "open")
      await stripe.checkout.sessions.expire(session.id);
  }
}
for (const [name, read] of [
  ["customer access", () => stripe.customers.list({ limit: 1 })],
  ["customer email search", () => stripe.customers.search({ query: "email:'billing-access-probe@example.invalid'", limit: 1 })],
  ["subscriptions", () => stripe.subscriptions.list({ limit: 1 })],
  ["subscription schedules", () => stripe.subscriptionSchedules.list({ limit: 1 })],
  ["invoices", () => stripe.invoices.list({ limit: 1 })],
  ["invoice payment graph", () => stripe.invoicePayments.list({ limit: 1 })],
  ["payment intents", () => stripe.paymentIntents.list({ limit: 1 })],
  ["charges", () => stripe.charges.list({ limit: 1 })],
] as const) { await read(); console.log(JSON.stringify({ permission: name, verified: true })); }
// A missing synthetic ID proves write permission without creating live data.
for (const [name, probe] of [
  ["subscription updates", () => stripe.subscriptions.update("sub_DrekiAccessProbe", { metadata: { access_probe: "true" } })],
  ["schedule creation", () => stripe.subscriptionSchedules.create({ from_subscription: "sub_DrekiAccessProbe" })],
  ["schedule updates", () => stripe.subscriptionSchedules.update("sub_sched_DrekiAccessProbe", { metadata: { access_probe: "true" } })],
] as const) {
  try { await probe(); throw new Error("Unexpected probe resource exists"); }
  catch (error) { if (!(error instanceof Stripe.errors.StripeInvalidRequestError) || error.code !== "resource_missing") throw error; }
  console.log(JSON.stringify({ permission: name, verified: true }));
}
