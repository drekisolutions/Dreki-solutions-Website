import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/app/site-config";

export const metadata: Metadata = {
  title: "Asgard OS: Google data",
  description: "How Asgard OS accesses, processes and retains Google account data, and the controls available to the authorized owner.",
  alternates: { canonical: absoluteUrl("/asgard/privacy") },
  openGraph: {
    type: "website",
    title: "Asgard OS: Google data",
    description: "How Asgard OS accesses, processes and retains Google account data, and the controls available to the authorized owner.",
    url: absoluteUrl("/asgard/privacy"),
    siteName: "Dreki Solutions",
  },
};

export default function AsgardPrivacyPage() {
  return (
    <main className="page-main legal-page" id="main-content">
      <section className="page-section legal-section" aria-labelledby="asgard-privacy-title">
        <article className="legal-document">
          <p className="eyebrow">Dreki Solutions LLC</p>
          <h1 id="asgard-privacy-title">Asgard OS: Google data</h1>
          <p>Dreki Solutions LLC operates Asgard OS for its authorized agency owner. Contact <a href="mailto:brett@dreki-solutions.ai">brett@dreki-solutions.ai</a> with questions or data requests. Visits to these public pages follow the <Link href="/privacy">Dreki website Privacy Policy</Link>, including its website-analytics disclosures. The notice below covers Google account data used by Asgard; it adds specific Gmail and Calendar detail.</p>
          <section aria-labelledby="asgard-privacy-what-we-access">
            <h2 id="asgard-privacy-what-we-access">What we access</h2>
            <p>Google account identity identifies the connected account. Local Gmail review uses read-only access. An approved Inbox preview can read up to 20 message headers from the first page. Selected-message review supports at most ten chosen messages, with selected headers and supported plain text. HTML content and attachments are omitted. This is not a complete mailbox archive. Separate business-mail features have their own scopes and exact-message approval; Calendar consent does not enable sending.</p>
          </section>
          <p>Calendar review reads one selected owner calendar, its time zone and a fixed next-24-hour window. It uses event IDs, start/end times, status, transparency, event type and self-participation/response flags to identify possible timing conflicts. It does not request summaries, descriptions, locations, attachments, meeting URLs or organizer/attendee email addresses. Missing or incomplete evidence does not establish availability.</p>
          <section aria-labelledby="asgard-privacy-processing-and-sharing">
            <h2 id="asgard-privacy-processing-and-sharing">Processing and sharing</h2>
            <p>Gmail snapshots and private draft results are retained in encrypted records on the operator’s PC; local credentials use protected local storage. Calendar requests and their OAuth credential use the agency’s n8n Cloud account, so that flow is not exclusively local. The Calendar conflict rules themselves call no AI model.</p>
          </section>
          <p>When the owner chooses private AI drafting, the exact selected source preview is sent to the configured Codex draft worker and its model service after separate approval. That service processes the selected data under its applicable terms and settings. This notice makes no blanket promise about a model provider’s retention or training practices.</p>
          <p>The daily task/deal/billing digest also reviews the selected owner Calendar. It uses the existing fixed ClickUp Inbox review for exception metadata. Calendar coverage includes source status and counts of timed busy events, all-day context entries and conflict pairs. Conflict examples contain event IDs, start/end times and a generic Google Calendar link. Ordinary meetings and all-day entries alone do not trigger a review; missing or incomplete Calendar evidence can trigger an internal review. This flow does not send client messages or change Calendar events.</p>
          <section aria-labelledby="asgard-privacy-retention">
            <h2 id="asgard-privacy-retention">Retention</h2>
            <p>Saved snapshots, private results, audit references and backups remain under the owner’s control until reviewed and manually removed through an appropriate deletion process. There is no automatic purge schedule or verified one-click erasure of all copies. Workflow execution-payload saving is configured off for the Calendar workflow; this is not a claim that n8n keeps no credentials, operational logs or backups. ClickUp reviews and copies remain subject to their own workspace controls.</p>
          </section>
          <section aria-labelledby="asgard-privacy-your-controls-and-requests">
            <h2 id="asgard-privacy-your-controls-and-requests">Your controls and requests</h2>
            <p>Stop the relevant workflow or revoke its connection to prevent further use through that path. You can also remove the app’s grant in your Google Account. Local disconnection does not itself revoke Google’s grant. Revoking Google access does not erase copies already retained locally or in cloud workspaces. Contact <a href="mailto:brett@dreki-solutions.ai">brett@dreki-solutions.ai</a> for review, correction or deletion requests. A deletion review must consider snapshots, outputs, backups and any n8n or ClickUp copies; removing one task or connection is not complete erasure.</p>
          </section>
          <p><Link href="/asgard">Asgard homepage</Link> · <Link href="/asgard/terms">Access and setup</Link></p>
        </article>
      </section>
    </main>
  );
}
