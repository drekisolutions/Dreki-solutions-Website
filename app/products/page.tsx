import type { Metadata } from "next";
import {
  LaunchFinalCta,
  LaunchHero,
  LaunchSection,
} from "../components/marketing/LaunchPrimitives";
import { metadataFromRegistry } from "../content-registry";
import { serviceProducts } from "../site-data";

export const metadata: Metadata = metadataFromRegistry("/products");

type Product = (typeof serviceProducts)[number];

function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card launch-product-card" role="listitem">
      <div>
        <span>{product.index}</span>
        <small>{product.status}</small>
      </div>
      <p>{product.focus}</p>
      <h3>{product.title}</h3>
      <p>{product.copy}</p>
    </article>
  );
}

export default function ProductsPage() {
  return (
    <main className="page-main launch-page" id="main-content">
      <LaunchHero
        eyebrow="Product registry"
        title="See exactly where each product stands."
        lede="Dreki publishes development status directly. A product description explains the intended job; it does not imply general availability or a guaranteed release date."
        primaryHref="/book"
        primaryLabel="Discuss Product Fit"
        secondaryHref="/agents"
        secondaryLabel="Explore Custom Agents"
      >
        <div className="launch-status-key">
          <div>
            <span>In Development</span>
            <p>Not generally available. Capability and timing may change.</p>
          </div>
        </div>
      </LaunchHero>

      <LaunchSection
        id="service-products"
        eyebrow="Service-business products"
        title="Products shaped around recurring operating friction."
        intro="Every product below remains in development. The descriptions state the intended operating job and the human approvals built into that direction."
      >
        <div
          className="product-grid launch-product-grid"
          role="list"
          aria-label="Service-business products"
        >
          {serviceProducts.map((product) => (
            <ProductCard key={product.index} product={product} />
          ))}
        </div>
      </LaunchSection>

      <LaunchSection
        id="product-boundary"
        eyebrow="Availability boundary"
        title="A product conversation is not a purchase promise."
        intro="Dreki will confirm the current capability, testing fit, access conditions, and commercial scope directly. No public card on this page should be read as a guarantee of features, timing, savings, or business outcomes."
        className="launch-section--contrast"
      >
        <div className="boundary-note launch-boundary-note">
          <strong>Scoped requests only</strong>
          <p>
            There is no public checkout or one-size-fits-all product price on this
            website. Request a strategy call to discuss current fit and status.
          </p>
        </div>
      </LaunchSection>

      <LaunchFinalCta
        title="Ask about the current product, not a future assumption."
        copy="Dreki will clarify present status, practical fit, and the next available step. Any estimate or testing arrangement is scoped directly."
      />
    </main>
  );
}
