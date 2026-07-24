import type { Metadata } from "next";
import PageTurnLink from "../components/PageTurnLink";
import {
  LaunchFinalCta,
  LaunchHero,
  LaunchListCard,
  LaunchSection,
  LaunchWorkflow,
} from "../components/marketing/LaunchPrimitives";
import { featuredAgents, metadataFromRegistry } from "../content-registry";
import { processSteps } from "../site-data";

export const metadata: Metadata = metadataFromRegistry("/services");

const servicePaths = [
  {
    index: "01",
    title: "Workflow audit",
    copy: "Map the current operating path, source information, owners, exceptions, and decisions that must stay human before selecting a technical approach.",
    outcome: "A prioritized, bounded opportunity",
  },
  {
    index: "02",
    title: "Custom agent development",
    copy: "Design and implement a narrow agent job around approved inputs, visible outputs, explicit stop conditions, and a controlled handoff.",
    outcome: "A system with accountable authority",
  },
  {
    index: "03",
    title: "Managed agent operations",
    copy: "Review exceptions, adjust approved instructions, and improve the operating workflow as source material, policies, and team responsibilities change.",
    outcome: "A maintained operating responsibility",
  },
] as const;

export default function ServicesPage() {
  return (
    <main className="page-main launch-page" id="main-content">
      <LaunchHero
        eyebrow="Custom agentic software services"
        title="Turn one recurring workflow into a controlled system."
        lede="Dreki audits, designs, deploys, and improves bounded agents for service-business response, intake, scheduling preparation, and coordination."
        primaryHref="/book"
        primaryLabel="Discuss a Workflow"
        secondaryHref="/agents"
        secondaryLabel="Explore Featured Agents"
      >
        <div className="launch-signal-panel">
          <span>Delivery discipline</span>
          <strong>Audit → Design → Deploy → Optimize</strong>
          <p>Source truth, human gates, and exceptions defined before responsibility expands.</p>
        </div>
      </LaunchHero>

      <LaunchSection
        id="service-paths"
        eyebrow="Service paths"
        title="Resolve the right uncertainty first."
        intro="Not every workflow is ready for a build. Dreki can begin by mapping the process, implementing an approved agent job, or maintaining a deployed responsibility."
      >
        <div className="product-grid launch-service-grid">
          {servicePaths.map((service) => (
            <article className="product-card launch-service-card" key={service.title}>
              <div>
                <span>{service.index}</span>
                <small>Custom scope</small>
              </div>
              <p>{service.outcome}</p>
              <h3>{service.title}</h3>
              <p>{service.copy}</p>
            </article>
          ))}
        </div>
      </LaunchSection>

      <LaunchSection
        id="delivery-process"
        eyebrow="Delivery process"
        title="A deliberate path from friction to responsibility."
        intro="Each stage has an exit condition. Dreki does not widen an agent’s role simply because a prototype can produce an answer."
        className="launch-section--contrast"
      >
        <LaunchWorkflow label="Dreki service delivery process" steps={processSteps} />
      </LaunchSection>

      <LaunchSection
        id="service-controls"
        eyebrow="Operating controls"
        title="The implementation includes the boundary."
        intro="Useful agentic software needs more than a model and a prompt. The scope must define where information comes from, which actions are permitted, and who handles exceptions."
      >
        <div className="feature-grid feature-grid--three">
          <LaunchListCard
            label="SOURCE"
            title="Trusted inputs"
            items={[
              "Approved policies, service details, and operating records",
              "Clear ownership of source updates",
              "No invented facts when context is missing",
            ]}
          />
          <LaunchListCard
            label="GATE"
            title="Human authority"
            items={[
              "Named approval and escalation points",
              "Consequential decisions remain with qualified people",
              "Exceptions are made visible, not silently resolved",
            ]}
          />
          <LaunchListCard
            label="ACCESS"
            title="Narrow permissions"
            items={[
              "Only the systems and actions required for the job",
              "Data retention and review defined before deployment",
              "Operating changes follow an approved release path",
            ]}
          />
        </div>
      </LaunchSection>

      <LaunchSection
        id="service-agent-patterns"
        eyebrow="Launch agent patterns"
        title="Start from a concrete job shape."
        intro="The featured agents provide concrete operating patterns. The final system is still scoped around the client’s workflow, data, systems, and authority."
        className="launch-section--contrast"
      >
        <div className="feature-grid feature-grid--three">
          {featuredAgents.map((agent, index) => (
            <article className="feature-card launch-agent-summary" key={agent.slug}>
              <span>0{index + 1}</span>
              <h3>{agent.name}</h3>
              <p>{agent.shortJob}</p>
              <PageTurnLink className="text-link" href={agent.route}>
                Inspect the agent
              </PageTurnLink>
            </article>
          ))}
        </div>
      </LaunchSection>

      <LaunchFinalCta
        title="Scope the operating responsibility, not a generic feature list."
        copy="Bring one recurring workflow and the people who own its exceptions. If the work is a fit, Dreki will prepare a scoped estimate after the strategy call."
      />
    </main>
  );
}
