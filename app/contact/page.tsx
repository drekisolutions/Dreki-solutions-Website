import type { Metadata } from "next";
import { isLeadCaptureConfigured } from "@/lib/leads/configuration";
import { LeadForm } from "../components/lead-form";
import { metadataFromRegistry } from "../content-registry";
import { contact } from "../site-data";

export const metadata: Metadata = metadataFromRegistry("/contact");

export default function ContactPage() {
  const leadCaptureConfigured = isLeadCaptureConfigured();

  return (
    <main className="page-main launch-page" id="main">
      <section className="contact-hero" aria-labelledby="contact-title">
        <div>
          <p className="eyebrow">Get in touch</p>
          <h1 id="contact-title">Tell us about your business.</h1>
          <p>
            Share where you are today and what you want help with: social
            media, your brand, or a look at how you show up online. The free
            audit is the best place to start.
          </p>
          <a className="button button-primary" href="/free-audit">
            Request a Free Digital Presence Audit
          </a>
        </div>
        <address className="contact-card">
          <span>Direct contact</span>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
        </address>
      </section>

      <section
        className="form-section"
        id="consultation"
        aria-label={
          leadCaptureConfigured
            ? "Call request form"
            : "Direct call request"
        }
      >
        {leadCaptureConfigured ? (
          <LeadForm
            source="contact"
            successHref="/book"
            successLabel="Choose a call time"
          />
        ) : (
          <section className="form-unavailable" aria-labelledby="direct-request-title">
            <p className="eyebrow">Direct request</p>
            <h2 id="direct-request-title">Send us a note.</h2>
            <p>
              Email what your business does and what you want help with.
              Dreki will arrange the call directly.
            </p>
            <div className="button-row">
              <a
                className="button button-primary"
                href={`mailto:${contact.email}?subject=Call%20request`}
              >
                Email Dreki
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
