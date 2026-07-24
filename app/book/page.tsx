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
    title: "The workflow",
    copy: "Choose one recurring response, intake, scheduling, or coordination process.",
  },
  {
    title: "The friction",
    copy: "Explain where work waits, context gets lost, or an accountable person is interrupted.",
  },
  {
    title: "The boundary",
    copy: "Identify decisions and exceptions that must remain with your team.",
  },
] as const;

export default function BookPage() {
  return (
    <main className="page-main launch-page" id="main-content">
      <LaunchHero
        eyebrow="Strategy call"
        title="Bring one workflow worth improving."
        lede="Use the strategy call to examine the current operating path, the decisions people must retain, and whether a bounded agent is a practical fit."
        primaryHref="/contact#consultation"
        primaryLabel="Request a Strategy Call"
        secondaryHref="/engagements"
        secondaryLabel="Review Engagements"
      >
        <div className="launch-signal-panel">
          <span>Call focus</span>
          <strong>Workflow before software</strong>
          <p>Fit, boundaries, and a scoped next step.</p>
        </div>
      </LaunchHero>

      <LaunchSection
        id="scheduler"
        eyebrow="Scheduling"
        title={
          siteConfig.meetingUrl
            ? "Choose a strategy-call time."
            : "Online scheduling is being connected."
        }
        intro={
          siteConfig.meetingUrl
            ? "Use Dreki’s HubSpot scheduling page to choose an available time. A short workflow brief helps make the conversation useful."
            : "Dreki is preparing a HubSpot scheduling page, but no public booking link is active yet. Use the inquiry path below and a time will be arranged directly."
        }
      >
        <div className="launch-scheduler" aria-live="polite">
          <div className="launch-scheduler__status">
            <span aria-hidden="true" />
            <p>
              <strong>Scheduler status:</strong>{" "}
              {siteConfig.meetingUrl ? "available" : "configuration in progress"}
            </p>
          </div>
          <div className="launch-scheduler__actions">
            {siteConfig.meetingUrl ? (
              <a
                className="button button-primary"
                href={siteConfig.meetingUrl}
                rel="noreferrer"
              >
                Open HubSpot Scheduling
              </a>
            ) : (
              <PageTurnLink className="button button-primary" href="/contact#consultation">
                Send a Workflow Brief
              </PageTurnLink>
            )}
            <a className="button button-secondary" href={consultationMailto}>
              Email {contact.email}
            </a>
          </div>
          <p className="launch-scheduler__note">
            {siteConfig.meetingUrl
              ? "A meeting is booked only after HubSpot displays its confirmation."
              : "No meeting is considered booked until Dreki confirms the time."}
          </p>
        </div>
      </LaunchSection>

      <LaunchSection
        id="call-preparation"
        eyebrow="Prepare"
        title="Three useful things to bring."
        intro="You do not need a technical specification. A concrete operating example is more useful than a list of desired features."
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
        intro="The call may lead to a workflow audit, a scoped custom build, a request for better source material, or a conclusion that the workflow is not a good automation fit."
      >
        <div className="boundary-note launch-boundary-note">
          <strong>No automatic proposal</strong>
          <p>
            Dreki prepares a scoped estimate only after the workflow, access, human
            authority, and delivery responsibility are understood.
          </p>
        </div>
      </LaunchSection>
    </main>
  );
}
