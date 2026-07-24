import type { AgentOffer } from "../../content-registry";
import { processSteps } from "../../site-data";
import {
  InternalDemonstrationDisclosure,
  LaunchFaq,
  LaunchFinalCta,
  LaunchHero,
  LaunchListCard,
  LaunchRelatedLinks,
  LaunchSection,
  LaunchWorkflow,
} from "./LaunchPrimitives";

type AgentDetailPageProps = {
  agent: AgentOffer;
  sequence: string;
};

export default function AgentDetailPage({ agent, sequence }: AgentDetailPageProps) {
  return (
    <main className="page-main launch-page" id="main-content">
      <LaunchHero
        eyebrow={`${sequence} / Featured agent`}
        title={agent.name}
        lede={agent.shortJob}
        primaryHref="/book"
        primaryLabel="Discuss This Workflow"
        secondaryHref="/portfolio"
        secondaryLabel="View Internal Demos"
      >
        <div className="launch-signal-panel">
          <span>Designed for</span>
          <p>{agent.audience}</p>
          <small>Custom scope. Human authority remains explicit.</small>
        </div>
      </LaunchHero>

      <LaunchSection
        id={`${agent.slug}-problem`}
        eyebrow="The operating problem"
        title="Prepare the repeatable work without hiding responsibility."
        intro={agent.problem}
      >
        <div className="feature-grid feature-grid--three launch-task-grid">
          {agent.tasks.map((task, index) => (
            <article className="feature-card" key={task}>
              <span>0{index + 1}</span>
              <h3>{task}</h3>
            </article>
          ))}
        </div>
      </LaunchSection>

      <LaunchSection
        id={`${agent.slug}-contract`}
        eyebrow="The operating contract"
        title="Known inputs. Visible outputs."
        intro="The final design depends on the client’s systems and policies. These are the categories Dreki defines before an agent receives production responsibility."
        className="launch-section--contrast"
      >
        <div className="feature-grid feature-grid--three launch-contract-grid">
          <LaunchListCard label="IN" title="Approved inputs" items={agent.inputs} />
          <LaunchListCard label="OUT" title="Prepared outputs" items={agent.outputs} />
          <LaunchListCard
            label="HUMAN"
            title="Approval and escalation"
            items={agent.approvalPoints}
          />
        </div>
      </LaunchSection>

      <LaunchSection
        id={`${agent.slug}-change`}
        eyebrow="Workflow change"
        title="From interruption-driven to checkpoint-driven."
      >
        <div className="launch-before-after">
          <article>
            <span>Before</span>
            <h3>People reconstruct the routine.</h3>
            <p>{agent.before}</p>
          </article>
          <article>
            <span>After</span>
            <h3>The routine arrives prepared.</h3>
            <p>{agent.after}</p>
          </article>
        </div>
      </LaunchSection>

      <LaunchSection
        id={`${agent.slug}-boundaries`}
        eyebrow="Human authority"
        title="The agent has a job, not a blank check."
        intro="Dreki defines the stop conditions before deployment. When a workflow crosses one, the system exposes the reason and hands control to the named person."
        className="launch-section--contrast"
      >
        <div className="feature-grid feature-grid--three">
          <LaunchListCard
            label="GATE"
            title="Human approval points"
            items={agent.approvalPoints}
          />
          <LaunchListCard
            label="NEVER"
            title="Explicit exclusions"
            items={agent.exclusions}
          />
          <LaunchListCard
            label="DATA"
            title="Data boundaries"
            items={agent.dataBoundaries}
          />
        </div>
      </LaunchSection>

      <LaunchSection
        id={`${agent.slug}-implementation`}
        eyebrow="Implementation path"
        title="Start with one accountable workflow."
        intro="A scoped engagement moves from operating reality to a controlled production responsibility. No connection or capability is assumed before discovery."
      >
        <LaunchWorkflow label={`${agent.name} implementation path`} steps={processSteps} />
      </LaunchSection>

      <LaunchSection
        id={`${agent.slug}-demonstration`}
        eyebrow="Proof approach"
        title={agent.demonstration.title}
        intro={agent.demonstration.scenario}
        className="launch-section--contrast"
      >
        <InternalDemonstrationDisclosure />
        <div className="feature-grid feature-grid--three launch-demo-grid">
          {agent.demonstration.shows.map((item, index) => (
            <article className="feature-card" key={item}>
              <span>0{index + 1}</span>
              <h3>{item}</h3>
            </article>
          ))}
        </div>
      </LaunchSection>

      <LaunchSection
        id={`${agent.slug}-faq`}
        eyebrow="Buyer questions"
        title="Questions to resolve before scope."
      >
        <LaunchFaq items={agent.faq} />
      </LaunchSection>

      <section className="page-section launch-section launch-section--related">
        <LaunchRelatedLinks
          links={[
            {
              href: "/agents",
              label: "All featured agents",
              description: "Compare the three launch workflows.",
            },
            {
              href: "/industries/service-businesses",
              label: "Service businesses",
              description: "See where the workflows fit together.",
            },
            {
              href: "/engagements",
              label: "Engagements",
              description: "Understand how a scoped project begins.",
            },
          ]}
        />
      </section>

      <LaunchFinalCta
        title="Bring one workflow worth examining."
        copy="Dreki will map the current handoffs, identify the decisions that must stay human, and determine whether a bounded agent is a practical fit. Estimates are scoped after that conversation."
      />
    </main>
  );
}
