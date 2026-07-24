import type { Metadata } from "next";
import {
  LaunchHero,
  LaunchRelatedLinks,
  LaunchSection,
} from "../components/marketing/LaunchPrimitives";
import { metadataFromRegistry } from "../content-registry";
import { contact } from "../site-data";

export const metadata: Metadata = metadataFromRegistry("/thank-you");

export default function ThankYouPage() {
  return (
    <main className="page-main launch-page" id="main-content">
      <LaunchHero
        eyebrow="Inquiry received"
        title="Thank you for sharing the workflow."
        lede="Dreki will review the operating problem, the requested next step, and the contact details provided with the inquiry."
        primaryHref="/agents"
        primaryLabel="Explore Featured Agents"
        secondaryHref="/"
        secondaryLabel="Return Home"
      >
        <div className="launch-signal-panel">
          <span>What happens next</span>
          <strong>Fit review</strong>
          <p>No meeting is booked until a time is confirmed.</p>
        </div>
      </LaunchHero>

      <LaunchSection
        id="thank-you-next-steps"
        eyebrow="Next steps"
        title="Dreki will review before recommending a path."
      >
        <ol className="process-grid launch-workflow" aria-label="Inquiry review steps">
          <li>
            <span>01</span>
            <h3>Review</h3>
            <p>The workflow and stated friction are checked for initial fit.</p>
          </li>
          <li>
            <span>02</span>
            <h3>Clarify</h3>
            <p>Dreki may ask for the missing context needed to understand the boundary.</p>
          </li>
          <li>
            <span>03</span>
            <h3>Arrange</h3>
            <p>If a strategy call is appropriate, Dreki will coordinate a time directly.</p>
          </li>
          <li>
            <span>04</span>
            <h3>Scope</h3>
            <p>A scoped estimate follows only after the workflow and responsibilities are clear.</p>
          </li>
        </ol>
        <p className="launch-fallback-copy">
          If you need to add context, email{" "}
          <a href={`mailto:${contact.email}`}>{contact.email}</a>.
        </p>
      </LaunchSection>

      <section className="page-section launch-section launch-section--related">
        <LaunchRelatedLinks
          title="While you wait"
          links={[
            {
              href: "/portfolio",
              label: "Internal demonstrations",
              description: "See how Dreki exposes workflow controls.",
            },
            {
              href: "/industries/service-businesses",
              label: "Service businesses",
              description: "Review the launch industry path.",
            },
            {
              href: "/engagements",
              label: "Engagements",
              description: "Understand the path from fit to scope.",
            },
          ]}
        />
      </section>
    </main>
  );
}
