import type { Metadata } from "next";
import {
  LaunchFinalCta,
  LaunchHero,
  LaunchListCard,
  LaunchSection,
  LaunchWorkflow,
} from "../components/marketing/LaunchPrimitives";
import { metadataFromRegistry } from "../content-registry";

export const metadata: Metadata = metadataFromRegistry("/engagements");

const engagementPaths = [
  {
    index: "01",
    title: "Workflow audit",
    fit: "For a team that knows where friction appears but needs the operating path, ownership, and automation boundary made explicit.",
    includes: [
      "Current-state workflow map",
      "Sources, handoffs, and exception inventory",
      "Human-approval and agent-boundary recommendation",
      "Prioritized next-step scope",
    ],
  },
  {
    index: "02",
    title: "Custom agent build",
    fit: "For an approved workflow with identifiable source information, accountable owners, and a practical deployment path.",
    includes: [
      "Agent job and operating contract",
      "Approved source and connection design",
      "Checkpoint, escalation, and review experience",
      "Controlled deployment and handoff",
    ],
  },
  {
    index: "03",
    title: "Managed optimization",
    fit: "For a deployed workflow that needs review, instruction updates, exception analysis, and controlled operating changes.",
    includes: [
      "Defined review cadence",
      "Exception and failure-pattern review",
      "Approved instruction and workflow changes",
      "Release notes and accountable approvals",
    ],
  },
] as const;

const buyingSteps = [
  {
    index: "01",
    title: "Strategy call",
    copy: "Describe one workflow, why it matters, the current systems, and who owns the exceptions.",
  },
  {
    index: "02",
    title: "Fit review",
    copy: "Dreki identifies missing source material, permission constraints, human gates, and disqualifying risks.",
  },
  {
    index: "03",
    title: "Scoped estimate",
    copy: "If the work is a fit, Dreki defines deliverables, assumptions, client responsibilities, and commercial terms.",
  },
  {
    index: "04",
    title: "Controlled start",
    copy: "Work begins only after scope, access, responsibilities, and approval conditions are accepted.",
  },
] as const;

export default function EngagementsPage() {
  return (
    <main className="page-main launch-page" id="main-content">
      <LaunchHero
        eyebrow="How buying works"
        title="Scope the workflow before pricing the system."
        lede="Dreki does not publish one-size-fits-all agent pricing. A useful estimate depends on the workflow, source systems, permissions, exception risk, and level of ongoing operating support."
        primaryHref="/book"
        primaryLabel="Request a Strategy Call"
        secondaryHref="/services"
        secondaryLabel="Explore Services"
      >
        <div className="launch-signal-panel">
          <span>Pricing approach</span>
          <strong>Scoped estimates only</strong>
          <p>No generic package, unsupported promise, or surprise responsibility.</p>
        </div>
      </LaunchHero>

      <LaunchSection
        id="engagement-paths"
        eyebrow="Engagement paths"
        title="Choose the level of uncertainty to resolve."
        intro="The strategy call determines whether the next step is discovery, a build, ongoing optimization, or no engagement at all."
      >
        <div className="product-grid launch-engagement-grid">
          {engagementPaths.map((path) => (
            <article className="product-card launch-engagement-card" key={path.title}>
              <div>
                <span>{path.index}</span>
                <small>Custom scope</small>
              </div>
              <p>Engagement path</p>
              <h3>{path.title}</h3>
              <p>{path.fit}</p>
              <ul className="launch-check-list">
                {path.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </LaunchSection>

      <LaunchSection
        id="buying-steps"
        eyebrow="Buying sequence"
        title="A clear path from question to scope."
        intro="A strategy call is a fit conversation, not a promise that every workflow should become an agent."
        className="launch-section--contrast"
      >
        <LaunchWorkflow label="Dreki engagement buying steps" steps={buyingSteps} />
      </LaunchSection>

      <LaunchSection
        id="estimate-inputs"
        eyebrow="Estimate inputs"
        title="What shapes a scoped estimate."
        intro="Dreki prices the actual responsibility and delivery work after these conditions are understood."
      >
        <div className="feature-grid feature-grid--three">
          <LaunchListCard
            label="FLOW"
            title="Workflow complexity"
            items={[
              "Number of stages, owners, and exception paths",
              "Quality of current documentation",
              "Required review and audit visibility",
            ]}
          />
          <LaunchListCard
            label="SYSTEM"
            title="Technical boundary"
            items={[
              "Available connection methods",
              "Permission and data constraints",
              "Deployment and operating environment",
            ]}
          />
          <LaunchListCard
            label="CARE"
            title="Ongoing responsibility"
            items={[
              "Monitoring and exception review needs",
              "Expected policy or workflow changes",
              "Client and Dreki ownership after launch",
            ]}
          />
        </div>
      </LaunchSection>

      <LaunchSection
        id="client-responsibilities"
        eyebrow="Shared responsibility"
        title="The client supplies authority and source truth."
        intro="Dreki can design and implement the system. The client remains responsible for its policies, access decisions, domain judgment, approvals, and lawful use."
        className="launch-section--contrast"
      >
        <div className="launch-before-after">
          <article>
            <span>Client provides</span>
            <h3>Source truth and accountable owners.</h3>
            <p>
              Current policy, representative workflow examples, system access decisions,
              exception owners, review time, and approval of the operating boundary.
            </p>
          </article>
          <article>
            <span>Dreki provides</span>
            <h3>Design discipline and visible controls.</h3>
            <p>
              Workflow mapping, agent design, implementation within the agreed scope,
              explicit checkpoints, deployment support, and documented handoff.
            </p>
          </article>
        </div>
      </LaunchSection>

      <LaunchFinalCta
        title="Request an estimate grounded in your workflow."
        copy="Bring one process, the systems it touches, and the people who own its exceptions. If the fit is sound, Dreki will prepare a scoped next step."
        label="Request a Strategy Call"
      />
    </main>
  );
}
