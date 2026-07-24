const HUBSPOT_PORTAL_ID_PATTERN = /^\d{1,20}$/u;
const HUBSPOT_FORM_ID_PATTERN = /^[a-zA-Z0-9-]{8,64}$/u;

function value(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function isLeadCaptureConfigured(): boolean {
  const portalId = value("HUBSPOT_PORTAL_ID");
  const formId = value("HUBSPOT_FORM_ID");
  const subscriptionTypeId = Number(
    value("HUBSPOT_MARKETING_SUBSCRIPTION_TYPE_ID"),
  );

  return (
    HUBSPOT_PORTAL_ID_PATTERN.test(portalId) &&
    HUBSPOT_FORM_ID_PATTERN.test(formId) &&
    Number.isSafeInteger(subscriptionTypeId) &&
    subscriptionTypeId > 0 &&
    Boolean(value("NEXT_PUBLIC_TURNSTILE_SITE_KEY")) &&
    Boolean(value("TURNSTILE_SECRET_KEY")) &&
    Boolean(value("TURNSTILE_EXPECTED_HOSTNAME")) &&
    value("TURNSTILE_EXPECTED_ACTION") === "lead_form" &&
    value("LEAD_RATE_LIMIT_VERIFIED") === "true"
  );
}
