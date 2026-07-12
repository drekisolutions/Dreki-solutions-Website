import type { Metadata } from "next";
import PageTurnLink from "../components/PageTurnLink";
import { aviationServices, serviceIndustryServices } from "../site-data";

export const metadata: Metadata = {
  title: "Agentic Software Services",
  description:
    "Custom agentic software services for service-industry and aviation operations.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <main className="page-main" id="main-content">
      <section
        className="page-section service-industry-section"
        aria-labelledby="services-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">Service-industry agentic software</p>
            <h1 id="services-title">Move the customer and operational work forward.</h1>
          </div>
          <div className="section-heading__support">
            <p>
              Custom agents handle defined, repeatable work across customer response,
              reputation, content, intake, scheduling, handoffs, and administration.
            </p>
            <PageTurnLink className="button button-primary" href="/contact#consultation">
              Schedule a Consultation
            </PageTurnLink>
          </div>
        </div>
        <div className="service-detail-grid" aria-label="Service-industry services">
          {serviceIndustryServices.map((service) => (
            <article key={service.index}>
              <span>{service.index}</span>
              <h3>{service.title}</h3>
              <p>{service.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-section aviation-section" aria-labelledby="aviation-services-title">
        <div className="section-heading section-heading--aviation">
          <div>
            <p className="eyebrow">Aviation agentic software services</p>
            <h2 id="aviation-services-title">Specialized systems for charter operations.</h2>
          </div>
          <p>
            Dreki applies the same bounded-agent discipline to aviation workflows:
            trusted sources, accountable owners, explicit handoffs, and human control
            of operational and regulatory decisions.
          </p>
        </div>
        <div className="service-detail-grid">
          {aviationServices.map((service) => (
            <article key={service.index}>
              <span>{service.index}</span>
              <h3>{service.title}</h3>
              <p>{service.copy}</p>
            </article>
          ))}
        </div>
        <aside className="aviation-note">
          <strong>Human authority remains explicit.</strong>
          <p>
            Agentic systems support preparation and coordination. They do not replace
            required professional judgment, operating responsibility, or regulatory accountability.
          </p>
        </aside>
      </section>
    </main>
  );
}
