import {
  readCancellationToken,
  cancelManagedSubscription,
  stripeClient,
  billingConfigured,
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
    if (!billingConfigured())
      return reply({ error: "Please contact Brett for billing help." }, 503);
    const body = await jsonBody(request, 1500);
    const id = readCancellationToken(body.token);
    if (!id || body.confirm !== true)
      return reply(
        { error: "This link expired. Request a fresh billing link." },
        400,
      );
    if (!(await billingLimit(request, "cancel", 20)))
      return reply({ error: "Please wait before trying again." }, 429);
    const stripe = stripeClient();
    const result = await cancelManagedSubscription(
      stripe,
      await stripe.subscriptions.retrieve(id),
    );
    return reply({
      message: result.canceled
        ? "Your subscription is already canceled."
        : "Cancellation scheduled. Your service and billing end on " +
          new Date(result.end! * 1000).toLocaleDateString("en-US", {
            timeZone: "UTC",
            month: "long",
            day: "numeric",
            year: "numeric",
          }) +
          ".",
    });
  } catch (error) {
    return reply(
      {
        error:
          error instanceof HttpError
            ? error.message
            : "We could not schedule this cancellation. Please contact brett@dreki-solutions.ai.",
      },
      error instanceof HttpError ? error.status : 502,
    );
  }
}
