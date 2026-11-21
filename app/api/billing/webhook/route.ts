import {
  stripeClient,
  handleBillingEvent,
  billingEvents,
} from "@/lib/billing/stripe";
import { reply } from "@/lib/billing/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY)
    return reply({ error: "Unavailable" }, 503);
  if (Number(request.headers.get("content-length")) > 1000000)
    return reply({ error: "Too large" }, 413);
  const body = await request.text();
  if (Buffer.byteLength(body) > 1000000)
    return reply({ error: "Too large" }, 413);
  const stripe = stripeClient();
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      request.headers.get("stripe-signature") || "",
      secret,
    );
  } catch {
    return reply({ error: "Invalid signature" }, 400);
  }
  if (event.livemode !== (process.env.STRIPE_BILLING_MODE !== "test"))
    return reply({ error: "Wrong mode" }, 400);
  if (!(billingEvents as readonly string[]).includes(event.type))
    return reply({ received: true });
  try {
    await handleBillingEvent(stripe, event);
    return reply({ received: true });
  } catch {
    console.error("Billing event needs retry", event.id, event.type);
    return reply({ error: "Please retry" }, 500);
  }
}
