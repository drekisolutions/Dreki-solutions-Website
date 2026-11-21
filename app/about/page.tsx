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
    copy: "We review how customers find you before we recommend any work.",
  },
  {
    title: "The owner is the brand",
    copy: "The company brand and your personal brand should sound like you.",
  },
  {
    title: "You work with Brett",
    copy: "You talk to the founder. There are no account managers.",
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
            U.S. Army veteran Brett Moser runs Dreki Solutions from Manitou
            Beach, Michigan. He helps owner-led small businesses get found
            online and get chosen.
          </p>
          <p>
            Dreki Solutions LLC is an SBA-certified Service-Disabled Veteran-Owned
            Small Business (SDVOSB).
          </p>
          <p>
            The work goes in this order: a free digital presence audit, brand
            for the company and for the owner, monthly social content, and
            profile and site fixes. Brand, profile, and site fixes are quoted
            privately. They are not part of the monthly social plan.
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
        intro="Automation does the production. That is faster, and it costs less than a traditional agency. You still approve the work before it goes out."
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

      <LaunchFinalCta
        eyebrow="Step 1"
        title="Start with the free audit."
        copy="It reviews your Google Business Profile, website, and social accounts, and lists what to fix first. The audit is free."
      />
    </main>
  );
}
