import type { Metadata } from "next";
import ConsultationForm from "../components/ConsultationForm";
import { contact, consultationMailto } from "../site-data";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Schedule a consultation with Dreki Solutions about service-industry or aviation agentic software.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="page-main" id="main-content">
      <section className="contact-hero" aria-labelledby="contact-title">
        <div>
          <p className="eyebrow">Start with the bottleneck</p>
          <h1 id="contact-title">Schedule a consultation.</h1>
          <p>
            Tell Brett where work slows down. The first conversation identifies the
            workflow, the handoffs, the decisions that must stay human, and the smallest
            useful place for an agent to begin.
          </p>
        </div>
        <address className="contact-card">
          <span>Direct contact</span>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          <a href={contact.phoneHref}>{contact.phoneDisplay}</a>
          <a className="text-link" href={consultationMailto}>Open a prefilled email</a>
        </address>
      </section>

      <section className="form-section" aria-label="Consultation request form">
        <ConsultationForm />
      </section>
    </main>
  );
}
