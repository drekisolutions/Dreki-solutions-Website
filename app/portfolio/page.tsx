import type { Metadata } from "next";
import PageTurnLink from "../components/PageTurnLink";
import {
  InternalDemonstrationDisclosure,
  LaunchFinalCta,
  LaunchHero,
  LaunchListCard,
  LaunchSection,
} from "../components/marketing/LaunchPrimitives";
import { metadataFromRegistry } from "../content-registry";

export const metadata: Metadata = metadataFromRegistry("/portfolio");

const demonstrations = [
  {
    index: "D-01",
    title: "Response Relay",
    focus: "Customer response",
    scenario:
      "A simulated service inquiry arrives with incomplete context and one request outside the approved response policy.",
    flow: [
      "Classify the inquiry",
      "Request the missing detail",
      "Prepare a grounded reply",
      "Escalate the policy exception",
    ],
    humanGate:
      "A person approves the exception and any commitment before the response moves forward.",
  },
  {
    index: "D-02",
    title: "Intake Gate",
    focus: "Intake and scheduling preparation",
    scenario:
      "A simulated appointment request moves through required questions while an unusual service condition is kept out of automatic scheduling.",
    flow: [
      "Collect approved intake details",
      "Check service and scheduling rules",
      "Prepare a complete handoff",
      "Route the unusual condition",
    ],
    humanGate:
      "A scheduler resolves the edge case and owns the final time commitment.",
  },
  {
    index: "D-03",
    title: "Handoff Ledger",
    focus: "Workflow coordination",
    scenario:
      "A simulated service job moves from intake to preparation with one missing dependency and a known escalation checkpoint.",
    flow: [
      "Track stage and next owner",
      "Surface the missing dependency",
      "Prepare a contextual reminder",
      "Escalate at the approved checkpoint",
    ],
    humanGate:
      "An operations owner decides priority, resource changes, and customer-facing commitments.",
  },
] as const;

export default function PortfolioPage() {
  return (
    <main className="page-main launch-page" id="main-content">
      <LaunchHero
        eyebrow="Proof / Internal demonstrations"
        title="Inspect the operating logic before trusting the promise."
        lede="Dreki uses clearly labeled internal demonstrations to show agent jobs, information flow, exception handling, and human approval while permissioned customer evidence is not available."
        primaryHref="/book"
        primaryLabel="Discuss a Workflow"
        secondaryHref="/agents"
        secondaryLabel="Explore Featured Agents"
      >
        <InternalDemonstrationDisclosure />
      </LaunchHero>

      <LaunchSection
        id="internal-demonstrations"
        eyebrow="Demonstration set"
        title="Three simulated service-business workflows."
        intro="Each scenario is designed by Dreki for explanation and evaluation. None represents a named customer, testimonial, deployed customer system, or measured result."
      >
        <div className="product-grid portfolio-grid launch-demo-catalog">
          {demonstrations.map((demo) => (
            <article className="product-card portfolio-card launch-demo-card" key={demo.index}>
              <div>
                <span>{demo.index}</span>
                <small>Internal demonstration</small>
              </div>
              <p>{demo.focus}</p>
              <h3>{demo.title}</h3>
              <p>{demo.scenario}</p>
              <ol className="launch-mini-flow">
                {demo.flow.map((step, index) => (
                  <li key={step}>
                    <span>0{index + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
              <aside>
                <strong>Human gate</strong>
                <p>{demo.humanGate}</p>
              </aside>
            </article>
          ))}
        </div>
      </LaunchSection>

      <LaunchSection
        id="demonstration-meaning"
        eyebrow="Evidence boundary"
        title="What these demonstrations do—and do not—show."
        intro="The scenarios make the design inspectable without turning an internal example into an unsupported customer claim."
        className="launch-section--contrast"
      >
        <div className="feature-grid feature-grid--three">
          <LaunchListCard
            label="SHOWS"
            title="Operating design"
            items={[
              "A narrow agent job",
              "Approved inputs and reviewable outputs",
              "Explicit human gates and escalation",
            ]}
          />
          <LaunchListCard
            label="DOES NOT"
            title="Customer evidence"
            items={[
              "No customer identity or endorsement",
              "No measured customer outcome",
              "No guarantee of savings, speed, or revenue",
            ]}
          />
          <LaunchListCard
            label="NEXT"
            title="Real project validation"
            items={[
              "Map the client’s actual workflow",
              "Approve the sources and boundaries",
              "Define success measures before deployment",
            ]}
          />
        </div>
      </LaunchSection>

      <LaunchSection
        id="demonstration-agent-links"
        eyebrow="Inspect the full agent pages"
        title="Move from scenario to operating contract."
      >
        <div className="hero-actions launch-actions">
          <PageTurnLink className="button button-secondary" href="/agents/customer-response">
            Customer Response
          </PageTurnLink>
          <PageTurnLink
            className="button button-secondary"
            href="/agents/intake-and-scheduling"
          >
            Intake and Scheduling
          </PageTurnLink>
          <PageTurnLink
            className="button button-secondary"
            href="/agents/workflow-coordination"
          >
            Workflow Coordination
          </PageTurnLink>
        </div>
      </LaunchSection>

      <LaunchFinalCta
        title="Replace the simulated scenario with your real workflow."
        copy="A strategy call examines your source information, exception paths, human authority, and practical scope. Any estimate follows that review."
      />
    </main>
  );
}
