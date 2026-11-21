import type { Metadata } from "next";
import { metadataFromRegistry } from "../content-registry";
import { servicePricing } from "../service-pricing";

export const metadata: Metadata = metadataFromRegistry("/social-media-marketing");

export default function SocialMediaMarketingPage() {
  return (
    <main className="page-main legal-page" id="main-content">
      <section
        className="page-section legal-section"
        aria-labelledby="social-media-title"
      >
        <article className="legal-document">
          <p className="eyebrow">Dreki / Marketing &amp; Brand</p>
          <h1 id="social-media-title">Social media marketing for small businesses</h1>
          <p>
            We plan, produce, and post your social media content each month, so
            you stay in front of customers without giving up your evenings. It
            is built for owner-led small businesses where the owner still does
            the work and has little time left for marketing. We work online,
            wherever your business is.
          </p>

          <section aria-labelledby="social-media-monthly-title">
            <h2 id="social-media-monthly-title">What you get each month</h2>
            <p>Choose one monthly content option:</p>
            <ul>
              <li>30 static ad posts</li>
              <li>20 posts and 8 videos</li>
            </ul>
            <p>Both options include:</p>
            <ul>
              <li>A content calendar you approve before anything goes out</li>
              <li>Automated posting, once you approve</li>
              <li>A website audit report</li>
            </ul>
          </section>

          <section aria-labelledby="social-media-platforms-title">
            <h2 id="social-media-platforms-title">Which platforms do you cover?</h2>
            <p>Facebook, Instagram, YouTube, TikTok, X, and LinkedIn.</p>
          </section>

          <section aria-labelledby="social-media-cost-title">
            <h2 id="social-media-cost-title">Your investment for social media marketing</h2>
            <p><strong>{servicePricing.monthlyContent}</strong> with a {servicePricing.minimumTerm}.</p>
          </section>

          <section aria-labelledby="social-media-who-title">
            <h2 id="social-media-who-title">Who runs my social media?</h2>
            <p>
              We do. We plan and produce the content, you approve the calendar,
              and posting is automated after your approval. Nothing goes out
              without your say.
            </p>
          </section>

          <section aria-labelledby="social-media-start-title">
            <h2 id="social-media-start-title">How do I start?</h2>
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
