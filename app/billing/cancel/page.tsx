import { readCancellationToken } from "@/lib/billing/stripe";
import BillingForm from "../BillingForm";
import "../../service-pages.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Request cancellation",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default async function CancelPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const valid = readCancellationToken(token);
  return (
    <main className="page-main legal-page service-page billing-page" id="main-content">
      <section className="page-section legal-section">
        <article className="legal-document">
          <p className="eyebrow">Dreki / Billing</p>
          <h1>Request cancellation</h1>
          {valid ? (
            <>
              <p>
                Opening this page has not changed your subscription. Confirm
                below to schedule cancellation at the earliest allowed date.
              </p>
              <BillingForm token={token} />
            </>
          ) : (
            <p>
              This private link expired or is invalid.{" "}
              <a href="/billing">Request a fresh link</a>.
            </p>
          )}
        </article>
      </section>
    </main>
  );
}
