import type { Metadata } from "next";
import Link from "next/link";
import { metadataFromRegistry } from "../content-registry";

export const metadata: Metadata = metadataFromRegistry("/terms");

export default function TermsPage() {
  return (
    <main className="page-main legal-page" id="main-content">
      <section className="page-section legal-section" aria-labelledby="terms-title">
        <article className="legal-document">
          <p className="eyebrow">Dreki Solutions LLC</p>
          <h1 id="terms-title">Terms and Conditions</h1>
          <p className="legal-effective">Effective: October 10, 2026</p>
          <p>These terms cover use of the Dreki Solutions LLC website, requests for a free digital presence audit, and optional text messages. Our <Link href="/privacy">Privacy Policy</Link> explains how we handle your information.</p>

          <section aria-labelledby="terms-audit">
            <h2 id="terms-audit">Free audit requests</h2>
            <p>The digital presence audit is free to request and does not require a purchase. Submit accurate information for a business you own or are authorized to represent. We use your details to review and respond to your request. Submitting a request does not create a paid service agreement or a commitment to buy.</p>
            <p>Audit observations are general business information. They do not guarantee search rankings, traffic, leads, sales, or other results. Any paid work requires a separate agreed scope.</p>
          </section>

          <section aria-labelledby="terms-sms">
            <h2 id="terms-sms">Dreki Solutions Service Notifications</h2>
            <p>Dreki Solutions LLC (&quot;Dreki Solutions&quot;) offers optional service text notifications for clients and sign-ups. These include opt-in confirmations, appointment reminders, order and waitlist updates, and status updates on client projects in production. No marketing or promotional texts are sent through this program.</p>
            <p>If you select the separate text-message consent checkbox, you authorize Dreki Solutions LLC to send recurring service texts to the number you provide for these purposes. Message frequency varies based on your requests and services. Msg &amp; data rates may apply.</p>
            <p>Text-message consent is optional and is not a condition of purchase or of requesting a free audit. Providing a phone number or agreeing to these Terms and the Privacy Policy does not by itself authorize texts. You must separately choose to receive text messages.</p>
          </section>

          <section aria-labelledby="terms-stop">
            <h2 id="terms-stop">Help and opting out</h2>
            <p><strong>Reply HELP for help.</strong> You can also contact <a href="mailto:brett@dreki-solutions.ai">brett@dreki-solutions.ai</a> or call <a href="tel:+15172157573">(517) 215-7573</a>.</p>
            <p><strong>Reply STOP to opt out.</strong> You may receive a final message confirming your opt-out. No further program messages will be sent unless you opt in again. Opting out of texts does not cancel your audit request; you may continue communicating with us by email.</p>
            <p>Text delivery depends on your mobile carrier and network availability. Carriers are not liable for delayed or undelivered messages. You are responsible for any messaging or data charges imposed by your provider.</p>
          </section>

          <section aria-labelledby="terms-privacy">
            <h2 id="terms-privacy">Privacy and consent records</h2>
            <p>We retain your consent choices and the wording shown with your request. Mobile information and text-message opt-in data are not sold or shared with third parties or affiliates for marketing or promotional purposes. Service providers may process information to deliver services on our behalf. See the <Link href="/privacy">Privacy Policy</Link> for details and contact us to request access, correction, or deletion.</p>
          </section>

          <section aria-labelledby="terms-use">
            <h2 id="terms-use">Website use</h2>
            <p>Do not submit false information, impersonate others, abuse the form, or interfere with the website. Dreki&apos;s original website content, branding, and demonstration materials remain the property of Dreki Solutions LLC unless otherwise identified.</p>
            <p>We may update these terms and will identify the effective date on this page. Questions about these terms can be sent to <a href="mailto:brett@dreki-solutions.ai">brett@dreki-solutions.ai</a>.</p>
          </section>
        </article>
      </section>
    </main>
  );
}
