import type { Metadata } from "next";
import PageTurnLink from "../components/PageTurnLink";
import {
  LaunchFinalCta,
  LaunchHero,
  LaunchSection,
} from "../components/marketing/LaunchPrimitives";
import { metadataFromRegistry } from "../content-registry";

export const metadata: Metadata = metadataFromRegistry("/industries");

const selectionCriteria = [
  {
    title: "A repeated operating path",
    copy: "The business can identify the normal sequence, required information, and completion signal.",
  },
  {
    title: "A named exception owner",
    copy: "Someone has authority when a request, handoff, or decision falls outside the defined rules.",
  },
  {
    title: "A defensible data boundary",
    copy: "The system can receive only the access and information required for its narrow responsibility.",
  },
] as const;

export default function IndustriesPage() {
  return (
    <main className="page-main launch-page" id="main-content">
      <LaunchHero
        eyebrow="Industry paths"
        title="Build around the way the work actually moves."
        lede="Agent patterns only become useful when they reflect the operating language, handoffs, constraints, and human authority of a real business."
        primaryHref="/industries/service-businesses"
        primaryLabel="Explore Service Businesses"
        secondaryHref="/book"
        secondaryLabel="Discuss Your Workflow"
      >
        <div className="launch-signal-panel">
          <span>Current launch priority</span>
          <strong>Service businesses</strong>
          <p>Inquiry response, intake, scheduling preparation, and coordination.</p>
        </div>
      </LaunchHero>

      <LaunchSection
        id="industry-launch-path"
        eyebrow="Published industry path"
        title="Service businesses are the first launch focus."
        intro="This path is built for teams that win work through timely response, complete intake, and dependable handoffs. It does not assume a specific trade or professional specialty."
      >
        <article className="launch-industry-feature">
          <div>
            <p className="eyebrow">Service businesses</p>
            <h3>Keep the customer journey moving while the team delivers the work.</h3>
            <p>
              Structure the recurring questions, qualification steps, scheduling
              preparation, and internal follow-through that surround a service job.
              People retain pricing, relationship, safety, and exception authority.
            </p>
          </div>
          <ul className="launch-check-list">
            <li>Customer response with policy-grounded drafts</li>
            <li>Intake that exposes missing information and edge cases</li>
            <li>Coordination that keeps dependencies and owners visible</li>
          </ul>
          <PageTurnLink
            className="button button-primary"
            href="/industries/service-businesses"
          >
            Explore the Service-Business Path
          </PageTurnLink>
        </article>
      </LaunchSection>

      <LaunchSection
        id="industry-selection"
        eyebrow="Selection discipline"
        title="Fit is defined by the workflow, not the label."
        intro="Dreki does not publish a generic page for every industry. A new industry path should add distinct operating detail, responsibilities, and buyer guidance."
        className="launch-section--contrast"
      >
        <div className="feature-grid feature-grid--three">
          {selectionCriteria.map((item, index) => (
            <article className="feature-card" key={item.title}>
              <span>0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </LaunchSection>

      <LaunchFinalCta
        title="Does your workflow have a clear normal path and exception owner?"
        copy="Bring one recurring process to a strategy call. Dreki will examine its rules, data boundary, human decisions, and practical next step before recommending a build."
      />
    </main>
  );
}
