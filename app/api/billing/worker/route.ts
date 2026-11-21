import { timingSafeEqual } from "node:crypto";
import {
  stripeClient,
  managedSubscription,
  ensureCommitment,
  billingConfigured,
} from "@/lib/billing/stripe";
import { reply } from "@/lib/billing/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const actual = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from("Bearer " + (process.env.CRON_SECRET || ""));
  if (
    !process.env.CRON_SECRET ||
    actual.length !== expected.length ||
    !timingSafeEqual(actual, expected)
  )
    return reply({ error: "Unauthorized" }, 401);
  if (!billingConfigured()) return reply({ ready: false }, 503);
  const stripe = stripeClient();
  let checked = 0;
  try {
    // Recovery in addition to Stripe's signed webhook retries. Never touches other products.
    for await (const sub of stripe.subscriptions.list({
      status: "all",
      limit: 100,
    })) {
      if (managedSubscription(sub)) {
        await ensureCommitment(stripe, sub);
        checked++;
      }
    }
    return reply({ checked });
  } catch {
    return reply({ error: "Billing recovery needs retry" }, 500);
  }
}
