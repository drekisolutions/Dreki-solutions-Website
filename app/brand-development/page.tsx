import type { Metadata } from "next";
import { metadataFromRegistry } from "../content-registry";

export const metadata: Metadata = metadataFromRegistry("/brand-development");

export default function BrandDevelopmentPage() {
  return (
    <main className="page-main legal-page" id="main">
      <section
        className="page-section legal-section"
        aria-labelledby="brand-development-title"
      >
        <article className="legal-document">
          <p className="eyebrow">Dreki / Marketing &amp; Brand</p>
          <h1 id="brand-development-title">Brand development for small businesses</h1>
          <p>
            We build a brand for the company and a personal brand for you, the
            owner. We work online, wherever your business is. This work is
            separate from the monthly social plan.
          </p>

          <section aria-labelledby="brand-included-title">
            <h2 id="brand-included-title">What is included in brand development?</h2>
            <ul>
              <li>A logo</li>
              <li>Colors</li>
              <li>Fonts</li>
              <li>A voice guide</li>
              <li>Templates</li>
            </ul>
          </section>

          <section aria-labelledby="brand-cost-title">
            <h2 id="brand-cost-title">How is brand work priced?</h2>
            <p>
              Brand work is quoted privately. It is not part of the monthly
              social plan, and it is not priced on this site.
            </p>
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
