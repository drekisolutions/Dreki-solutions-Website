import type { Metadata } from "next";
import { metadataFromRegistry } from "../content-registry";
import { servicePricing } from "../service-pricing";

export const metadata: Metadata = metadataFromRegistry("/brand-development");

export default function BrandDevelopmentPage() {
  return (
    <main className="page-main legal-page" id="main-content">
      <section
        className="page-section legal-section"
        aria-labelledby="brand-development-title"
      >
        <article className="legal-document">
          <p className="eyebrow">Dreki / Marketing &amp; Brand</p>
          <h1 id="brand-development-title">Brand development for small businesses</h1>
          <p>
            We give your company a clear look, voice, and story, so the business
            looks like the work you do. We can build a personal brand for you as
            the owner too. A project takes about 1 to 2 weeks. We work online,
            wherever your business is.
          </p>

          <section aria-labelledby="brand-cost-title">
            <h2 id="brand-cost-title">Your investment for branding development</h2>
            <h3>Business brand kit</h3>
            <p><strong>{servicePricing.businessBrandKit}</strong></p>
            <p>Logo, colors, type, and guidelines.</p>
            <h3>Owner personal brand development</h3>
            <p><strong>{servicePricing.ownerPersonalBrand}</strong></p>
            <p>Positioning and profile overhaul.</p>
            <h3>Monthly content retainer</h3>
            <p><strong>{servicePricing.monthlyContent}</strong> with a {servicePricing.minimumTerm}.</p>
          </section>

          <section aria-labelledby="brand-time-title">
            <h2 id="brand-time-title">How long does it take?</h2>
            <p>About 1 to 2 weeks.</p>
          </section>

          <section aria-labelledby="brand-start-title">
            <h2 id="brand-start-title">How do I start?</h2>
            <p>
              Start with a free digital presence audit. It is a free review of
              your website, social accounts, and Google Business Profile, with a
              written report on what to fix first. No purchase required.
            </p>
            <p>
              <a className="button button-primary" href="/free-audit">
                Request your free audit
              </a>
            </p>
          </section>
        </article>
      </section>
    </main>
  );
}
