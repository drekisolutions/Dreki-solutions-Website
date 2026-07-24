import type {
  AreaOfInterestValue,
  IndustryValue,
  TimelineValue,
} from "./content";
import type { QualifiedLead } from "./types";

export const LEAD_LIMITS = {
  submissionId: 36,
  fullName: 100,
  email: 254,
  company: 120,
  phone: 32,
  workflowChallenge: 1_500,
  pagePath: 240,
  source: 40,
  attribution: 80,
  honeypot: 200,
  turnstileToken: 2_048,
} as const;

export const MINIMUM_SUBMISSION_TIME_MS = 3_000;
const MAXIMUM_SUBMISSION_TIME_MS = 24 * 60 * 60 * 1_000;

type ValidationResult =
  | { ok: true; data: QualifiedLead }
  | { ok: false; kind: "invalid" | "suspected_spam" };

type UnknownRecord = Record<string, unknown>;

const industryValues = new Set<string>(
  [
    "home_services",
    "professional_services",
    "personal_services",
    "health_wellness",
    "hospitality",
    "other_service_business",
  ],
);
const areaOfInterestValues = new Set<string>(
  [
    "customer_response",
    "intake_scheduling",
    "workflow_coordination",
    "not_sure",
  ],
);
const timelineValues = new Set<string>(
  [
    "within_30_days",
    "one_to_three_months",
    "three_to_six_months",
    "exploring",
  ],
);

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeSingleLine(
  value: unknown,
  maximumLength: number,
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.normalize("NFKC").trim().replace(/\s+/g, " ");
  if (
    normalized.length > maximumLength ||
    /[\u0000-\u001f\u007f]/u.test(normalized)
  ) {
    return undefined;
  }

  return normalized;
}

function normalizeLongText(
  value: unknown,
  maximumLength: number,
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .trim();

  if (
    normalized.length > maximumLength ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(normalized)
  ) {
    return undefined;
  }

  return normalized;
}

function normalizeOptionalAttribution(value: unknown): string | undefined {
  const normalized = normalizeSingleLine(value, LEAD_LIMITS.attribution);
  if (
    !normalized ||
    !/^[a-zA-Z0-9][a-zA-Z0-9 ._-]*$/u.test(normalized) ||
    normalized.includes("@")
  ) {
    return undefined;
  }

  return normalized;
}

function normalizeSource(value: unknown): string {
  const normalized = normalizeSingleLine(value, LEAD_LIMITS.source);
  return normalized && /^[a-z0-9][a-z0-9_-]*$/u.test(normalized)
    ? normalized
    : "website";
}

function normalizePagePath(value: unknown): string | undefined {
  const normalized = normalizeSingleLine(value, LEAD_LIMITS.pagePath);
  if (
    !normalized ||
    !/^\/(?!\/)[a-zA-Z0-9/%._~-]*$/u.test(normalized) ||
    normalized.includes("?") ||
    normalized.includes("#")
  ) {
    return undefined;
  }

  try {
    decodeURIComponent(normalized);
  } catch {
    return undefined;
  }

  return normalized;
}

function normalizeEmail(value: unknown): string | undefined {
  const normalized = normalizeSingleLine(value, LEAD_LIMITS.email)?.toLowerCase();
  if (
    !normalized ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(normalized) ||
    normalized.includes("..")
  ) {
    return undefined;
  }

  return normalized;
}

function normalizeSubmissionId(value: unknown): string | undefined {
  const normalized = normalizeSingleLine(value, LEAD_LIMITS.submissionId);
  return normalized &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
      normalized,
    )
    ? normalized.toLowerCase()
    : undefined;
}

function normalizePhone(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const normalized = normalizeSingleLine(value, LEAD_LIMITS.phone);
  if (
    !normalized ||
    normalized.length < 7 ||
    !/^[0-9+().#xX -]+$/u.test(normalized)
  ) {
    return undefined;
  }

  return normalized;
}

function isSafePositiveInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

export function validateLeadPayload(
  payload: unknown,
  options: { now?: number } = {},
): ValidationResult {
  if (!isRecord(payload)) {
    return { ok: false, kind: "invalid" };
  }

  const honeypot = normalizeSingleLine(
    payload.contactWebsite,
    LEAD_LIMITS.honeypot,
  );
  if (payload.contactWebsite !== undefined && honeypot === undefined) {
    return { ok: false, kind: "invalid" };
  }
  if (honeypot) {
    return { ok: false, kind: "suspected_spam" };
  }

  const now = options.now ?? Date.now();
  if (
    !isSafePositiveInteger(payload.submissionElapsedMs) ||
    payload.submissionElapsedMs < MINIMUM_SUBMISSION_TIME_MS ||
    payload.submissionElapsedMs > MAXIMUM_SUBMISSION_TIME_MS
  ) {
    return { ok: false, kind: "suspected_spam" };
  }

  const fullName = normalizeSingleLine(payload.fullName, LEAD_LIMITS.fullName);
  const submissionId = normalizeSubmissionId(payload.submissionId);
  const email = normalizeEmail(payload.email);
  const company = normalizeSingleLine(payload.company, LEAD_LIMITS.company);
  const workflowChallenge = normalizeLongText(
    payload.workflowChallenge,
    LEAD_LIMITS.workflowChallenge,
  );
  const phone = normalizePhone(payload.phone);
  const pagePath = normalizePagePath(payload.pagePath);

  if (
    !submissionId ||
    !fullName ||
    fullName.length < 2 ||
    !email ||
    !company ||
    company.length < 2 ||
    !workflowChallenge ||
    workflowChallenge.length < 10 ||
    !pagePath ||
    (payload.phone !== undefined &&
      payload.phone !== "" &&
      phone === undefined)
  ) {
    return { ok: false, kind: "invalid" };
  }

  if (
    typeof payload.industry !== "string" ||
    !industryValues.has(payload.industry) ||
    typeof payload.areaOfInterest !== "string" ||
    !areaOfInterestValues.has(payload.areaOfInterest) ||
    typeof payload.timeline !== "string" ||
    !timelineValues.has(payload.timeline)
  ) {
    return { ok: false, kind: "invalid" };
  }

  if (
    payload.processingAcknowledgment !== true ||
    (payload.marketingConsent !== undefined &&
      typeof payload.marketingConsent !== "boolean")
  ) {
    return { ok: false, kind: "invalid" };
  }

  let turnstileToken: string | undefined;
  if (payload.turnstileToken !== undefined && payload.turnstileToken !== "") {
    turnstileToken = normalizeSingleLine(
      payload.turnstileToken,
      LEAD_LIMITS.turnstileToken,
    );
    if (!turnstileToken) {
      return { ok: false, kind: "invalid" };
    }
  }

  return {
    ok: true,
    data: {
      submissionId,
      fullName,
      email,
      company,
      industry: payload.industry as IndustryValue,
      areaOfInterest: payload.areaOfInterest as AreaOfInterestValue,
      workflowChallenge,
      timeline: payload.timeline as TimelineValue,
      ...(phone ? { phone } : {}),
      marketingConsent: payload.marketingConsent === true,
      submittedAt: now,
      pagePath,
      source: normalizeSource(payload.source),
      ...(normalizeOptionalAttribution(payload.utmSource)
        ? { utmSource: normalizeOptionalAttribution(payload.utmSource) }
        : {}),
      ...(normalizeOptionalAttribution(payload.utmMedium)
        ? { utmMedium: normalizeOptionalAttribution(payload.utmMedium) }
        : {}),
      ...(normalizeOptionalAttribution(payload.utmCampaign)
        ? { utmCampaign: normalizeOptionalAttribution(payload.utmCampaign) }
        : {}),
      ...(normalizeOptionalAttribution(payload.utmTerm)
        ? { utmTerm: normalizeOptionalAttribution(payload.utmTerm) }
        : {}),
      ...(normalizeOptionalAttribution(payload.utmContent)
        ? { utmContent: normalizeOptionalAttribution(payload.utmContent) }
        : {}),
      ...(turnstileToken ? { turnstileToken } : {}),
    },
  };
}

export function splitLeadName(fullName: string): {
  firstName: string;
  lastName?: string;
} {
  const lastSpace = fullName.lastIndexOf(" ");
  if (lastSpace < 1) {
    return { firstName: fullName };
  }

  return {
    firstName: fullName.slice(0, lastSpace),
    lastName: fullName.slice(lastSpace + 1),
  };
}
