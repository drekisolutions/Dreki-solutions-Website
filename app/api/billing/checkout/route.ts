import { offerKey } from "@/lib/billing/catalog";
import {
  createServiceCheckout,
  checkoutReady,
  stripeClient,
} from "@/lib/billing/stripe";
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
    if (!checkoutReady())
      return reply(
        { error: "Checkout is being prepared. Please contact Brett." },
        503,
      );
    const body = await jsonBody(request, 3000);
    if (
      !offerKey(body.offer) ||
      body.accepted !== true ||
      typeof body.attempt !== "string" ||
      !/^[a-f0-9-]{36}$/.test(body.attempt)
    )
      return reply({ error: "Select a service and accept its terms." }, 400);
    if (
      body.offer === "social-media-marketing" &&
      !["static", "mixed"].includes(String(body.choice))
    )
      return reply({ error: "Choose one monthly content option." }, 400);
    if (!(await billingLimit(request, "checkout", 20)))
      return reply({ error: "Please wait before trying again." }, 429);
    const session = await createServiceCheckout(
      stripeClient(),
      body.offer,
      String(body.choice || ""),
      body.attempt,
    );
    return reply({ url: session.url });
  } catch (error) {
    return reply(
      {
        error:
          error instanceof HttpError
            ? error.message
            : "Checkout could not open. Please try again or contact Brett.",
      },
      error instanceof HttpError ? error.status : 502,
    );
  }
}
