import type { Metadata } from "next";
import PageTurnLink from "../components/PageTurnLink";
import {
  LaunchFinalCta,
  LaunchHero,
  LaunchRelatedLinks,
  LaunchSection,
} from "../components/marketing/LaunchPrimitives";
import { featuredAgents, metadataFromRegistry } from "../content-registry";

export const metadata: Metadata = metadataFromRegistry("/agents");

const fitSignals = [
  {
    title: "Repeated decisions are already defined",
    copy: "The team can explain the normal path, the exception path, and who owns the decision.",
  },
  {
    title: "Context exists in approved sources",
    copy: "The workflow can rely on maintained policies, service information, records, or system status.",
  },
  {
    title: "The handoff matters",
    copy: "Late response, incomplete intake, or a missed dependency creates visible operating friction.",
  },
] as const;

export default function AgentsPage() {
  return (
    <main className="page-main launch-page" id="main-content">
      <LaunchHero
        eyebrow="Bounded agent systems"
        title="Give the repeatable work a clear owner."
        lede="Dreki designs agents for narrow operational jobs. Each system prepares work from approved inputs, shows its reasoning checkpoints, and hands consequential decisions back to a person."
        primaryHref="/book"
        primaryLabel="Book a Strategy Call"
        secondaryHref="/industries/service-businesses"
        secondaryLabel="Explore Service Businesses"
      >
        <div className="launch-signal-panel">
          <span>Launch focus</span>
          <strong>Response → Intake → Coordination</strong>
          <p>Three connected jobs. Human authority at every exception.</p>
        </div>
      </LaunchHero>

      <LaunchSection
        id="featured-agents"
        eyebrow="Featured agents"
        title="Choose the operational job, not the buzzword."
        intro="These offers are starting points for scope. The production design is adapted to the client’s policies, systems, permissions, and accountable owners."
      >
        <div className="product-grid launch-agent-grid">
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
                Inspect the workflow
              </PageTurnLink>
            </article>
          ))}
        </div>
      </LaunchSection>

      <LaunchSection
        id="agent-fit"
        eyebrow="Fit signals"
        title="A good first agent has a narrow job."
        intro="Dreki starts where the operating rules can be made explicit. Ambiguous authority and missing source material are design problems to resolve, not gaps for an agent to guess through."
        className="launch-section--contrast"
      >
        <div className="feature-grid feature-grid--three">
          {fitSignals.map((signal, index) => (
            <article className="feature-card" key={signal.title}>
              <span>0{index + 1}</span>
              <h3>{signal.title}</h3>
              <p>{signal.copy}</p>
            </article>
          ))}
        </div>
      </LaunchSection>

      <LaunchSection
        id="connected-system"
        eyebrow="Connected operations"
        title="The three agents can share a handoff without sharing authority."
        intro="A response workflow can gather the context needed for intake. Intake can prepare a scheduling handoff. Coordination can keep the resulting work visible. Each step still has its own permissions, stop conditions, and human owner."
      >
        <section className="launch-flow-strip" aria-label="Connected service workflow">
          <article>
            <span>01</span>
            <h3>Respond</h3>
            <p>Understand the request and prepare the approved next move.</p>
          </article>
          <span aria-hidden="true">→</span>
          <article>
            <span>02</span>
            <h3>Qualify</h3>
            <p>Collect what is needed and expose the exceptions.</p>
          </article>
          <span aria-hidden="true">→</span>
          <article>
            <span>03</span>
            <h3>Coordinate</h3>
            <p>Keep owners, dependencies, and handoffs visible.</p>
          </article>
        </section>
      </LaunchSection>

      <section className="page-section launch-section launch-section--related">
        <LaunchRelatedLinks
          links={[
            {
              href: "/portfolio",
              label: "Internal demonstrations",
              description: "Inspect simulated operating scenarios.",
            },
            {
              href: "/services",
              label: "Custom services",
              description: "See how Dreki designs and deploys a system.",
            },
            {
              href: "/engagements",
              label: "Engagements",
              description: "Understand scope and buying steps.",
            },
          ]}
        />
      </section>

      <LaunchFinalCta
        title="Start with one recurring operational drag."
        copy="Bring the workflow, its source information, and the decisions your team must retain. Dreki will determine whether one of these agent patterns is a practical starting point."
      />
    </main>
  );
}
