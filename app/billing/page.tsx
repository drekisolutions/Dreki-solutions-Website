import BillingForm from "./BillingForm";
import "../service-pages.css";
export const metadata = {
  title: "Manage billing",
  robots: { index: false, follow: false },
};
export default function BillingPage() {
  return (
    <main className="page-main legal-page service-page billing-page" id="main-content">
      <section className="page-section legal-section">
        <article className="legal-document">
          <p className="eyebrow">Dreki / Billing</p>
          <h1>Your subscription. Your next move.</h1>
          <p>
            Enter the email you used at checkout. We’ll send a private link to
            review and request cancellation.
          </p>
          <p>
            You can request cancellation at any time. Both monthly services have
            a three-month minimum, then continue month to month. Cancellation
            takes effect after that initial commitment or at the end of the
            current paid monthly period, whichever is later.
          </p>
          <BillingForm />
          <p>
            Questions or payment-detail updates?{" "}
            <a href="mailto:brett@dreki-solutions.ai">Contact Brett</a>.
          </p>
        </article>
      </section>
    </main>
  );
}
