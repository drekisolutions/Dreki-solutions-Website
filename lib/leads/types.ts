import type {
  AreaOfInterestValue,
  IndustryValue,
  TimelineValue,
} from "./content";

export interface QualifiedLead {
  submissionId: string;
  fullName: string;
  email: string;
  company: string;
  industry: IndustryValue;
  areaOfInterest: AreaOfInterestValue;
  workflowChallenge: string;
  timeline: TimelineValue;
  phone?: string;
  marketingConsent: boolean;
  submittedAt: number;
  pagePath: string;
  source: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  turnstileToken?: string;
}

export interface LeadSubmissionContext {
  pageUri: string;
  pageName: string;
  ipAddress?: string;
}

export type LeadResult =
  | { ok: true }
  | {
      ok: false;
      kind: "configuration" | "rejected" | "unavailable";
    };

export interface LeadDestination {
  submitLead(
    input: QualifiedLead,
    context: LeadSubmissionContext,
  ): Promise<LeadResult>;
}
