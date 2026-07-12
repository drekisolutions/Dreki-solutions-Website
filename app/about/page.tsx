import type { Metadata } from "next";
import Image from "next/image";
import PageTurnLink from "../components/PageTurnLink";
import { processSteps } from "../site-data";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn how U.S. Army veteran Brett Moser founded Dreki Solutions to build disciplined agentic software around real operational work.",
  alternates: { canonical: "/about" },
};

const principles = [
  { title: "Service before software", copy: "Start with the people, responsibility, and operating reality before choosing the technology." },
  { title: "Boundaries by design", copy: "Define what an agent may prepare, what it may never decide, and when a person must take over." },
  { title: "Results over reports", copy: "Judge the system by whether the workflow moves with less friction and clearer ownership." },
] as const;

export default function AboutPage() {
  return (
    <main className="page-main" id="main-content">
      <section className="about-hero" aria-labelledby="about-title">
        <div className="about-portrait" aria-hidden="true">
          <Image src="/brand/dreki-icon-1024.webp" alt="" width={1024} height={1024} unoptimized />
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
          <PageTurnLink className="button button-primary" href="/contact#consultation">
            Schedule a Consultation
          </PageTurnLink>
        </div>
      </section>

      <section className="page-section" aria-labelledby="principles-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Operating principles</p>
            <h2 id="principles-title">Built with accountability intact.</h2>
          </div>
          <p>
            Useful automation is not a mystery box. It has a narrow job, trusted
            inputs, visible checkpoints, and a known person responsible for the decision.
          </p>
        </div>
        <div className="feature-grid feature-grid--three">
          {principles.map((principle, index) => (
            <article className="feature-card" key={principle.title}>
              <span>0{index + 1}</span>
              <h3>{principle.title}</h3>
              <p>{principle.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-section process-section" aria-labelledby="about-process-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">How Dreki works</p>
            <h2 id="about-process-title">A deliberate path from friction to system.</h2>
          </div>
        </div>
        <ol className="process-grid">
          {processSteps.map((step) => (
            <li key={step.title}><span>{step.index}</span><h3>{step.title}</h3><p>{step.copy}</p></li>
          ))}
        </ol>
      </section>
    </main>
  );
}
