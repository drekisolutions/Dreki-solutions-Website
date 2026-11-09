import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/app/site-config";

export const metadata: Metadata = {
  title: "Asgard OS: access and setup",
  description: "Account access, permissions and workflow activation for the authorized Asgard OS agency operator.",
  alternates: { canonical: absoluteUrl("/asgard/terms") },
  openGraph: {
    type: "website",
    title: "Asgard OS: access and setup",
    description: "Account access, permissions and workflow activation for the authorized Asgard OS agency operator.",
    url: absoluteUrl("/asgard/terms"),
    siteName: "Dreki Solutions",
  },
};

export default function AsgardTermsPage() {
  return (
    <main className="page-main legal-page" id="main-content">
      <section className="page-section legal-section" aria-labelledby="asgard-terms-title">
        <article className="legal-document">
          <p className="eyebrow">Dreki Solutions LLC</p>
          <h1 id="asgard-terms-title">Asgard OS: access and setup</h1>
          <p>Asgard OS is an internal workspace for the authorized agency operator. Connect only accounts and workspaces you are authorized to use, and review the permissions shown for each feature.</p>
          <p>Account connection, source acceptance and unattended workflow activation are separate steps. Gmail sending, calendar changes, paid generation, client messages and publication require their own explicit permissions and approvals. An internal draft, zero-conflict result or completed review is not a promise to a client or a guarantee of availability.</p>
          <p>Google access can expire or be revoked. Approved daily read-only Calendar reviews check the selected owner calendar for possible timing conflicts and include exception metadata in the agency’s existing fixed ClickUp Inbox review. Missing or incomplete evidence does not establish availability. Stop the workflow or revoke the connection to prevent further checks through that path. Questions: <a href="mailto:brett@dreki-solutions.ai">brett@dreki-solutions.ai</a>.</p>
          <p><Link href="/asgard/privacy">Google-data privacy</Link> · <Link href="/asgard">Asgard homepage</Link></p>
        </article>
      </section>
    </main>
  );
}
