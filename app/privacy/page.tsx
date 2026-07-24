import type { Metadata } from "next";
import { metadataFromRegistry } from "../content-registry";

export const metadata: Metadata = metadataFromRegistry("/privacy");

export default function PrivacyPage() {
  return (
    <main className="page-main legal-page" id="main-content">
      <section className="page-section legal-section" aria-labelledby="privacy-title">
        <article className="legal-document">
          <p className="eyebrow">Dreki Solutions LLC</p>
          <h1 id="privacy-title">Privacy Policy</h1>
          <p className="legal-effective">Effective: July 23, 2026</p>

          <p>
            Dreki Solutions LLC (&quot;we,&quot; &quot;us&quot;) operates dreki-solutions.ai and related
            internal software tools. This policy describes the information we
            handle, why we handle it, and the choices available to you.
          </p>

          <section aria-labelledby="privacy-website-title">
            <h2 id="privacy-website-title">Website inquiries</h2>
            <p>
              When the online inquiry form is active, we collect the information
              you choose to submit, including your name, work email, company,
              industry, area of interest, workflow description, timeline,
              optional phone number, and consent choices. We may also process the
              source page, limited campaign parameters in the page address, and
              your IP address as submission context and for abuse prevention.
            </p>
            <p>
              We use inquiry information to respond, evaluate whether Dreki may
              be a fit, arrange a strategy call, maintain business records, and
              protect the form. We use contact information for marketing only
              when you separately choose that option. We do not sell personal
              information.
            </p>
          </section>

          <section aria-labelledby="privacy-processors-title">
            <h2 id="privacy-processors-title">Form service providers</h2>
            <p>
              Dreki uses HubSpot to receive and manage online inquiries. HubSpot
              processes submitted information on Dreki&apos;s behalf. Review the{" "}
              <a
                href="https://legal.hubspot.com/privacy-policy"
                rel="noreferrer"
                target="_blank"
              >
                HubSpot Privacy Policy
              </a>
              .
            </p>
            <p>
              Dreki uses Cloudflare Turnstile to distinguish ordinary visitors
              from automated abuse. Turnstile processes technical signals for
              that security purpose. Review the{" "}
              <a
                href="https://www.cloudflare.com/turnstile-privacy-policy/"
                rel="noreferrer"
                target="_blank"
              >
                Cloudflare Turnstile Privacy Addendum
              </a>
              .
            </p>
          </section>

          <section aria-labelledby="privacy-analytics-title">
            <h2 id="privacy-analytics-title">Website analytics</h2>
            <p>
              When configured, Dreki uses Cloudflare Web Analytics for aggregate
              page-traffic and performance measurement. The service is designed
              without cookies or cross-site visitor tracking and does not
              receive information entered in the inquiry form. Review the{" "}
              <a
                href="https://www.cloudflare.com/policies/privacy/"
                rel="noreferrer"
                target="_blank"
              >
                Cloudflare Privacy Policy
              </a>
              .
            </p>
          </section>

          <section aria-labelledby="privacy-retention-title">
            <h2 id="privacy-retention-title">Retention and requests</h2>
            <p>
              We keep inquiry and business records only as long as reasonably
              needed to respond, manage a potential or active business
              relationship, meet legal obligations, and resolve disputes. You
              may ask to access, correct, or delete information you submitted by
              using the contact address below. Some records may be retained when
              required for legal, security, or legitimate business-record
              purposes.
            </p>
          </section>

          <section aria-labelledby="privacy-youtube-title">
            <h2 id="privacy-youtube-title">YouTube API Services</h2>
            <p>
              Our internal publishing tools use YouTube API Services to upload and manage
              content exclusively on our own YouTube channel. By using YouTube functionality
              through our tools, users agree to the{" "}
              <a href="https://www.youtube.com/t/terms" rel="noreferrer" target="_blank">
                YouTube Terms of Service
              </a>
              . The{" "}
              <a href="https://policies.google.com/privacy" rel="noreferrer" target="_blank">
                Google Privacy Policy
              </a>{" "}
              applies to Google&apos;s handling of that data.
            </p>
            <p>
              Our API client is an internal, single-user tool operated by the channel owner. It
              does not access, collect, or store personal data belonging to any third-party
              YouTube user. The only Google data it stores is the owner&apos;s own authorization
              credential, kept in secured credential storage and used solely to publish to our
              own channel. It does not use cookies and serves no advertising.
            </p>
            <p>
              Access granted to our API client can be revoked at any time via the{" "}
              <a
                href="https://security.google.com/settings/security/permissions"
                rel="noreferrer"
                target="_blank"
              >
                Google security settings page
              </a>
              .
            </p>
          </section>

          <section aria-labelledby="privacy-contact-title">
            <h2 id="privacy-contact-title">Contact</h2>
            <p>
              <a href="mailto:brett@dreki-solutions.ai">brett@dreki-solutions.ai</a>
            </p>
          </section>
        </article>
      </section>
    </main>
  );
}
