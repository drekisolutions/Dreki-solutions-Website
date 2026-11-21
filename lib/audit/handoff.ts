import type { AuditRequest } from "./validation.ts";

// Hands an accepted audit request to the n8n "Dreki Audit Intake" workflow,
// which runs the audit on the scorecard app, emails the prospect their report
// with the booking link, and logs the lead in ClickUp.
//
// This runs after the request email to Brett has been accepted, so the lead is
// never lost. It must not fail or slow the form: n8n answers as soon as it has
// the request (the audit itself runs afterwards), the call is capped at a few
// seconds, and any failure is reported to the caller instead of thrown.

export const HANDOFF_SECRET_HEADER = "X-Dreki-Webhook-Secret";

// The n8n webhook checks one named header. Set N8N_AUDIT_INTAKE_HEADER when the
// workflow's header-auth credential uses a different header name.
export function handoffSecretHeader() {
  const name = process.env.N8N_AUDIT_INTAKE_HEADER?.trim();
  return name && /^[A-Za-z0-9-]{1,64}$/.test(name) ? name : HANDOFF_SECRET_HEADER;
}
const TIMEOUT_MS = 5_000;

export function isAuditHandoffConfigured() {
  return Boolean(process.env.N8N_AUDIT_INTAKE_URL?.trim() && process.env.N8N_AUDIT_INTAKE_SECRET?.trim());
}

export function buildHandoffPayload(data: AuditRequest) {
  return {
    submissionId: data.submissionId,
    businessName: data.company,
    website: data.businessUrl,
    owner: `${data.firstName} ${data.lastName}`,
    email: data.email,
    phone: data.phone,
    industry: data.industry,
    location: `${data.city}, ${data.state}`,
    smsConsent: data.smsConsent,
    source: "free-audit",
  };
}

export async function handOffAuditRequest(
  data: AuditRequest,
): Promise<{ ok: boolean; skipped?: boolean; status?: number }> {
  const url = process.env.N8N_AUDIT_INTAKE_URL?.trim();
  const secret = process.env.N8N_AUDIT_INTAKE_SECRET?.trim();
  if (!url || !secret) return { ok: false, skipped: true };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", [handoffSecretHeader()]: secret },
      body: JSON.stringify(buildHandoffPayload(data)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return { ok: response.ok, status: response.status };
  } catch {
    return { ok: false };
  }
}
