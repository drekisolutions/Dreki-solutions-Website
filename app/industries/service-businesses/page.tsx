import type { Metadata } from "next";
import PageTurnLink from "../../components/PageTurnLink";
import {
  InternalDemonstrationDisclosure,
  LaunchFaq,
  LaunchFinalCta,
  LaunchHero,
  LaunchListCard,
  LaunchSection,
} from "../../components/marketing/LaunchPrimitives";
import { featuredAgents, metadataFromRegistry } from "../../content-registry";

export const metadata: Metadata = metadataFromRegistry(
  "/industries/service-businesses",
);

const friction = [
  {
    title: "The inquiry waits for context",
    copy: "The team stops current work to find service details, ask missing questions, and decide who should respond.",
  },
  {
    title: "The appointment starts incomplete",
    copy: "Important job, location, access, or timing details are discovered after expectations have already formed.",
  },
  {
    title: "The handoff lives in memory",
    copy: "Owners and dependencies become unclear when work crosses from sales to office, field, vendor, or follow-up.",
  },
] as const;

const responsibilities = [
  "People approve pricing, discounts, refunds, contracts, and other commercial commitments.",
  "Qualified people retain safety, technical, legal, personnel, and compliance judgment.",
  "The relationship owner handles complaints, sensitive situations, and unusual requests.",
] as const;

const faq = [
  {
    question: "What kind of service business is a good fit?",
    answer:
      "A good fit has repeated inquiry, intake, or coordination work; maintained source information; and clear people who own exceptions. The exact trade or specialty is less important than the workflow.",
  },
  {
    question: "Do we need clean systems before starting?",
    answer:
      "Not perfect systems, but the source of truth and accountable owner must be identifiable. Discovery may show that documentation or process repair should happen before automation.",
  },
  {
    question: "Will an agent talk to customers without review?",
    answer:
      "Only actions approved in the final scope can run without a checkpoint. Sensitive requests, commitments, and exceptions remain human-owned.",
  },
  {
    question: "How is pricing determined?",
    answer:
      "Dreki does not publish a one-size-fits-all price. A scoped estimate follows review of the workflow, systems, permissions, risk, and level of ongoing support.",
  },
] as const;

export default function ServiceBusinessesPage() {
  return (
    <main className="page-main launch-page" id="main-content">
      <LaunchHero
        eyebrow="Industry / Service businesses"
        title="Keep the customer journey moving while your team does the work."
        lede="Dreki designs bounded agents around the response, intake, scheduling preparation, and handoffs that surround service delivery."
        primaryHref="/book"
        primaryLabel="Book a Strategy Call"
        secondaryHref="/agents"
        secondaryLabel="Compare Featured Agents"
      >
        <div className="launch-signal-panel">
          <span>Best starting point</span>
          <strong>One recurring workflow</strong>
          <p>Approved rules. Named exception owner. Measurable completion signal.</p>
        </div>
      </LaunchHero>

      <LaunchSection
        id="service-business-friction"
        eyebrow="Common friction"
        title="The work around the job consumes the team."
        intro="These patterns appear in many service businesses, but the correct design depends on the company’s actual policy, customer promise, systems, and risk."
      >
        <div className="feature-grid feature-grid--three">
          {friction.map((item, index) => (
            <article className="feature-card" key={item.title}>
              <span>0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </LaunchSection>

      <LaunchSection
        id="service-business-use-cases"
        eyebrow="High-value use cases"
        title="Three agent jobs can support one customer path."
        intro="Each agent can stand alone. When they connect, the handoff is designed explicitly so one system does not silently inherit another system’s authority."
        className="launch-section--contrast"
      >
        <div className="product-grid launch-agent-grid">
          {featuredAgents.map((agent, index) => (
            <article className="product-card launch-agent-card" key={agent.slug}>
              <div>
                <span>0{index + 1}</span>
                <small>Bounded workflow</small>
              </div>
              <p>{agent.audience}</p>
              <h3>{agent.name}</h3>
              <p>{agent.shortJob}</p>
              <PageTurnLink className="text-link" href={agent.route}>
                Inspect this agent
              </PageTurnLink>
            </article>
          ))}
        </div>
      </LaunchSection>

      <LaunchSection
        id="service-business-flow"
        eyebrow="Example operating flow"
        title="A request moves forward without skipping the gates."
      >
        <div className="launch-flow-strip" aria-label="Example service-business operating flow">
          <article>
            <span>01</span>
            <h3>Request</h3>
            <p>An inquiry is classified and checked for missing context.</p>
          </article>
          <span aria-hidden="true">→</span>
          <article>
            <span>02</span>
            <h3>Intake</h3>
            <p>Approved questions prepare a complete scheduling handoff.</p>
          </article>
          <span aria-hidden="true">→</span>
          <article>
            <span>03</span>
            <h3>Approval</h3>
            <p>A person resolves price, risk, exception, or commitment.</p>
          </article>
          <span aria-hidden="true">→</span>
          <article>
            <span>04</span>
            <h3>Coordinate</h3>
            <p>Dependencies, next owner, and status remain visible.</p>
          </article>
        </div>
      </LaunchSection>

      <LaunchSection
        id="service-business-responsibilities"
        eyebrow="Authority and data"
        title="Automation does not move accountability."
        intro="The production scope names the people, permissions, stop conditions, and record locations before an agent receives responsibility."
        className="launch-section--contrast"
      >
        <div className="feature-grid feature-grid--three">
          <LaunchListCard
            label="HUMAN"
            title="Responsibilities people retain"
            items={responsibilities}
          />
          <LaunchListCard
            label="ACCESS"
            title="System boundaries"
            items={[
              "Use the narrowest practical access to approved sources.",
              "Separate draft preparation from consequential actions.",
              "Make exceptions and source context reviewable.",
            ]}
          />
          <LaunchListCard
            label="DATA"
            title="Information boundaries"
            items={[
              "Collect only what the workflow needs.",
              "Define retention and deletion before launch.",
              "Keep personal information out of analytics and unnecessary logs.",
            ]}
          />
        </div>
      </LaunchSection>

      <LaunchSection
        id="service-business-proof"
        eyebrow="Proof approach"
        title="Inspect the workflow through internal demonstrations."
        intro="Until permissioned customer evidence exists, Dreki shows simulated scenarios and labels them clearly. The goal is to expose the operating logic and human controls—not imply a customer result."
      >
        <InternalDemonstrationDisclosure />
        <PageTurnLink className="button button-secondary" href="/portfolio">
          View Internal Demonstrations
        </PageTurnLink>
      </LaunchSection>

      <LaunchSection
        id="service-business-faq"
        eyebrow="Buyer questions"
        title="Questions service-business leaders ask first."
        className="launch-section--contrast"
      >
        <LaunchFaq items={faq} />
      </LaunchSection>

      <LaunchFinalCta
        title="Map one workflow from first signal to final owner."
        copy="A strategy call starts with the current process, not a software pitch. Dreki will identify the repeatable work, the human gates, and what must be true before a scoped estimate makes sense."
      />
    </main>
  );
}
