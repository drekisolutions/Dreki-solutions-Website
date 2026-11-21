import { notFound } from "next/navigation";
import { billingOffers, offerKey } from "@/lib/billing/catalog";
import { checkoutReady } from "@/lib/billing/stripe";
import CheckoutForm from "../CheckoutForm";
import "../../service-pages.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Service checkout",
  robots: { index: false, follow: false },
};
export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ offer: string }>;
}) {
  const { offer } = await params;
  if (!offerKey(offer)) notFound();
  const service = billingOffers[offer];
  return (
    <main className="page-main legal-page service-page billing-page" id="main-content">
      <section className="page-section legal-section">
        <article className="legal-document">
          <p className="eyebrow">Dreki / Your next move</p>
          <h1>{service.name}</h1>
          <p className="service-price">
            <strong>
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              }).format(service.amount / 100)}{" "}
              {service.monthly ? "a month" : "one time"}
            </strong>
          </p>
          <p>{service.description}</p>
          <CheckoutForm offer={offer} ready={checkoutReady()} />
        </article>
      </section>
    </main>
  );
}
