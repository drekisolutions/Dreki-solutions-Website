import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/app/site-config";

export const metadata: Metadata = {
  title: "Asgard OS",
  description: "An agency review workspace from Dreki Solutions LLC.",
  alternates: { canonical: absoluteUrl("/asgard") },
  openGraph: {
    type: "website",
    title: "Asgard OS",
    description: "An agency review workspace from Dreki Solutions LLC.",
    url: absoluteUrl("/asgard"),
    siteName: "Dreki Solutions",
  },
};

export default function AsgardPage() {
  return (
    <main className="page-main legal-page" id="main-content">
      <section className="page-section legal-section" aria-labelledby="asgard-home-title">
        <article className="legal-document">
          <p className="eyebrow">Dreki Solutions LLC</p>
          <h1 id="asgard-home-title">Asgard OS</h1>
          <p><strong>An agency review workspace from Dreki Solutions LLC.</strong></p>
          <p>Asgard helps the agency owner review selected work, prepare internal drafts and identify items that need attention. The owner decides what to send, publish, buy or change. This deployment is an internal owner workspace, with no public account registration.</p>
          <section aria-labelledby="asgard-home-gmail-review">
            <h2 id="asgard-home-gmail-review">Gmail review</h2>
            <p>The local Windows app can review recent Inbox headers and the plain text of messages the owner selects. Optional AI drafting uses a separate preview and approval before selected context is sent to the configured Codex draft service.</p>
          </section>
          <section aria-labelledby="asgard-home-calendar-review">
            <h2 id="asgard-home-calendar-review">Calendar review</h2>
            <p>A separate read-only connection uses n8n Cloud to check selected Calendar timing and participation metadata for possible conflicts. It does not request event titles, descriptions, meeting links or attendee email addresses, and it does not modify events.</p>
          </section>
          <section aria-labelledby="asgard-home-internal-reviews">
            <h2 id="asgard-home-internal-reviews">Internal reviews</h2>
            <p>Approved workflows can prepare reviews in the agency’s ClickUp Inbox. Google access, workflow activation, AI drafting and client communication have separate controls. Connecting an account does not authorize every action.</p>
          </section>
          <p><Link href="/asgard/privacy">Google-data privacy</Link> · <Link href="/asgard/terms">Access and setup</Link> · <a href="mailto:brett@dreki-solutions.ai">Contact Dreki</a></p>
        </article>
      </section>
    </main>
  );
}
