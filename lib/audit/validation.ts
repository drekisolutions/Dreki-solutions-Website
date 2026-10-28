import { US_STATES } from "./content.ts";

export interface AuditRequest {
  submissionId: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  city: string;
  state: string;
  phone: string;
  smsConsent: boolean;
  termsAccepted: boolean;
}

export function validateAuditRequest(input: unknown): AuditRequest | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const raw = input as Record<string, unknown>;
  const text = (key: string, max: number) => {
    const value = raw[key];
    if (typeof value !== "string" || /[\u0000-\u001f\u007f]/u.test(value)) return "";
    const clean = value.trim().replace(/\s+/gu, " ");
    return clean.length <= max ? clean : "";
  };
  const data: AuditRequest = {
    submissionId: text("submissionId", 36),
    firstName: text("firstName", 80),
    lastName: text("lastName", 80),
    email: text("email", 254).toLowerCase(),
    company: text("company", 160),
    city: text("city", 100),
    state: text("state", 32),
    phone: text("phone", 40),
    smsConsent: raw.smsConsent === true,
    termsAccepted: raw.termsAccepted === true,
  };
  const digits = data.phone.replace(/\D/gu, "");
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(data.submissionId) ||
    !data.firstName || !data.lastName || !data.company || !data.city ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(data.email) ||
    !US_STATES.some((state) => state === data.state) ||
    !/^\+?[\d\s().-]+$/u.test(data.phone) || digits.length < 10 || digits.length > 15 ||
    typeof raw.smsConsent !== "boolean" ||
    raw.termsAccepted !== true ||
    raw.website !== "" ||
    typeof raw.elapsedMs !== "number" || !Number.isFinite(raw.elapsedMs) || raw.elapsedMs < 2_000
  ) return null;
  return data;
}
