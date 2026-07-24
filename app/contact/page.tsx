import type { Metadata } from "next";
import { isLeadCaptureConfigured } from "@/lib/leads/configuration";
import { LeadForm } from "../components/lead-form";
import { metadataFromRegistry } from "../content-registry";
import { contact } from "../site-data";

export const metadata: Metadata = metadataFromRegistry("/contact");

export default function ContactPage() {
  const leadCaptureConfigured = isLeadCaptureConfigured();

  return (
    <main className="page-main launch-page" id="main-content">
      <section className="contact-hero" aria-labelledby="contact-title">
        <div>
          <p className="eyebrow">Start with the bottleneck</p>
          <h1 id="contact-title">Bring one workflow worth improving.</h1>
          <p>
            Share where response, intake, scheduling, or a recurring handoff
            slows down. Dreki will use the first conversation to identify the
            operating boundary, the decisions that must stay human, and the
            smallest useful place to begin.
          </p>
        </div>
        <address className="contact-card">
          <span>Direct contact</span>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
          <p>
            Online delivery will activate when the approved HubSpot and
            verification settings are present. Direct email remains available.
          </p>
        </address>
      </section>

      <section
        className="form-section"
        id="consultation"
        aria-label={
          leadCaptureConfigured
            ? "Strategy call request form"
            : "Direct strategy call request"
        }
      >
        {leadCaptureConfigured ? (
          <LeadForm
            source="contact"
            successHref="/book"
            successLabel="Choose a strategy-call time"
          />
        ) : (
          <section className="form-unavailable" aria-labelledby="direct-request-title">
            <p className="eyebrow">Direct request // available</p>
            <h2 id="direct-request-title">Start with a private workflow note.</h2>
            <p>
              The secure online intake is not active yet. Email the workflow,
              the point where it slows down, and the decision your team must
              retain. Dreki will arrange the strategy call directly.
            </p>
            <div className="button-row">
              <a
                className="button button-primary"
                href={`mailto:${contact.email}?subject=Strategy%20call%20request`}
              >
                Email the Workflow
              </a>
              <a className="button button-secondary" href={contact.phoneHref}>
                Call {contact.phoneDisplay}
              </a>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
