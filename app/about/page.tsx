import type { Metadata } from "next";
import Image from "next/image";
import {
  LaunchFinalCta,
  LaunchSection,
  LaunchWorkflow,
} from "../components/marketing/LaunchPrimitives";
import { metadataFromRegistry } from "../content-registry";
import { processSteps } from "../site-data";

export const metadata: Metadata = metadataFromRegistry("/about");

const principles = [
  {
    title: "Service before software",
    copy: "Start with the people, responsibility, and operating reality before choosing the technology.",
  },
  {
    title: "Boundaries by design",
    copy: "Define what an agent may prepare, what it may never decide, and when a person must take over.",
  },
  {
    title: "Evidence before expansion",
    copy: "Review real exceptions and operating results before widening an agent’s responsibility.",
  },
] as const;

export default function AboutPage() {
  return (
    <main className="page-main launch-page" id="main-content">
      <section className="about-hero launch-about-hero" aria-labelledby="about-title">
        <div className="about-portrait" aria-hidden="true">
          <Image
            src="/brand/dreki-icon-1024.webp"
            alt=""
            width={1024}
            height={1024}
            unoptimized
          />
          <span>Built in service</span>
        </div>
        <div className="about-hero__copy">
          <p className="eyebrow">Dreki Solutions LLC</p>
          <h1 id="about-title">Discipline for the work behind the work.</h1>
          <p>
            U.S. Army veteran Brett Moser founded Dreki Solutions to remove the
            repeatable operational work that keeps capable teams from focusing on
            customers, craft, judgment, and mission.
          </p>
          <p>
            Dreki builds agentic software with explicit human ownership. The system
            prepares, coordinates, and escalates; the team retains authority over
            relationships, exceptions, strategy, and final approvals.
          </p>
          <a className="button button-primary" href="/book">
            Book a Strategy Call
          </a>
        </div>
      </section>

      <LaunchSection
        id="about-principles"
        eyebrow="Operating principles"
        title="Accountability stays visible."
        intro="Useful automation is not a mystery box. It has a narrow job, trusted inputs, reviewable outputs, known stop conditions, and a person responsible for the decision."
      >
        <div className="feature-grid feature-grid--three">
          {principles.map((principle, index) => (
            <article className="feature-card" key={principle.title}>
              <span>0{index + 1}</span>
              <h3>{principle.title}</h3>
              <p>{principle.copy}</p>
            </article>
          ))}
        </div>
      </LaunchSection>

      <LaunchSection
        id="about-human-model"
        eyebrow="Human-accountability model"
        title="Software prepares. People remain answerable."
        intro="Dreki separates the repeatable preparation from the consequential decision so teams can gain leverage without pretending responsibility disappeared."
        className="launch-section--contrast"
      >
        <div className="launch-before-after">
          <article>
            <span>Agent responsibility</span>
            <h3>Prepare, check, organize, and escalate.</h3>
            <p>
              An agent works from approved sources, follows the defined path, produces
              a reviewable output, and stops when the situation crosses its boundary.
            </p>
          </article>
          <article>
            <span>Human responsibility</span>
            <h3>Judge, approve, resolve, and remain accountable.</h3>
            <p>
              People own relationships, policy, exceptions, commercial commitments,
              safety, compliance, and any other decision that requires human authority.
            </p>
          </article>
        </div>
      </LaunchSection>

      <LaunchSection
        id="about-process"
        eyebrow="How Dreki works"
        title="A deliberate path from friction to system."
        intro="The work begins with operating reality and expands only through explicit approval."
      >
        <LaunchWorkflow label="Dreki delivery process" steps={processSteps} />
      </LaunchSection>

      <LaunchFinalCta
        title="Bring the operating problem, not a polished specification."
        copy="Dreki will help identify the agent job, source truth, human gates, and practical scope before recommending a system."
      />
    </main>
  );
}
