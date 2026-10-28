import { SMS_CONSENT, SMS_CONSENT_VERSION, TERMS_AGREEMENT, TERMS_VERSION, PRIVACY_VERSION } from "./content.ts";
import type { AuditRequest } from "./validation.ts";

export const AUDIT_RECIPIENT = "brett@dreki-solutions.ai";

export function isAuditDeliveryConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.AUDIT_FROM_EMAIL?.trim());
}

export function buildAuditEmail(data: AuditRequest) {
  return {
    from: process.env.AUDIT_FROM_EMAIL?.trim(),
    to: [AUDIT_RECIPIENT],
    reply_to: data.email,
    subject: `Free digital presence audit: ${data.company}`,
    text: [
      "FREE DIGITAL PRESENCE AUDIT REQUEST", "",
      `Owner: ${data.firstName} ${data.lastName}`,
      `Email: ${data.email}`, `Company: ${data.company}`,
      `City: ${data.city}`, `State: ${data.state}`, `Phone: ${data.phone}`, "",
      `Text message authorization: ${data.smsConsent ? "YES — opted in" : "NO — do not text"}`,
      `Consent wording version: ${SMS_CONSENT_VERSION}`,
      `Consent wording shown: ${SMS_CONSENT}`, "",
      `Terms and Privacy Policy agreement: ${data.termsAccepted ? "YES — agreed" : "NO"}`,
      `Agreement wording: ${TERMS_AGREEMENT}`,
      `Terms version: ${TERMS_VERSION}`,
      `Privacy Policy version: ${PRIVACY_VERSION}`,
      "Terms: https://www.dreki-solutions.ai/terms",
      "Privacy Policy: https://www.dreki-solutions.ai/privacy", "",
      `Request ID: ${data.submissionId}`,
      "Source: https://www.dreki-solutions.ai/free-audit",
      "The email received timestamp records receipt of this request and consent choice.",
    ].join("\n"),
  };
}

export async function deliverAuditRequest(data: AuditRequest): Promise<boolean> {
  if (!isAuditDeliveryConfigured()) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY?.trim()}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `audit/${data.submissionId}`,
      },
      body: JSON.stringify(buildAuditEmail(data)),
      signal: AbortSignal.timeout(10_000),
    });
    const result = await response.json().catch(() => null);
    return response.ok && typeof result?.id === "string" && result.id.length > 0;
  } catch {
    return false;
  }
}
