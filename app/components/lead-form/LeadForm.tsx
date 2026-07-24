"use client";

import Script from "next/script";
import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { contact } from "@/app/site-data";
import {
  AREA_OF_INTEREST_OPTIONS,
  INDUSTRY_OPTIONS,
  MARKETING_CONSENT,
  PROCESSING_ACKNOWLEDGMENT,
  TIMELINE_OPTIONS,
} from "@/lib/leads/content";
import { LEAD_LIMITS } from "@/lib/leads/validation";
import styles from "./LeadForm.module.css";

declare global {
  interface Window {
    turnstile?: {
      reset: (container?: string | HTMLElement) => void;
    };
  }
}

type FormStatus =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | { kind: "success" };

interface LeadFormProps {
  className?: string;
  source?: string;
  successHref?: string;
  successLabel?: string;
  fallbackEmail?: string;
  turnstileSiteKey?: string;
  turnstileAction?: string;
}

const DEFAULT_TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();

function safeUtmValue(name: string): string | undefined {
  const value = new URLSearchParams(window.location.search).get(name)?.trim();
  return value &&
    value.length <= LEAD_LIMITS.attribution &&
    /^[a-zA-Z0-9][a-zA-Z0-9 ._-]*$/u.test(value) &&
    !value.includes("@")
    ? value
    : undefined;
}

function messageForError(code: string | undefined): string {
  if (code === "invalid_submission") {
    return "Please check each required field and try again.";
  }
  if (
    code === "verification_failed" ||
    code === "verification_unavailable"
  ) {
    return "We could not verify this request. Please try again or use direct email.";
  }
  if (
    code === "integration_unavailable" ||
    code === "delivery_unavailable" ||
    code === "submission_failed"
  ) {
    return "Online requests are temporarily unavailable. Your entries are still here, or you can use direct email.";
  }
  return "We could not send your request. Your entries are still here, so you can try again or use direct email.";
}

function responseCode(value: unknown): string | undefined {
  if (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    typeof value.code === "string"
  ) {
    return value.code;
  }
  return undefined;
}

export default function LeadForm({
  className,
  source = "website",
  successHref = "/book",
  successLabel = "Choose a strategy-call time",
  fallbackEmail = contact.email,
  turnstileSiteKey = DEFAULT_TURNSTILE_SITE_KEY,
  turnstileAction = "lead_form",
}: LeadFormProps) {
  const [status, setStatus] = useState<FormStatus>({ kind: "idle" });
  const [verificationScriptFailed, setVerificationScriptFailed] =
    useState(false);
  const startedAt = useRef<number | null>(null);
  const submissionIdRef = useRef<string | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);

  const fallbackMailto =
    `mailto:${fallbackEmail}?subject=` +
    encodeURIComponent("Strategy call request");

  useEffect(() => {
    startedAt.current = window.performance.now();
  }, []);

  const focusStatus = () => {
    window.requestAnimationFrame(() => statusRef.current?.focus());
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status.kind === "submitting") {
      return;
    }

    const form = event.currentTarget;
    const values = new FormData(form);
    const text = (name: string) => String(values.get(name) ?? "");
    const submissionId =
      submissionIdRef.current ?? window.crypto.randomUUID();
    submissionIdRef.current = submissionId;
    const payload = {
      submissionId,
      fullName: text("fullName"),
      email: text("email"),
      company: text("company"),
      industry: text("industry"),
      areaOfInterest: text("areaOfInterest"),
      workflowChallenge: text("workflowChallenge"),
      timeline: text("timeline"),
      phone: text("phone"),
      processingAcknowledgment:
        values.get("processingAcknowledgment") === "on",
      marketingConsent: values.get("marketingConsent") === "on",
      contactWebsite: text("contactWebsite"),
      submissionElapsedMs:
        startedAt.current === null
          ? 0
          : Math.floor(window.performance.now() - startedAt.current),
      turnstileToken: text("turnstileToken"),
      pagePath: window.location.pathname,
      source,
      utmSource: safeUtmValue("utm_source"),
      utmMedium: safeUtmValue("utm_medium"),
      utmCampaign: safeUtmValue("utm_campaign"),
      utmTerm: safeUtmValue("utm_term"),
      utmContent: safeUtmValue("utm_content"),
    };

    setStatus({ kind: "submitting" });
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 18_000);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const result = (await response.json().catch(() => undefined)) as unknown;
      if (!response.ok) {
        setStatus({
          kind: "error",
          message: messageForError(responseCode(result)),
        });
        window.turnstile?.reset(turnstileContainerRef.current ?? undefined);
        focusStatus();
        return;
      }

      form.reset();
      startedAt.current = window.performance.now();
      submissionIdRef.current = window.crypto.randomUUID();
      setStatus({ kind: "success" });
      focusStatus();
    } catch {
      setStatus({
        kind: "error",
        message:
          "We could not send your request. Your entries are still here, so you can try again or use direct email.",
      });
      window.turnstile?.reset(turnstileContainerRef.current ?? undefined);
      focusStatus();
    } finally {
      window.clearTimeout(timeout);
    }
  };

  if (status.kind === "success") {
    return (
      <section
        className={`${styles.successPanel}${className ? ` ${className}` : ""}`}
        aria-labelledby="lead-success-title"
      >
        <div
          className={styles.statusFocus}
          ref={statusRef}
          tabIndex={-1}
          role="status"
        >
          <span className={styles.statusCode}>Request received // 200</span>
          <h2 id="lead-success-title">Your workflow brief is on its way.</h2>
          <p>
            The next step is a short strategy call to identify the smallest
            useful place to begin.
          </p>
        </div>
        <div className={styles.successActions}>
          {successHref ? (
            <a className={styles.primaryAction} href={successHref}>
              {successLabel}
            </a>
          ) : null}
          <a className={styles.secondaryAction} href={fallbackMailto}>
            Email Dreki directly
          </a>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`${styles.shell}${className ? ` ${className}` : ""}`}
      aria-labelledby="lead-form-title"
    >
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Strategy call request // 01</p>
          <h2 id="lead-form-title">Map the bottleneck.</h2>
        </div>
        <p className={styles.intro}>
          Give us enough operational context to make the first conversation
          useful. No pricing guesswork. We will scope the right starting point
          with you.
        </p>
      </div>

      <form
        className={styles.form}
        onSubmit={handleSubmit}
        aria-busy={status.kind === "submitting"}
      >
        <div className={styles.grid}>
          <label className={styles.field}>
            <span>
              Name <span aria-hidden="true">*</span>
            </span>
            <input
              name="fullName"
              type="text"
              autoComplete="name"
              maxLength={LEAD_LIMITS.fullName}
              required
            />
          </label>

          <label className={styles.field}>
            <span>
              Work email <span aria-hidden="true">*</span>
            </span>
            <input
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={LEAD_LIMITS.email}
              required
            />
          </label>

          <label className={styles.field}>
            <span>
              Company <span aria-hidden="true">*</span>
            </span>
            <input
              name="company"
              type="text"
              autoComplete="organization"
              maxLength={LEAD_LIMITS.company}
              required
            />
          </label>

          <label className={styles.field}>
            <span>
              Industry <span aria-hidden="true">*</span>
            </span>
            <select name="industry" defaultValue="" required>
              <option value="" disabled>
                Select your service category
              </option>
              {INDUSTRY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>
              Area of interest <span aria-hidden="true">*</span>
            </span>
            <select name="areaOfInterest" defaultValue="" required>
              <option value="" disabled>
                Select an agent workflow
              </option>
              {AREA_OF_INTEREST_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>
              Timeline <span aria-hidden="true">*</span>
            </span>
            <select name="timeline" defaultValue="" required>
              <option value="" disabled>
                Select a timeframe
              </option>
              {TIMELINE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={`${styles.field} ${styles.wide}`}>
            <span>
              Primary workflow challenge <span aria-hidden="true">*</span>
            </span>
            <span className={styles.hint} id="workflow-challenge-hint">
              Describe the repetitive work, missed handoff, or customer delay
              that costs the most time.
            </span>
            <textarea
              name="workflowChallenge"
              rows={6}
              minLength={10}
              maxLength={LEAD_LIMITS.workflowChallenge}
              aria-describedby="workflow-challenge-hint"
              required
            />
          </label>

          <label className={`${styles.field} ${styles.wide}`}>
            <span>Phone number <small>Optional</small></span>
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={LEAD_LIMITS.phone}
            />
          </label>
        </div>

        <fieldset className={styles.permissions}>
          <legend>Permissions</legend>
          <label className={styles.checkRow}>
            <input name="processingAcknowledgment" type="checkbox" required />
            <span>
              {PROCESSING_ACKNOWLEDGMENT}{" "}
              <a href="/privacy">Read the privacy policy.</a>{" "}
              <strong>Required.</strong>
            </span>
          </label>
          <label className={styles.checkRow}>
            <input name="marketingConsent" type="checkbox" />
            <span>
              {MARKETING_CONSENT} <strong>Optional.</strong>
            </span>
          </label>
        </fieldset>

        <div className={styles.honeypot} aria-hidden="true">
          <label>
            Leave this website field empty
            <input
              name="contactWebsite"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              maxLength={LEAD_LIMITS.honeypot}
            />
          </label>
        </div>

        {turnstileSiteKey ? (
          <>
            <Script
              id="dreki-turnstile"
              src="https://challenges.cloudflare.com/turnstile/v0/api.js"
              strategy="afterInteractive"
              onError={() => setVerificationScriptFailed(true)}
            />
            <div
              ref={turnstileContainerRef}
              className={`cf-turnstile ${styles.turnstile}`}
              data-sitekey={turnstileSiteKey}
              data-action={turnstileAction}
              data-theme="dark"
              data-size="flexible"
              data-response-field-name="turnstileToken"
              data-refresh-expired="auto"
              data-refresh-timeout="auto"
            />
          </>
        ) : null}

        {verificationScriptFailed ? (
          <p className={styles.inlineNotice} role="alert">
            Automated verification could not load. Use direct email below if
            the problem continues.
          </p>
        ) : null}

        <div className={styles.footer}>
          <div>
            <button
              className={styles.submit}
              type="submit"
              disabled={
                status.kind === "submitting" || verificationScriptFailed
              }
            >
              {status.kind === "submitting"
                ? "Sending request…"
                : "Request a scoped strategy call"}
            </button>
            <p className={styles.requiredNote}>* Required fields</p>
          </div>
          <aside className={styles.fallback}>
            <span>Prefer a direct channel?</span>
            <a href={fallbackMailto}>{fallbackEmail}</a>
          </aside>
        </div>

        {status.kind === "error" ? (
          <div
            className={`${styles.formStatus} ${styles.errorStatus} ${styles.statusFocus}`}
            role="alert"
            ref={statusRef}
            tabIndex={-1}
          >
            <span>Request not sent</span>
            <p>{status.message}</p>
            <a href={fallbackMailto}>Open a direct email</a>
          </div>
        ) : null}
      </form>
    </section>
  );
}
