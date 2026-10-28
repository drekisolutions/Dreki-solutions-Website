"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { SMS_PURPOSE, SMS_DISCLOSURES, SMS_HELP, SMS_STOP, SMS_OPTIONAL, US_STATES } from "@/lib/audit/content";
import styles from "./audit.module.css";

export default function AuditForm() {
  const started = useRef<number | null>(null);
  const submission = useRef<{ fingerprint: string; id: string } | null>(null);
  const locked = useRef(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true;
    const values = new FormData(event.currentTarget);
    const fields = Object.fromEntries(values.entries());
    const fingerprint = JSON.stringify(fields);
    if (submission.current?.fingerprint !== fingerprint) {
      submission.current = { fingerprint, id: crypto.randomUUID() };
    }
    setStatus("sending");
    try {
      const response = await fetch("/api/audit-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          smsConsent: values.get("smsConsent") === "on",
          termsAccepted: values.get("termsAccepted") === "on",
          submissionId: submission.current.id,
          elapsedMs: started.current ? Date.now() - started.current : 0,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        throw new Error(response.status === 429
          ? "Too many attempts. Please wait 10 minutes or email brett@dreki-solutions.ai."
          : response.status === 400
            ? "Please check every required field, wait a moment, and try again."
            : "We couldn’t send your request. Your details are still here. Please try again or email brett@dreki-solutions.ai.");
      }
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error && error.name === "Error"
        ? error.message
        : "Delivery could not be confirmed. Please try again or email brett@dreki-solutions.ai.");
    } finally {
      locked.current = false;
      requestAnimationFrame(() => statusRef.current?.focus());
    }
  }

  return (
    <section id="audit-request" className={styles.card} aria-labelledby="audit-form-title">
      {status === "success" ? (
        <div ref={statusRef} tabIndex={-1} role="status" className={styles.success}>
          <span className="eyebrow">Request received</span>
          <h2 id="audit-form-title">You’re on the list.</h2>
          <p>Thank you for requesting your free digital presence audit. Dreki will follow up by email.</p>
          <Link className="button button-secondary" href="/">Back to the website</Link>
        </div>
      ) : (
        <>
          <div className={styles.cardHeading}>
            <h2 id="audit-form-title">Request your free audit.</h2>
            <p>All fields are required. Text-message consent is optional.</p>
          </div>
          <form onSubmit={submit} onFocus={() => { started.current ??= Date.now(); }} className={styles.form}>
            <fieldset disabled={status === "sending"} className={styles.fields}>
              <legend className={styles.srOnly}>Business owner and company details</legend>
              <div className={styles.grid}>
                <label>Owner’s first name<input name="firstName" autoComplete="given-name" maxLength={80} required /></label>
                <label>Owner’s last name<input name="lastName" autoComplete="family-name" maxLength={80} required /></label>
                <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
                <label>Phone number<input name="phone" type="tel" autoComplete="tel" maxLength={40} pattern={"\\+?[0-9\\s.\\(\\)\\-]{10,40}"} title="Enter a phone number with 10 to 15 digits, including an area code." required /></label>
                <label className={styles.full}>Company name<input name="company" autoComplete="organization" maxLength={160} required /></label>
                <label>City<input name="city" autoComplete="address-level2" maxLength={100} required /></label>
                <label>State<select name="state" autoComplete="address-level1" defaultValue="" required>
                  <option value="" disabled>Select your state</option>
                  {US_STATES.map((state) => <option key={state}>{state}</option>)}
                </select></label>
              </div>
              <div className={styles.honeypot} aria-hidden="true">
                <label>Leave this empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
              </div>
              <label className={styles.consent}>
                <input type="checkbox" name="smsConsent" />
                <span>{SMS_PURPOSE} {SMS_DISCLOSURES} <strong>{SMS_HELP}</strong> <strong>{SMS_STOP}</strong> {SMS_OPTIONAL}</span>
              </label>
              <div className={styles.legalAgreement}>
                <input id="audit-terms" type="checkbox" name="termsAccepted" required aria-labelledby="audit-terms-label" />
                <label htmlFor="audit-terms" id="audit-terms-label">I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>. <span className={styles.required}>(Required)</span></label>
              </div>
              <button className="button button-primary" type="submit">{status === "sending" ? "Sending your request…" : "Request My Free Audit"}<span aria-hidden="true">↗</span></button>
            </fieldset>
            {status === "error" && <div ref={statusRef} tabIndex={-1} role="alert" className={styles.error}>{message} <a href="mailto:brett@dreki-solutions.ai?subject=Free%20digital%20presence%20audit%20request">Email Dreki</a></div>}
            <noscript><p>Please enable JavaScript to submit this form, or <a href="mailto:brett@dreki-solutions.ai?subject=Free%20digital%20presence%20audit%20request">request your audit by email</a>.</p></noscript>
          </form>
        </>
      )}
    </section>
  );
}
