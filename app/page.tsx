import DrekiExperience from "./DrekiExperience";
import Image from "next/image";

const auditMailto =
  "mailto:Brett@dreki-solutions.com?subject=Optimization%20Audit%20Request&body=Business%20name%3A%0D%0AWebsite%3A%0D%0AWorkflow%20to%20optimize%3A%0D%0APreferred%20contact%20method%3A%0D%0A";

const bottlenecks = [
  {
    label: "Customer response",
    title: "Inquiries wait for the right person.",
    copy: "Important requests arrive while the team is driving, serving customers, or solving the next problem.",
  },
  {
    label: "Reputation",
    title: "Reviews sit unanswered.",
    copy: "Feedback moves faster than the time available to monitor, route, and draft a thoughtful response.",
  },
  {
    label: "Content",
    title: "Consistency loses to urgency.",
    copy: "Useful updates and customer education fall behind whenever the day gets crowded.",
  },
  {
    label: "Intake",
    title: "Details get collected twice.",
    copy: "Teams copy the same information between messages, calendars, documents, and internal systems.",
  },
  {
    label: "Handoffs",
    title: "Context disappears between steps.",
    copy: "Work slows when the next person has to reconstruct what happened and decide what comes next.",
  },
  {
    label: "Administration",
    title: "Recurring work keeps recurring.",
    copy: "Routine follow-ups, status checks, and record updates consume attention every single week.",
  },
];

const systems = [
  {
    index: "01",
    title: "Customer response",
    copy: "Triage inquiries, gather the right context, prepare clear replies, and route exceptions to a person.",
    detail: "Faster first response",
  },
  {
    index: "02",
    title: "Reputation operations",
    copy: "Monitor feedback, organize priorities, draft brand-safe responses, and keep final approval human.",
    detail: "Consistent brand care",
  },
  {
    index: "03",
    title: "Content operations",
    copy: "Turn approved ideas into an organized publishing flow without removing editorial judgment.",
    detail: "A steadier presence",
  },
  {
    index: "04",
    title: "Workflow coordination",
    copy: "Connect intake, scheduling, handoffs, reminders, and recurring administration around defined rules.",
    detail: "Less operational drag",
  },
];

const loop = [
  {
    step: "Audit",
    copy: "Map the real workflow, the delays inside it, and the decisions that must stay with your team.",
  },
  {
    step: "Design",
    copy: "Give the agent a narrow job, trusted sources, clear boundaries, and a human escalation path.",
  },
  {
    step: "Deploy",
    copy: "Connect the approved system gradually, with visible checkpoints before it carries more work.",
  },
  {
    step: "Optimize",
    copy: "Review what happened, refine the instructions, and improve the workflow as the business changes.",
  },
];

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Dreki Solutions LLC",
    url: "https://dreki-solutions.com/",
    logo: "https://dreki-solutions.com/brand/dreki-icon-1024.webp",
    email: "Brett@dreki-solutions.com",
    telephone: "+1-517-246-5868",
    founder: {
      "@type": "Person",
      name: "Brett Moser",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Custom AI Agent Systems",
    serviceType: "Agents as a Subscription",
    description:
      "Subscription-based AI agent systems for customer response, reputation, content operations, and recurring workflows.",
    provider: {
      "@type": "Organization",
      name: "Dreki Solutions LLC",
      url: "https://dreki-solutions.com/",
    },
    audience: {
      "@type": "BusinessAudience",
      audienceType: "Small-to-midsize service businesses",
    },
  },
];

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <DrekiExperience />

      <header className="site-header" aria-label="Primary">
        <a className="brand-link" href="#top" aria-label="Dreki Solutions home">
          <Image
            src="/brand/dreki-logo-horizontal-768.webp"
            alt="Dreki Solutions"
            width="768"
            height="231"
            unoptimized
          />
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#outcomes">Outcomes</a>
          <a href="#system">The system</a>
          <a href="#method">Method</a>
          <a href="#about">About</a>
        </nav>
        <a className="header-cta" href={auditMailto}>
          Request an audit
        </a>
      </header>

      <main id="main-content">
        <section className="hero section-shell" id="top" aria-labelledby="hero-title">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-copy">
            <p className="eyebrow">
              <span /> Agents as a Subscription for service businesses
            </p>
            <h1 id="hero-title">
              Give the repetitive work <em>to an agent.</em>
            </h1>
            <p className="hero-lede">
              Dreki builds custom AI agent systems for the customer and operational
              workflows that slow service businesses down—so teams can respond
              faster, stay consistent, and focus on work that needs human judgment.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href={auditMailto}>
                Request an Optimization Audit
              </a>
              <a className="button button-ghost" href="#system">
                Explore the system <span aria-hidden="true">↓</span>
              </a>
            </div>
            <ul className="hero-trust" aria-label="Dreki principles">
              <li>Custom-fit systems</li>
              <li>Human checkpoints</li>
              <li>Subscription support</li>
            </ul>
          </div>

          <div className="hero-orbit" aria-label="A custom agent coordinates connected workflows">
            <div className="orbit-ring orbit-ring-one" />
            <div className="orbit-ring orbit-ring-two" />
            <div className="orbit-node orbit-node-one">Respond</div>
            <div className="orbit-node orbit-node-two">Route</div>
            <div className="orbit-node orbit-node-three">Prepare</div>
            <div className="orbit-node orbit-node-four">Escalate</div>
            <div className="orbit-core">
              <span className="core-pulse" />
              <Image
                src="/brand/dreki-icon-512.webp"
                alt=""
                width="512"
                height="512"
                unoptimized
              />
              <strong>Agent online</strong>
              <small>Bounded by your rules</small>
            </div>
          </div>
        </section>

        <section className="outcomes section-shell section-angle" id="outcomes" aria-labelledby="outcomes-title">
          <div className="section-heading">
            <p className="eyebrow">The operational drag</p>
            <h2 id="outcomes-title">Where work stalls.</h2>
            <p>
              Most service teams do not need another dashboard. They need routine
              work to keep moving when everyone is already doing the work customers
              depend on.
            </p>
          </div>
          <div className="bottleneck-grid">
            {bottlenecks.map((item, index) => (
              <article className="bottleneck-card" key={item.label}>
                <div className="card-index">0{index + 1}</div>
                <p className="card-label">{item.label}</p>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
                <span className="card-trace" aria-hidden="true" />
              </article>
            ))}
          </div>
        </section>

        <section className="systems section-shell" id="system" aria-labelledby="system-title">
          <div className="section-heading section-heading-wide">
            <p className="eyebrow">A focused operating layer</p>
            <h2 id="system-title">What an agent can own.</h2>
            <p>
              Each system is designed around one real bottleneck. It works inside
              defined boundaries, uses approved information, and knows when to hand
              the decision back to a person.
            </p>
          </div>

          <div className="system-lattice">
            <div className="lattice-center" aria-hidden="true">
              <span>Observe</span>
              <strong>Act</strong>
              <span>Escalate</span>
            </div>
            {systems.map((item) => (
              <details className="system-card" key={item.index}>
                <summary>
                  <span className="system-card-top">
                    <span>{item.index}</span>
                    <small>{item.detail}</small>
                  </span>
                  <span className="system-card-title">{item.title}</span>
                  <span className="system-card-toggle">
                    Inspect node <i aria-hidden="true">+</i>
                  </span>
                </summary>
                <div className="system-card-body">
                  <p>{item.copy}</p>
                  <div className="system-signal" aria-hidden="true">
                    <i /> <i /> <i />
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="method section-shell section-angle" id="method" aria-labelledby="method-title">
          <div className="section-heading">
            <p className="eyebrow">The Dreki loop</p>
            <h2 id="method-title">Built to improve, not just launch.</h2>
            <p>
              The agent starts with a narrow responsibility and earns a larger role
              through observation, review, and deliberate refinement.
            </p>
          </div>
          <ol className="loop-grid">
            {loop.map((item, index) => (
              <li key={item.step}>
                <div className="loop-number">0{index + 1}</div>
                <h3>{item.step}</h3>
                <p>{item.copy}</p>
              </li>
            ))}
          </ol>

          <div className="human-command">
            <div className="command-copy">
              <p className="eyebrow">Humans stay in command</p>
              <h2>Automation handles repetition. Your team keeps authority.</h2>
              <p>
                Relationships, exceptions, strategy, and final approvals remain
                human work. Dreki designs the boundary as carefully as the agent.
              </p>
            </div>
            <div className="command-console" aria-label="Human approval model">
              <div>
                <span>Agent</span>
                <strong>Prepare and route</strong>
              </div>
              <div className="console-bridge" aria-hidden="true">
                <i /> <i /> <i />
              </div>
              <div>
                <span>Team</span>
                <strong>Review and decide</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="about section-shell" id="about" aria-labelledby="about-title">
          <div className="about-mark" aria-hidden="true">
            <Image
              src="/brand/dreki-icon-512.webp"
              alt=""
              width="512"
              height="512"
              unoptimized
            />
            <span>Service before software</span>
          </div>
          <div className="about-copy">
            <p className="eyebrow">Built in service</p>
            <h2 id="about-title">Discipline for the work behind the work.</h2>
            <p className="about-lede">
              Dreki Solutions was founded by U.S. Army veteran Brett Moser to remove
              the repetitive operational work that keeps capable teams from focusing
              on customers, craft, and growth.
            </p>
            <div className="principle-grid">
              <article>
                <span>01</span>
                <h3>AI-first execution</h3>
                <p>Use an agent where it creates practical operating leverage.</p>
              </article>
              <article>
                <span>02</span>
                <h3>Results over reports</h3>
                <p>Measure whether the workflow moves with less friction.</p>
              </article>
              <article>
                <span>03</span>
                <h3>Service and mission</h3>
                <p>Build systems that respect the people doing the real work.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="contact section-shell" id="contact" aria-labelledby="contact-title">
          <div className="contact-glow" aria-hidden="true" />
          <p className="eyebrow">Start with the bottleneck</p>
          <h2 id="contact-title">Find the work your team should stop repeating.</h2>
          <p>
            Tell Brett where work slows down. The optimization audit maps the
            workflow, the handoffs, and the right place for an agent to begin.
          </p>
          <div className="contact-actions">
            <a className="button button-primary" href={auditMailto}>
              Request an Optimization Audit
            </a>
            <a className="button button-ghost" href="tel:+15172465868">
              Call (517) 246-5868
            </a>
          </div>
          <div className="contact-details">
            <a href="mailto:Brett@dreki-solutions.com">Brett@dreki-solutions.com</a>
            <span aria-hidden="true">/</span>
            <a href="tel:+15172465868">(517) 246-5868</a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <Image
          src="/brand/dreki-logo-horizontal-768.webp"
          alt="Dreki Solutions"
          width="768"
          height="231"
          unoptimized
        />
        <p>Custom agent systems for service businesses.</p>
        <a href="#top">Back to top ↑</a>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </>
  );
}
