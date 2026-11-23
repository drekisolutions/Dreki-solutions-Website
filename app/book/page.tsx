import type { Metadata } from "next";
import PageTurnLink from "../components/PageTurnLink";
import {
  LaunchHero,
  LaunchSection,
} from "../components/marketing/LaunchPrimitives";
import { metadataFromRegistry } from "../content-registry";
import { consultationMailto, contact } from "../site-data";
import { siteConfig } from "../site-config";

export const metadata: Metadata = metadataFromRegistry("/book");

const preparation = [
  {
    title: "Your business",
    copy: "What you sell, who you serve, and where you work.",
  },
  {
    title: "Your presence",
    copy: "Your website, social accounts, and Google Business Profile, as they are today.",
  },
  {
    title: "Your goal",
    copy: "What you want more of: calls, visits, bookings, or orders.",
  },
] as const;

export default function BookPage() {
  return (
    <main className="page-main launch-page" id="main">
      <LaunchHero
        eyebrow="Book a call"
        title="Talk through your marketing."
        lede="Use the call to go over your goals and whether social media marketing or brand development is a fit for your business."
        primaryHref="/contact#consultation"
        primaryLabel="Request a Call"
        secondaryHref="/free-audit"
        secondaryLabel="Start with a Free Audit"
      >
        <div className="launch-signal-panel">
          <span>Call focus</span>
          <strong>Your business first</strong>
          <p>Fit, priorities, and a clear next step.</p>
        </div>
      </LaunchHero>

      <LaunchSection
        id="scheduler"
        eyebrow="Scheduling"
        title={
          siteConfig.meetingUrl
            ? "Choose a call time."
            : "Request a time."
        }
        intro={
          siteConfig.meetingUrl
            ? "Choose an available time. A short note about your business helps make the conversation useful."
            : "Send a note and Dreki will arrange a time."
        }
      >
        <div className="launch-scheduler" aria-live="polite">
          <div className="launch-scheduler__actions">
            {siteConfig.meetingUrl ? (
              <a
                className="button button-primary"
                href={siteConfig.meetingUrl}
                rel="noreferrer"
              >
                Choose a time
              </a>
            ) : (
              <PageTurnLink className="button button-primary" href="/contact#consultation">
                Send a Note
              </PageTurnLink>
            )}
            <a className="button button-secondary" href={consultationMailto}>
              Email {contact.email}
            </a>
          </div>
          <p className="launch-scheduler__note">
            {siteConfig.meetingUrl
              ? "A meeting is booked only after you see a confirmation."
              : "No meeting is booked until Dreki confirms the time."}
          </p>
        </div>
      </LaunchSection>

      <LaunchSection
        id="call-preparation"
        eyebrow="Prepare"
        title="Three useful things to bring."
        intro="You do not need a marketing plan. A plain description of your business is enough."
        className="launch-section--contrast"
      >
        <div className="feature-grid feature-grid--three">
          {preparation.map((item, index) => (
            <article className="feature-card" key={item.title}>
              <span>0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </LaunchSection>

      <LaunchSection
        id="call-outcome"
        eyebrow="Expected outcome"
        title="Leave with a clearer next decision."
        intro="The call may lead to a free audit, a social media plan, brand development work, or a conclusion that Dreki is not the right fit."
      >
        <div className="boundary-note launch-boundary-note">
          <strong>No automatic proposal</strong>
          <p>
            Dreki recommends paid work only after understanding your business.
            Any paid work is a separate decision.
          </p>
        </div>
      </LaunchSection>
    </main>
  );
}
