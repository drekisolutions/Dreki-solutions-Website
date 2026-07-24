import type { ReactNode } from "react";
import PageTurnLink from "../PageTurnLink";

type LaunchHeroProps = {
  eyebrow: string;
  title: string;
  lede: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  children?: ReactNode;
};

export function LaunchHero({
  eyebrow,
  title,
  lede,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  children,
}: LaunchHeroProps) {
  return (
    <section className="page-section service-industry-section launch-hero" aria-labelledby="launch-title">
      <div className="launch-hero__grid">
        <div className="launch-hero__copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1 id="launch-title">{title}</h1>
          <p className="launch-hero__lede">{lede}</p>
          <div className="hero-actions launch-actions">
            <PageTurnLink className="button button-primary" href={primaryHref}>
              {primaryLabel}
            </PageTurnLink>
            {secondaryHref && secondaryLabel ? (
              <PageTurnLink className="button button-secondary" href={secondaryHref}>
                {secondaryLabel}
              </PageTurnLink>
            ) : null}
          </div>
        </div>
        {children ? <div className="launch-hero__aside">{children}</div> : null}
      </div>
    </section>
  );
}

type LaunchSectionProps = {
  id: string;
  eyebrow: string;
  title: string;
  intro?: string;
  className?: string;
  children: ReactNode;
};

export function LaunchSection({
  id,
  eyebrow,
  title,
  intro,
  className,
  children,
}: LaunchSectionProps) {
  return (
    <section
      className={`page-section launch-section${className ? ` ${className}` : ""}`}
      aria-labelledby={id}
    >
      <div className="section-heading launch-section__heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 id={id}>{title}</h2>
        </div>
        {intro ? <p>{intro}</p> : null}
      </div>
      {children}
    </section>
  );
}

type LaunchWorkflowProps = {
  label: string;
  steps: readonly {
    index: string;
    title: string;
    copy: string;
  }[];
};

export function LaunchWorkflow({ label, steps }: LaunchWorkflowProps) {
  return (
    <ol className="process-grid launch-workflow" aria-label={label}>
      {steps.map((step) => (
        <li key={step.index}>
          <span>{step.index}</span>
          <h3>{step.title}</h3>
          <p>{step.copy}</p>
        </li>
      ))}
    </ol>
  );
}

type LaunchListCardProps = {
  label: string;
  title: string;
  items: readonly string[];
};

export function LaunchListCard({ label, title, items }: LaunchListCardProps) {
  return (
    <article className="feature-card launch-list-card">
      <span>{label}</span>
      <h3>{title}</h3>
      <ul className="launch-check-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

type LaunchFaqProps = {
  items: readonly {
    question: string;
    answer: string;
  }[];
};

export function LaunchFaq({ items }: LaunchFaqProps) {
  return (
    <div className="launch-faq">
      {items.map((item) => (
        <details key={item.question}>
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

type LaunchRelatedLinksProps = {
  title?: string;
  links: readonly {
    href: string;
    label: string;
    description: string;
  }[];
};

export function LaunchRelatedLinks({
  title = "Continue exploring",
  links,
}: LaunchRelatedLinksProps) {
  return (
    <nav className="launch-related" aria-label={title}>
      <p className="eyebrow">{title}</p>
      <div className="feature-grid feature-grid--three launch-related__grid">
        {links.map((link, index) => (
          <PageTurnLink className="feature-card launch-related__card" href={link.href} key={link.href}>
            <span>0{index + 1}</span>
            <strong>{link.label}</strong>
            <small>{link.description}</small>
          </PageTurnLink>
        ))}
      </div>
    </nav>
  );
}

type LaunchFinalCtaProps = {
  eyebrow?: string;
  title: string;
  copy: string;
  href?: string;
  label?: string;
};

export function LaunchFinalCta({
  eyebrow = "A scoped first step",
  title,
  copy,
  href = "/book",
  label = "Book a Strategy Call",
}: LaunchFinalCtaProps) {
  return (
    <section className="page-cta launch-final-cta" aria-labelledby="launch-final-cta-title">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id="launch-final-cta-title">{title}</h2>
      <p>{copy}</p>
      <PageTurnLink className="button button-primary" href={href}>
        {label}
      </PageTurnLink>
    </section>
  );
}

export function InternalDemonstrationDisclosure() {
  return (
    <aside className="boundary-note launch-proof-disclosure">
      <strong>Internal demonstration</strong>
      <p>
        This is a Dreki-designed operating scenario. It is not customer work, a
        testimonial, or evidence of a measured customer result.
      </p>
    </aside>
  );
}
