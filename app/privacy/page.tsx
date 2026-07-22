import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Dreki Solutions LLC and its related internal software tools.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="page-main legal-page" id="main-content">
      <section className="page-section legal-section" aria-labelledby="privacy-title">
        <article className="legal-document">
          <p className="eyebrow">Dreki Solutions LLC</p>
          <h1 id="privacy-title">Privacy Policy</h1>
          <p className="legal-effective">Effective: July 22, 2026</p>

          <p>
            Dreki Solutions LLC (&quot;we,&quot; &quot;us&quot;) operates dreki-solutions.ai and related
            internal software tools. This policy describes what information we handle and how.
          </p>

          <section aria-labelledby="privacy-website-title">
            <h2 id="privacy-website-title">Website</h2>
            <p>
              We collect only the information you voluntarily submit (such as contact details
              in a form or email) and use it solely to respond and conduct business. We do not
              sell personal information.
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
              <a href="http://www.google.com/policies/privacy" rel="noreferrer" target="_blank">
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
