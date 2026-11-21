import Stripe from "stripe";
import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import {
  BILLING_SCOPE,
  BILLING_TERMS,
  billingOffers,
  offerKey,
  type OfferKey,
} from "./catalog.ts";

export const billingOrigin = () => "https://www.dreki-solutions.ai";
export function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY)
    throw new Error("Billing is unavailable.");
  const expectedMode =
    process.env.STRIPE_BILLING_MODE === "test" ? "_test_" : "_live_";
  if (!process.env.STRIPE_SECRET_KEY.includes(expectedMode))
    throw new Error("Billing mode mismatch.");
  return new Stripe(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2 });
}
export const billingConfigured = () =>
  Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    process.env.STRIPE_BILLING_SIGNING_SECRET &&
    process.env.RESEND_API_KEY &&
    process.env.AUDIT_FROM_EMAIL,
  );
export const checkoutReady = () =>
  process.env.STRIPE_CHECKOUT_ENABLED === "true" && billingConfigured();
export const objectId = (value: string | { id: string } | null | undefined) =>
  typeof value === "string" ? value : value?.id;
export function commitmentEnd(start: number) {
  const date = new Date(start * 1000),
    day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + 3);
  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return Math.floor(date.getTime() / 1000);
}

export function managedSubscription(sub: Stripe.Subscription) {
  const key = sub.metadata.offer;
  if (
    sub.metadata.integration !== BILLING_SCOPE ||
    !offerKey(key) ||
    !billingOffers[key].monthly
  )
    return false;
  const items = sub.items.data;
  return (
    items.length === 1 &&
    items[0].quantity === 1 &&
    objectId(items[0].price.product) === billingOffers[key].product &&
    items[0].price.unit_amount === 100000 &&
    items[0].price.currency === "usd" &&
    items[0].price.recurring?.interval === "month" &&
    items[0].price.recurring.interval_count === 1
  );
}

export async function createServiceCheckout(
  stripe: Stripe,
  key: OfferKey,
  choice: string,
  attempt: string,
) {
  const offer = billingOffers[key];
  if (key === "social-media-marketing" && !["static", "mixed"].includes(choice))
    throw new Error("Choose your monthly content option.");
  const product = await stripe.products.retrieve(offer.product, {
    expand: ["default_price"],
  });
  if (
    product.deleted ||
    !product.active ||
    product.tax_code !== "txcd_10701100"
  )
    throw new Error("Service configuration needs review.");
  const price = product.default_price as Stripe.Price | null;
  if (
    !price?.active ||
    price.unit_amount !== offer.amount ||
    price.currency !== "usd" ||
    (offer.monthly
      ? price.recurring?.interval !== "month" ||
        price.recurring.interval_count !== 1
      : price.recurring !== null)
  )
    throw new Error("Service pricing needs review.");
  const metadata = {
    integration: BILLING_SCOPE,
    offer: key,
    terms: BILLING_TERMS,
    content_option:
      key === "social-media-marketing" ? choice : "not-applicable",
  };
  return stripe.checkout.sessions.create(
    {
      mode: offer.monthly ? "subscription" : "payment",
      integration_identifier:
        "dreki_services_" +
        [...createHash("sha256").update(attempt).digest().subarray(0, 8)]
          .map((n) => String.fromCharCode(97 + (n % 26)))
          .join(""),
      line_items: [{ price: price.id, quantity: 1 }],
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      name_collection: {
        individual: { enabled: true },
        business: { enabled: true },
      },
      consent_collection: { terms_of_service: "required" },
      custom_text: {
        terms_of_service_acceptance: {
          message: offer.monthly
            ? "I agree to Dreki’s [service terms](https://www.dreki-solutions.ai/terms#terms-paid-services): $1,000/month, three-month minimum ($3,000 before applicable tax), then month to month. Cancellation requests: https://www.dreki-solutions.ai/billing."
            : "I agree to Dreki’s [service terms](https://www.dreki-solutions.ai/terms#terms-paid-services).",
        },
      },
      metadata,
      ...(offer.monthly
        ? {
            subscription_data: {
              metadata,
              description:
                offer.name + ": three-month commitment, then month to month.",
            },
          }
        : { payment_intent_data: { metadata } }),
      success_url:
        billingOrigin() + "/checkout/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: billingOrigin() + "/checkout/" + key,
    },
    { idempotencyKey: "dreki-checkout/" + key + "/" + choice + "/" + attempt },
  );
}

// Idempotent across duplicate/out-of-order events and the worker's recovery pass.
export async function ensureCommitment(
  stripe: Stripe,
  sub: Stripe.Subscription,
  now = Math.floor(Date.now() / 1000),
) {
  if (
    !managedSubscription(sub) ||
    !["active", "incomplete", "past_due", "trialing"].includes(sub.status)
  )
    return null;
  const expectedEnd =
    Number(sub.metadata.commitment_end) || commitmentEnd(sub.start_date);
  if (expectedEnd <= now && !sub.schedule) return expectedEnd;
  const schedule = sub.schedule
    ? await stripe.subscriptionSchedules.retrieve(objectId(sub.schedule)!)
    : await stripe.subscriptionSchedules.create(
        { from_subscription: sub.id },
        {
          idempotencyKey:
            "dreki-term/create/" +
            sub.id +
            "/" +
            (sub.metadata.commitment_schedule || "initial"),
        },
      );
  if (
    schedule.metadata?.integration === BILLING_SCOPE &&
    schedule.metadata.commitment_end
  ) {
    const end = Number(schedule.metadata.commitment_end);
    if (!sub.metadata.commitment_end)
      await stripe.subscriptions.update(sub.id, {
        metadata: {
          commitment_end: String(end),
          commitment_schedule: schedule.id,
        },
      });
    return end;
  }
  if (
    sub.schedule &&
    schedule.metadata?.integration &&
    schedule.metadata.integration !== BILLING_SCOPE
  )
    throw new Error("Subscription schedule needs owner review.");
  const phase = schedule.phases[0];
  if (!phase || schedule.status !== "active")
    throw new Error("Commitment schedule unavailable.");
  const updated = await stripe.subscriptionSchedules.update(
    schedule.id,
    {
      end_behavior: "release",
      proration_behavior: "none",
      metadata: { integration: BILLING_SCOPE, offer: sub.metadata.offer },
      phases: [
        {
          start_date: phase.start_date,
          end_date: expectedEnd,
          items: [{ price: sub.items.data[0].price.id, quantity: 1 }],
          proration_behavior: "none",
          automatic_tax: { enabled: true },
          metadata: {
            integration: BILLING_SCOPE,
            offer: sub.metadata.offer,
            terms: BILLING_TERMS,
          },
        },
      ],
    },
    { idempotencyKey: "dreki-term/configure/" + schedule.id },
  );
  const end = updated.phases[0].end_date;
  await stripe.subscriptionSchedules.update(schedule.id, {
    metadata: { commitment_end: String(end) },
  });
  await stripe.subscriptions.update(sub.id, {
    metadata: { commitment_end: String(end), commitment_schedule: schedule.id },
  });
  return end;
}

export async function cancelManagedSubscription(
  stripe: Stripe,
  sub: Stripe.Subscription,
  now = Math.floor(Date.now() / 1000),
) {
  if (!managedSubscription(sub))
    throw new Error("This subscription is not managed by Dreki’s website.");
  if (sub.status === "canceled") return { canceled: true, end: sub.ended_at };
  const term = await ensureCommitment(stripe, sub, now);
  if (!term) throw new Error("Billing needs owner review.");
  // Keep the locked phase intact: cancel at its end, never shorten it.
  if (now < term) {
    const fresh = sub.schedule
      ? sub
      : await stripe.subscriptions.retrieve(sub.id);
    const scheduleId =
      objectId(fresh.schedule) || fresh.metadata.commitment_schedule;
    if (!scheduleId) throw new Error("Commitment schedule missing.");
    await stripe.subscriptionSchedules.update(
      scheduleId,
      { end_behavior: "cancel", metadata: { cancellation_requested: "true" } },
      { idempotencyKey: "dreki-cancel-term/" + sub.id },
    );
    return { canceled: false, end: term };
  }
  const updated = await stripe.subscriptions.update(
    sub.id,
    { cancel_at_period_end: true },
    { idempotencyKey: "dreki-cancel-month/" + sub.id },
  );
  return {
    canceled: false,
    end: updated.items.data[0]?.current_period_end || updated.cancel_at,
  };
}

export function cancellationToken(
  subscription: string,
  now = Date.now(),
  secret = process.env.STRIPE_BILLING_SIGNING_SECRET || "",
) {
  if (secret.length < 32) throw new Error("Billing signing unavailable.");
  const body = Buffer.from(
    JSON.stringify({ subscription, expires: now + 86400000 }),
  ).toString("base64url");
  return (
    body +
    "." +
    createHmac("sha256", secret)
      .update("billing-cancel:" + body)
      .digest("hex")
  );
}
export function readCancellationToken(
  token: unknown,
  now = Date.now(),
  secret = process.env.STRIPE_BILLING_SIGNING_SECRET || "",
): string | null {
  if (typeof token !== "string" || token.length > 600 || secret.length < 32)
    return null;
  const [body, signature, extra] = token.split(".");
  if (extra || !body || !/^[a-f0-9]{64}$/.test(signature || "")) return null;
  const expected = createHmac("sha256", secret)
    .update("billing-cancel:" + body)
    .digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, "hex"))) return null;
  try {
    const value = JSON.parse(Buffer.from(body, "base64url").toString());
    return /^sub_[A-Za-z0-9]+$/.test(value.subscription) &&
      Number.isFinite(value.expires) &&
      value.expires > now &&
      value.expires <= now + 86400000
      ? value.subscription
      : null;
  } catch {
    return null;
  }
}

export async function billingEmail(
  to: string,
  subject: string,
  text: string,
  key: string,
) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.RESEND_API_KEY,
      "Content-Type": "application/json",
      "Idempotency-Key": key,
    },
    body: JSON.stringify({
      from: process.env.AUDIT_FROM_EMAIL,
      to: [to],
      subject,
      text,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Billing email unavailable.");
}

export const billingEvents = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
  "charge.dispute.created",
  "charge.refunded",
  "radar.early_fraud_warning.created",
] as const;

export async function handleBillingEvent(
  stripe: Stripe,
  event: Stripe.Event,
  notify = billingEmail,
) {
  const resourceId = (event.data.object as unknown as { id: string }).id;
  let sub: Stripe.Subscription | null = null;
  let relevant = false;
  if (event.type.startsWith("customer.subscription.")) {
    // Read current state rather than replaying a stale event snapshot.
    sub = await stripe.subscriptions.retrieve(resourceId);
    relevant = managedSubscription(sub);
  } else if (event.type.startsWith("checkout.session.")) {
    const session = await stripe.checkout.sessions.retrieve(resourceId);
    relevant =
      session.metadata?.integration === BILLING_SCOPE ||
      [
        "plink_1UeMYOPoN0MD3e7CdEfFfNOi",
        "plink_1UeMZWPoN0MD3e7CBpZqTzKk",
      ].includes(objectId(session.payment_link) || "");
    if (!relevant) return;
    if (session.subscription)
      sub = await stripe.subscriptions.retrieve(
        objectId(session.subscription)!,
      );
    if (session.mode === "payment" && session.payment_status !== "paid")
      relevant = false;
  } else if (event.type.startsWith("invoice.")) {
    const invoice = await stripe.invoices.retrieve(resourceId);
    const id = objectId(invoice.parent?.subscription_details?.subscription);
    if (id) sub = await stripe.subscriptions.retrieve(id);
    relevant = Boolean(sub && managedSubscription(sub));
  } else {
    const obj = event.data.object as unknown as {
      id: string;
      charge?: string | { id: string };
    };
    const chargeId =
      event.type === "charge.refunded" ? obj.id : objectId(obj.charge);
    if (!chargeId) return;
    const charge = await stripe.charges.retrieve(chargeId);
    const intentId = objectId(charge.payment_intent);
    if (!intentId) return;
    // Stripe's invoice payment graph is authoritative; metadata is only the fallback for one-time sales.
    const payments = await stripe.invoicePayments.list({
      payment: { type: "payment_intent", payment_intent: intentId },
      limit: 100,
    });
    for (const payment of payments.data) {
      const invoice = await stripe.invoices.retrieve(
        objectId(payment.invoice)!,
      );
      const id = objectId(invoice.parent?.subscription_details?.subscription);
      if (id) {
        const candidate = await stripe.subscriptions.retrieve(id);
        if (managedSubscription(candidate)) {
          sub = candidate;
          break;
        }
      }
    }
    const intent = !sub ? await stripe.paymentIntents.retrieve(intentId) : null;
    relevant = Boolean(sub || intent?.metadata.integration === BILLING_SCOPE);
  }
  if (!relevant) return;
  if (sub && !event.type.endsWith(".deleted"))
    await ensureCommitment(stripe, sub);
  // Never start work from the success page. Paid events and billing/risk changes reach the owner here.
  await notify(
    "brett@dreki-solutions.ai",
    "Dreki billing: " + event.type,
    "Stripe event: " +
      event.id +
      "\nType: " +
      event.type +
      "\nResource: " +
      resourceId +
      (sub ? "\nSubscription: " + sub.id : "") +
      "\nReview billing and any required client follow-up in https://dashboard.stripe.com/acct_1TP1IKPoN0MD3e7C .",
    "billing-event/" + event.id,
  );
}
