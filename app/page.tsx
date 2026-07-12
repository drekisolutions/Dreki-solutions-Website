import type { Metadata } from "next";
import Image from "next/image";
import PageTurnLink from "./components/PageTurnLink";
import { processSteps } from "./site-data";

export const metadata: Metadata = {
  title: "Custom Agentic Software",
  description:
    "Dreki Solutions builds custom agentic software for service businesses and aviation operations.",
  alternates: { canonical: "/" },
};

const capabilityPreview = [
  { title: "Service operations", copy: "Customer response, reputation, content, intake, scheduling, handoffs, and recurring administration." },
  { title: "Aviation operations", copy: "Charter-industry workflow software and specialized agents built around accountable human decisions." },
  { title: "Product development", copy: "Focused software products shaped by recurring operating problems and clear user ownership." },
] as const;

export default function HomePage() {
  return (
    <main className="page-main" id="main-content">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="hero-atmosphere" aria-hidden="true" />
        <div className="home-hero__copy">
          <p className="eyebrow"><span /> Agentic software for operations</p>
          <h1 id="home-title">
            Give the repetitive work <em>to an agent.</em>
          </h1>
          <p className="hero-lede">
            Dreki designs custom agentic software for service businesses and
            aviation operations—moving repeatable work forward while people retain
            authority over relationships, exceptions, and final decisions.
          </p>
          <div className="hero-actions">
            <PageTurnLink className="button button-primary" href="/contact#consultation">
              Schedule a Consultation
            </PageTurnLink>
            <PageTurnLink className="button button-ghost" href="/services">
              Explore Services <span aria-hidden="true">→</span>
            </PageTurnLink>
          </div>
          <ul className="hero-trust" aria-label="Dreki principles">
            <li>Custom-fit systems</li>
            <li>Human checkpoints</li>
            <li>Ongoing optimization</li>
          </ul>
        </div>

        <div className="dragon-hex" aria-label="Dreki dragon mark in an obsidian operating lattice">
          <div className="dragon-hex__inner">
            <span className="obsidian-scales" aria-hidden="true" />
            <Image
              src="/brand/dreki-icon-1024.webp"
              alt="Dreki Solutions dragon mark"
              width={1024}
              height={1024}
              priority
              unoptimized
            />
            <p>Systems that know their boundaries.</p>
          </div>
        </div>
      </section>

      <section className="page-section capability-section" aria-labelledby="capabilities-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">One operating partner</p>
            <h2 id="capabilities-title">Software that fits the work.</h2>
          </div>
          <p>
            Dreki starts with the workflow, then builds the smallest useful system
            around approved information, defined boundaries, and visible escalation.
          </p>
        </div>
        <div className="feature-grid feature-grid--three">
          {capabilityPreview.map((item, index) => (
            <article className="feature-card" key={item.title}>
              <span>0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-section process-section" aria-labelledby="process-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The Dreki loop</p>
            <h2 id="process-title">Built to improve after launch.</h2>
          </div>
          <p>
            Every system begins with a narrow responsibility and earns a wider role
            through review, measured use, and deliberate refinement.
          </p>
        </div>
        <ol className="process-grid">
          {processSteps.map((step) => (
            <li key={step.title}>
              <span>{step.index}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="page-cta" aria-labelledby="home-cta-title">
        <p className="eyebrow">Start with the bottleneck</p>
        <h2 id="home-cta-title">Find the work your team should stop repeating.</h2>
        <PageTurnLink className="button button-primary" href="/contact#consultation">
          Schedule a Consultation
        </PageTurnLink>
      </section>
    </main>
  );
}
