import type { Metadata } from "next";
import { metadataFromRegistry } from "../content-registry";
import AuditForm from "./AuditForm";
import styles from "./audit.module.css";

export const metadata: Metadata = metadataFromRegistry("/free-audit");

export default function FreeAuditPage() {
  return (
    <main className={`page-main ${styles.page}`} id="main">
      <div className={styles.layout}>
        <section className={styles.intro} aria-labelledby="audit-title">
          <p className="eyebrow">Step 1. The way in.</p>
          <h1 id="audit-title">The free audit is step 1.</h1>
          <p className={styles.lede}>We review your Google Business Profile, website, and social accounts. You get a clear list of what to fix first.</p>
          <ol className={styles.scope} aria-label="What the audit reviews">
            <li><span>01</span><div><h2>Google Business Profile.</h2><p>How you show up when someone searches for a business like yours.</p></div></li>
            <li><span>02</span><div><h2>Website.</h2><p>Whether the site is current and easy to contact you from.</p></div></li>
            <li><span>03</span><div><h2>Social accounts.</h2><p>Whether the accounts are active and sound like the owner.</p></div></li>
          </ol>
          <p className={styles.note}>The audit is free. No purchase required.<br />Brett follows up by email.</p>
          <div className={styles.answer}>
            <h2>What does the free audit include?</h2>
            <p>The free audit is step 1 and the way in. It reviews your Google Business Profile, your website, and your social accounts. You get a written list of what to fix first.</p>
            <p>It is free to request. No purchase is required. Brand work, profile and site fixes, and monthly social content are separate decisions. Brett follows up by email to confirm your details and discuss the audit.</p>
          </div>
        </section>
        <AuditForm />
      </div>
    </main>
  );
}
