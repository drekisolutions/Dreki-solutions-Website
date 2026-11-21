import { randomUUID } from "node:crypto";
import {
  billingEmail,
  billingOrigin,
  cancellationToken,
  managedSubscription,
  stripeClient,
  billingConfigured,
} from "@/lib/billing/stripe";
import { billingOffers, offerKey } from "@/lib/billing/catalog";
import {
  billingLimit,
  requireOrigin,
  jsonBody,
  reply,
  HttpError,
} from "@/lib/billing/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    requireOrigin(request);
    if (!billingConfigured())
      return reply(
        { error: "Please contact brett@dreki-solutions.ai for billing help." },
        503,
      );
    const body = await jsonBody(request, 1000);
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
      return reply({ error: "Enter your checkout email address." }, 400);
    if (!(await billingLimit(request, "access", 5)))
      return reply(
        { error: "Please wait before requesting another link." },
        429,
      );
    const stripe = stripeClient();
    const exact = await stripe.customers.list({ email, limit: 100 });
    // List covers immediate post-checkout access; search covers case variations.
    const escaped = email.replace(/[\\"]/g, "\\$&");
    const search = await stripe.customers.search({
      query: `email:"${escaped}"`,
      limit: 100,
    });
    const customers = [
      ...new Map(
        [...exact.data, ...search.data]
          .filter((customer) => customer.email?.toLowerCase() === email)
          .map((customer) => [customer.id, customer]),
      ).values(),
    ];
    const links: string[] = [];
    for (const customer of customers) {
      for await (const sub of stripe.subscriptions.list({
        customer: customer.id,
        status: "all",
        limit: 100,
      })) {
        if (
          managedSubscription(sub) &&
          sub.status !== "canceled" &&
          offerKey(sub.metadata.offer)
        )
          links.push(
            billingOffers[sub.metadata.offer].name +
              ": " +
              billingOrigin() +
              "/billing/cancel?token=" +
              cancellationToken(sub.id),
          );
      }
    }
    if (links.length)
      await billingEmail(
        email,
        "Your Dreki billing link",
        "Use the links below to review and request cancellation. Opening a link does not cancel anything. Links expire in 24 hours.\n\n" +
          links.join("\n\n") +
          "\n\nYour three-month commitment remains in place. After that, cancellation takes effect at the end of your paid monthly period. If you did not request this email, ignore it.\nQuestions: brett@dreki-solutions.ai",
        "billing-access/" + randomUUID(),
      );
    return reply({
      message:
        "If that email has an active Dreki website subscription, a private billing link is on its way.",
    });
  } catch (error) {
    return reply(
      {
        error:
          error instanceof HttpError
            ? error.message
            : "Billing is temporarily unavailable. Please contact Brett.",
      },
      error instanceof HttpError ? error.status : 502,
    );
  }
}
