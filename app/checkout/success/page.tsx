import { stripeClient, objectId } from "@/lib/billing/stripe";
import Link from "next/link";
import { BILLING_SCOPE } from "@/lib/billing/catalog";
import "../../service-pages.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Checkout status",
  robots: { index: false, follow: false },
};
export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: id } = await searchParams;
  let paid = false,
    protectedTerm = true;
  if (id && /^cs_[A-Za-z0-9_]+$/.test(id))
    try {
      const stripe = stripeClient();
      const session = await stripe.checkout.sessions.retrieve(id);
      paid =
        session.metadata?.integration === BILLING_SCOPE &&
        session.payment_status === "paid";
      if (paid && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(
          objectId(session.subscription)!,
        );
        protectedTerm = Boolean(sub.metadata.commitment_end);
      }
    } catch {
      /* No customer information is exposed by this status page. */
    }
  return (
    <main className="page-main legal-page service-page billing-page" id="main-content">
      <section className="page-section legal-section">
        <article className="legal-document">
          <p className="eyebrow">Dreki / Checkout</p>
          <h1>
            {paid
              ? "Payment received. Thank you."
              : "We’re checking your payment."}
          </h1>
          <p>
            {paid && protectedTerm
              ? "Brett will follow up by email to arrange your service."
              : "Your payment or billing setup is still being confirmed. Please do not pay again. Contact Brett if you need help."}
          </p>
          <p>
            <a href="/billing">Manage your subscription</a> ·{" "}
            <a href="mailto:brett@dreki-solutions.ai">Contact Brett</a>
          </p>
          <Link className="button button-primary" href="/">
            Return to Dreki
          </Link>
        </article>
      </section>
    </main>
  );
}
