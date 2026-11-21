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
    title: "Start with the audit",
    copy: "We look at how customers find you today before we recommend anything.",
  },
  {
    title: "Nothing posts without you",
    copy: "You approve the content calendar before anything goes out.",
  },
  {
    title: "Plain terms",
    copy: "Clear deliverables and plain language. No jargon and no surprises.",
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
          <h1 id="about-title">Good work deserves to be found.</h1>
          <p>
            U.S. Army veteran Brett Moser founded Dreki Solutions to help
            owner-led small businesses get found, look the part, and stay in
            front of customers.
          </p>
          <p>
            Dreki Solutions LLC is an SBA-certified Service-Disabled Veteran-Owned
            Small Business (SDVOSB).
          </p>
          <p>
            Dreki does three things: social media marketing, brand development,
            and a free digital presence audit. You approve the work before it
            goes out.
          </p>
          <a className="button button-primary" href="/free-audit">
            Start with a free audit
          </a>
        </div>
      </section>

      <LaunchSection
        id="about-principles"
        eyebrow="How we work"
        title="You stay in charge."
        intro="You know your business. We do the marketing work and bring it to you for approval."
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
        id="about-process"
        eyebrow="How Dreki works"
        title="From a first look to a steady presence."
        intro="Every engagement starts with the free digital presence audit."
        className="launch-section--contrast"
      >
        <LaunchWorkflow label="Dreki delivery process" steps={processSteps} />
      </LaunchSection>

      <LaunchFinalCta />
    </main>
  );
}
