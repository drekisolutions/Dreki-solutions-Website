import type { Metadata } from "next";
import { metadataFromRegistry } from "../content-registry";
import AuditForm from "./AuditForm";
import styles from "./audit.module.css";

export const metadata: Metadata = metadataFromRegistry("/free-audit");

export default function FreeAuditPage() {
  return (
    <main className={`page-main ${styles.page}`} id="main-content">
      <div className={styles.layout}>
        <section className={styles.intro} aria-labelledby="audit-title">
          <p className="eyebrow">Free digital presence business audit</p>
          <h1 id="audit-title">See your business <em>the way customers do.</em></h1>
          <p className={styles.lede}>Find the gaps between being online and being easy to find, trust, and contact.</p>
          <ol className={styles.scope} aria-label="Audit focus areas">
            <li><span>01</span><div><h2>Get found.</h2><p>Your business visibility and local online presence.</p></div></li>
            <li><span>02</span><div><h2>Build trust.</h2><p>The first impression your website and business information make.</p></div></li>
            <li><span>03</span><div><h2>Make contact easy.</h2><p>The path from an interested visitor to a business inquiry.</p></div></li>
          </ol>
          <p className={styles.note}>Free to request. No purchase required.<br />We’ll follow up by email about your audit.</p>
        </section>
        <AuditForm />
      </div>
    </main>
  );
}
