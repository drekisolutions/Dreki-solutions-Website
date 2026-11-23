import type { Metadata } from "next";
import { metadataFromRegistry } from "../content-registry";
import { socialPriceCopy } from "../site-data";

export const metadata: Metadata = metadataFromRegistry("/social-media-marketing");

export default function SocialMediaMarketingPage() {
  return (
    <main className="page-main legal-page" id="main">
      <section
        className="page-section legal-section"
        aria-labelledby="social-media-title"
      >
        <article className="legal-document">
          <p className="eyebrow">Dreki / Marketing &amp; Brand</p>
          <h1 id="social-media-title">Social media marketing for small businesses</h1>
          <p>
            Monthly social content so more customers find you. You approve the
            calendar before anything goes out. We work online, wherever your
            business is. This plan is social content only.
          </p>

          <section aria-labelledby="social-media-monthly-title">
            <h2 id="social-media-monthly-title">What you get each month</h2>
            <ul>
              <li>Up to 30 posts a month</li>
              <li>A content calendar you approve before anything goes out</li>
              <li>Posting after you approve</li>
            </ul>
            <p>
              Brand, profile, and site fixes are separate. They are quoted
              privately and are not priced here.
            </p>
          </section>

          <section aria-labelledby="social-media-cost-title">
            <h2 id="social-media-cost-title">How much does social media marketing cost?</h2>
            <p>{socialPriceCopy()}</p>
          </section>

          <section aria-labelledby="social-media-who-title">
            <h2 id="social-media-who-title">Who runs my social media?</h2>
            <p>
              You work with Brett. There is no account manager. We plan and
              produce the posts. You approve the calendar. Automation posts
              them after you approve. Nothing goes out without your say.
            </p>
          </section>

          <section aria-labelledby="social-media-start-title">
            <h2 id="social-media-start-title">How do I start?</h2>
            <p>
              Start with the free audit. It is step 1. It reviews your Google
              Business Profile, website, and social accounts, and lists what to
              fix first. The audit is free. No purchase required.
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
