import type { Metadata } from "next";
import PageTurnLink from "../components/PageTurnLink";
import { aviationProducts, serviceProducts } from "../site-data";

export const metadata: Metadata = {
  title: "Agentic Software Products",
  description:
    "Dreki Solutions product registry for service-industry and aviation agentic software.",
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  return (
    <main className="page-main" id="main-content">
      <section
        className="page-section service-industry-section"
        aria-labelledby="products-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">Service-industry products</p>
            <h1 id="products-title">A product line shaped by real operating friction.</h1>
          </div>
          <div className="section-heading__support">
            <p>
              Dreki develops focused products around real service-business friction,
              with clear operating boundaries and human approval where it matters.
            </p>
            <PageTurnLink className="button button-primary" href="/contact#consultation">
              Schedule a Consultation
            </PageTurnLink>
          </div>
        </div>
        <div className="product-grid" aria-label="Service-industry product positions">
          {serviceProducts.map((product) => (
            <article className="product-card" key={product.index}>
              <div><span>{product.index}</span><small>{product.status}</small></div>
              <p>{product.focus}</p>
              <h3>{product.title}</h3>
              <p>{product.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-section aviation-section" aria-labelledby="aviation-products-title">
        <div className="section-heading section-heading--aviation">
          <div>
            <p className="eyebrow">Aviation products</p>
            <h2 id="aviation-products-title">Purpose-built for charter-industry workflows.</h2>
          </div>
          <p>
            Six aviation products address charter operations, safety, maintenance,
            trend reporting, empty-leg access, and drone fleet records.
          </p>
        </div>
        <div className="product-grid product-grid--aviation">
          {aviationProducts.map((product) => (
            <article
              className={`product-card${product.title === "Valkyrie 135" ? " product-card--featured" : ""}`}
              key={product.index}
            >
              <div><span>{product.index}</span><small>{product.status}</small></div>
              <p>{product.focus}</p>
              <h3>{product.title}</h3>
              <p>
                {product.copy}
                {"url" in product ? (
                  <a
                    aria-label="Visit the Valkyrie 135 website (opens in a new tab)"
                    className="product-card__link"
                    href={product.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    valkyrie.dreki-solutions.com <span aria-hidden="true">↗</span>
                  </a>
                ) : null}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
