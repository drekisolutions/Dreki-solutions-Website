import type { Metadata } from "next";
import GuardianCircuit from "./components/guardian-circuit";
import PageTurnLink from "./components/PageTurnLink";
import {
  InternalDemonstrationDisclosure,
  LaunchFaq,
  LaunchFinalCta,
  LaunchSection,
  LaunchWorkflow,
} from "./components/marketing/LaunchPrimitives";
import {
  featuredAgents,
  metadataFromRegistry,
} from "./content-registry";
import { absoluteUrl, siteConfig } from "./site-config";
import { processSteps } from "./site-data";

export const metadata: Metadata = metadataFromRegistry("/");

const serviceStructuredData = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Governed AI Agent Services",
  url: absoluteUrl("/"),
  serviceType: "AI agent workflow audit, design, deployment, and optimization",
  provider: {
    "@type": "Organization",
    name: siteConfig.legalName,
    url: absoluteUrl("/"),
  },
  audience: {
    "@type": "BusinessAudience",
    audienceType: siteConfig.primaryAudience,
  },
}).replace(/</g, "\\u003c");

const operatingProblems = [
  {
    index: "01",
    signal: "Response lag",
    title: "Good inquiries wait beside routine questions.",
    copy: "The team stops active work to reconstruct context, repeat answers, and decide which message needs an owner.",
  },
  {
    index: "02",
    signal: "Intake drag",
    title: "Incomplete requests create another round of work.",
    copy: "Missing details, service-area questions, and scheduling exceptions surface after the customer expects a clear next step.",
  },
  {
    index: "03",
    signal: "Handoff drift",
    title: "Ownership fades when work crosses a boundary.",
    copy: "Status lives across inboxes and systems, so people spend time asking what changed, what is blocked, and who moves next.",
  },
] as const;

const internalDemonstrations = [
  {
    index: "D-01",
    title: "Response Relay",
    copy: "A simulated inquiry is classified, prepared from approved policy, and stopped at a human gate when the request falls outside the normal path.",
    href: "/agents/customer-response",
  },
  {
    index: "D-02",
    title: "Intake Gate",
    copy: "A simulated request gathers the required details, prepares a scheduling handoff, and exposes an exception before any commitment is made.",
    href: "/agents/intake-and-scheduling",
  },
  {
    index: "D-03",
    title: "Handoff Ledger",
    copy: "A simulated service job keeps its stage, owner, missing dependency, and escalation record visible as work moves between people.",
    href: "/agents/workflow-coordination",
  },
] as const;

const controlPrinciples = [
  {
    label: "SCOPE",
    title: "Narrow responsibility",
    copy: "Each agent receives one defined job, explicit stop conditions, and only the permissions that job requires.",
  },
  {
    label: "SOURCE",
    title: "Approved information",
    copy: "The workflow uses maintained service, policy, schedule, and status sources instead of asking the system to guess.",
  },
  {
    label: "AUTHORITY",
    title: "Human decisions",
    copy: "People retain control of commitments, exceptions, priorities, sensitive situations, and accountable judgment.",
  },
  {
    label: "REVIEW",
    title: "Visible record",
    copy: "Inputs, proposed actions, approvals, outcomes, and exceptions can be reviewed after the work moves.",
  },
] as const;

const homeFaq = [
  {
    question: "What is a governed AI agent?",
    answer:
      "It is software with a narrow operational job, approved sources, defined permissions, explicit stop conditions, and a named person who retains authority over consequential decisions.",
  },
  {
    question: "Does Dreki replace our current systems?",
    answer:
      "Not by default. Dreki first maps the workflow and evaluates the systems already in use. A practical design may coordinate existing tools, add a focused interface, or replace only a clearly bounded step.",
  },
  {
    question: "Which workflow should we start with?",
    answer:
      "Start with repeated work that has clear rules, maintained source information, a known exception owner, and visible friction when response, intake, or handoff is delayed.",
  },
  {
    question: "Will the agent make customer or pricing commitments?",
    answer:
      "Only actions explicitly approved in the production scope can advance. Pricing changes, refunds, promises, unusual requests, and other consequential decisions remain human-owned unless a different, reviewed policy is established.",
  },
  {
    question: "How is a project priced?",
    answer:
      "Dreki provides a scoped estimate after reviewing the workflow, systems, permissions, operating boundaries, and level of ongoing support. The site does not publish one-size-fits-all pricing.",
  },
] as const;

export default function HomePage() {
  return (
    <main className="page-main launch-page home-page" id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serviceStructuredData }}
      />
      <section className="home-hero launch-home-hero" aria-labelledby="home-title">
        <div className="home-hero__copy">
          <p className="eyebrow">
            <span aria-hidden="true" /> Governed AI agents for service businesses
          </p>
          <h1 id="home-title">
            Let agents move the work. <em>Keep people in command.</em>
          </h1>
          <p className="hero-lede">
            Dreki designs focused agent systems for customer response, intake
            and scheduling, and workflow coordination. Routine work arrives
            prepared. Exceptions arrive with context. Your team retains authority.
          </p>
          <div className="hero-actions">
            <PageTurnLink
              className="button button-primary"
              href="/contact#consultation"
            >
              Book a Strategy Call
            </PageTurnLink>
            <PageTurnLink className="button button-ghost" href="/agents">
              Explore the Agents <span aria-hidden="true">↗</span>
            </PageTurnLink>
          </div>
          <ul className="hero-trust" aria-label="Featured agent systems">
            <li>Customer response</li>
            <li>Intake and scheduling</li>
            <li>Workflow coordination</li>
          </ul>
        </div>

        <section
          className="home-command-path"
          aria-label="A governed service workflow moves through preparation, policy checks, human approval, action, and review."
        >
          <div className="home-command-path__header">
            <span>Operating contract</span>
            <small>Human authority / active</small>
          </div>
          <ol>
            <li>
              <span>01</span>
              <div>
                <small>Signal</small>
                <strong>Customer request received</strong>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <small>Agent work</small>
                <strong>Context and next step prepared</strong>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <small>Control</small>
                <strong>Policy and permissions checked</strong>
              </div>
            </li>
            <li className="is-human-gate">
              <span>04</span>
              <div>
                <small>Authority gate</small>
                <strong>Person reviews the exception</strong>
              </div>
            </li>
            <li>
              <span>05</span>
              <div>
                <small>Outcome</small>
                <strong>Approved action and record</strong>
              </div>
            </li>
          </ol>
          <p>
            The system advances only as far as its approved operating boundary.
          </p>
        </section>
      </section>

      <section className="home-principle-strip" aria-label="Dreki operating principles">
        <p>One narrow job</p>
        <p>Approved sources</p>
        <p>Visible exceptions</p>
        <p>Named human owner</p>
      </section>

      <LaunchSection
        id="operating-friction"
        eyebrow="The operating cost"
        title="Repetition hides in the gaps between people and systems."
        intro="The first useful agent is rarely a general assistant. It is a focused operating role built around one recurring source of interruption, delay, or lost context."
      >
        <div className="home-problem-grid">
          {operatingProblems.map((problem) => (
            <article key={problem.index}>
              <div>
                <span>{problem.index}</span>
                <small>{problem.signal}</small>
              </div>
              <h3>{problem.title}</h3>
              <p>{problem.copy}</p>
            </article>
          ))}
        </div>
      </LaunchSection>

      <GuardianCircuit />

      <LaunchSection
        id="featured-agent-systems"
        eyebrow="Three launch systems"
        title="Give each recurring job an explicit operating contract."
        intro="These offers are starting patterns. Dreki adapts the final system to the client’s policies, tools, permissions, exception owners, and customer experience."
        className="launch-section--contrast"
      >
        <div className="product-grid launch-agent-grid home-agent-grid">
          {featuredAgents.map((agent, index) => (
            <article className="product-card launch-agent-card" key={agent.slug}>
              <div>
                <span>0{index + 1}</span>
                <small>Featured agent</small>
              </div>
              <p>{agent.audience}</p>
              <h3>{agent.name}</h3>
              <p>{agent.shortJob}</p>
              <PageTurnLink className="text-link" href={agent.route}>
                Inspect the workflow <span aria-hidden="true">→</span>
              </PageTurnLink>
            </article>
          ))}
        </div>
      </LaunchSection>

      <section className="page-section home-industry-path" aria-labelledby="industry-path-title">
        <div className="home-industry-path__index" aria-hidden="true">
          SB
        </div>
        <div className="home-industry-path__copy">
          <p className="eyebrow">Primary launch audience</p>
          <h2 id="industry-path-title">Built around service-business reality.</h2>
          <p>
            Customer demand arrives while the team is already serving customers.
            Intake must reflect real service areas, job types, calendars, policies,
            and accountable owners. Dreki begins with that operating reality—not a
            generic automation template.
          </p>
          <PageTurnLink className="text-link" href="/industries/service-businesses">
            Explore the service-business path <span aria-hidden="true">→</span>
          </PageTurnLink>
        </div>
        <dl className="home-industry-path__signals">
          <div>
            <dt>Workflows</dt>
            <dd>Response, qualification, scheduling, handoffs</dd>
          </div>
          <div>
            <dt>Control</dt>
            <dd>Policies, permissions, human exceptions</dd>
          </div>
          <div>
            <dt>Starting point</dt>
            <dd>One recurring bottleneck with a named owner</dd>
          </div>
        </dl>
      </section>

      <LaunchSection
        id="dreki-delivery-loop"
        eyebrow="Audit → Design → Deploy → Optimize"
        title="A controlled path from friction to responsibility."
        intro="The first scope is intentionally narrow. A system earns wider responsibility only through observed use, review, and deliberate approval."
      >
        <LaunchWorkflow label="Dreki delivery process" steps={processSteps} />
      </LaunchSection>

      <LaunchSection
        id="internal-demonstrations"
        eyebrow="Proof without pretense"
        title="Inspect the workflow before accepting the promise."
        intro="Until approved customer case studies exist, Dreki uses internal demonstrations to show operating logic, permissions, stop conditions, and human-control points."
        className="launch-section--contrast"
      >
        <InternalDemonstrationDisclosure />
        <div className="home-demo-grid">
          {internalDemonstrations.map((demo) => (
            <article key={demo.index}>
              <span>{demo.index}</span>
              <h3>{demo.title}</h3>
              <p>{demo.copy}</p>
              <PageTurnLink className="text-link" href={demo.href}>
                View the agent pattern <span aria-hidden="true">→</span>
              </PageTurnLink>
            </article>
          ))}
        </div>
      </LaunchSection>

      <LaunchSection
        id="operational-controls"
        eyebrow="Security and operational control"
        title="Useful automation starts with limits."
        intro="The final controls depend on the client’s systems and risk profile. These principles are designed into the scope before production access is granted."
      >
        <div className="home-control-grid">
          {controlPrinciples.map((principle) => (
            <article key={principle.label}>
              <span>{principle.label}</span>
              <h3>{principle.title}</h3>
              <p>{principle.copy}</p>
            </article>
          ))}
        </div>
      </LaunchSection>

      <section className="page-section home-engagement" aria-labelledby="engagement-title">
        <div>
          <p className="eyebrow">A scoped commercial path</p>
          <h2 id="engagement-title">No generic package. No mystery proposal.</h2>
        </div>
        <div>
          <p>
            Bring one workflow and the people who own it. Dreki maps the current
            path, identifies the information and authority boundaries, and proposes
            the smallest useful engagement.
          </p>
          <ul>
            <li>Workflow audit and operating map</li>
            <li>Fixed-scope agent pilot</li>
            <li>Custom implementation and managed optimization</li>
          </ul>
          <PageTurnLink className="button button-secondary" href="/engagements">
            See How Engagements Work
          </PageTurnLink>
        </div>
      </section>

      <LaunchSection
        id="home-faq"
        eyebrow="Questions before the call"
        title="Make the operating boundaries clear early."
        className="launch-section--contrast"
      >
        <LaunchFaq items={homeFaq} />
      </LaunchSection>

      <LaunchFinalCta
        eyebrow="Start with the bottleneck"
        title="Bring one workflow your team should stop reconstructing."
        copy="Dreki will examine the current path, the information it depends on, and the decisions your people must retain. If a governed agent is a practical fit, the next step is a scoped estimate."
        href="/contact#consultation"
        label="Book a Strategy Call"
      />
    </main>
  );
}
