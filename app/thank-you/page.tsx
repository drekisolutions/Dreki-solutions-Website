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
    <main className="page-main launch-page" id="main">
      <LaunchHero
        eyebrow="Inquiry received"
        title="Thank you for reaching out."
        lede="Dreki will review your message and the contact details you provided."
        primaryHref="/free-audit"
        primaryLabel="Request a Free Audit"
        secondaryHref="/"
        secondaryLabel="Return Home"
      >
        <div className="launch-signal-panel">
          <span>What happens next</span>
          <strong>A reply from Dreki</strong>
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
            <p>Your message and business details are reviewed.</p>
          </li>
          <li>
            <span>02</span>
            <h3>Clarify</h3>
            <p>Dreki may ask a question or two to understand what you need.</p>
          </li>
          <li>
            <span>03</span>
            <h3>Arrange</h3>
            <p>If a call makes sense, Dreki will coordinate a time directly.</p>
          </li>
          <li>
            <span>04</span>
            <h3>Recommend</h3>
            <p>You get a recommendation only after your business and goals are clear.</p>
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
              href: "/social-media-marketing",
              label: "Social media marketing",
              description: "See what you get each month and what it costs.",
            },
            {
              href: "/brand-development",
              label: "Brand development",
              description: "See what is included and how long it takes.",
            },
            {
              href: "/free-audit",
              label: "Free digital presence audit",
              description: "A free review of how customers find you online.",
            },
          ]}
        />
      </section>
    </main>
  );
}
