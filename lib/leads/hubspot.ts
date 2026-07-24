import {
  MARKETING_CONSENT,
  PROCESSING_ACKNOWLEDGMENT,
} from "./content";
import { fetchWithTimeout } from "./http";
import type {
  LeadDestination,
  LeadResult,
  LeadSubmissionContext,
  QualifiedLead,
} from "./types";
import { splitLeadName } from "./validation";

const HUBSPOT_TIMEOUT_MS = 7_000;
const CONTACT_OBJECT_TYPE_ID = "0-1";

const HUBSPOT_FIELDS = {
  submissionId: "dreki_submission_id",
  firstName: "firstname",
  lastName: "lastname",
  email: "email",
  phone: "phone",
  company: "company",
  industry: "dreki_industry",
  areaOfInterest: "dreki_area_of_interest",
  workflowChallenge: "dreki_workflow_challenge",
  timeline: "dreki_timeline",
  originalPage: "dreki_original_page",
  source: "dreki_lead_source",
  utmSource: "dreki_utm_source",
  utmMedium: "dreki_utm_medium",
  utmCampaign: "dreki_utm_campaign",
  utmTerm: "dreki_utm_term",
  utmContent: "dreki_utm_content",
} as const;

interface HubSpotConfig {
  portalId: string;
  formId: string;
  marketingSubscriptionTypeId?: number;
}

interface HubSpotField {
  objectTypeId: typeof CONTACT_OBJECT_TYPE_ID;
  name: string;
  value: string;
}

function readHubSpotConfig(): HubSpotConfig | undefined {
  const portalId = process.env.HUBSPOT_PORTAL_ID?.trim();
  const formId = process.env.HUBSPOT_FORM_ID?.trim();

  if (
    !portalId ||
    !/^\d{1,20}$/u.test(portalId) ||
    !formId ||
    !/^[a-zA-Z0-9-]{8,64}$/u.test(formId)
  ) {
    return undefined;
  }

  const rawSubscriptionTypeId =
    process.env.HUBSPOT_MARKETING_SUBSCRIPTION_TYPE_ID?.trim();
  const parsedSubscriptionTypeId = rawSubscriptionTypeId
    ? Number(rawSubscriptionTypeId)
    : undefined;
  const marketingSubscriptionTypeId =
    parsedSubscriptionTypeId &&
    Number.isSafeInteger(parsedSubscriptionTypeId) &&
    parsedSubscriptionTypeId > 0
      ? parsedSubscriptionTypeId
      : undefined;

  return {
    portalId,
    formId,
    ...(marketingSubscriptionTypeId
      ? { marketingSubscriptionTypeId }
      : {}),
  };
}

function hubSpotField(name: string, value: string): HubSpotField {
  return {
    objectTypeId: CONTACT_OBJECT_TYPE_ID,
    name,
    value,
  };
}

function buildFields(input: QualifiedLead): HubSpotField[] {
  const { firstName, lastName } = splitLeadName(input.fullName);
  const fields: HubSpotField[] = [
    hubSpotField(HUBSPOT_FIELDS.submissionId, input.submissionId),
    hubSpotField(HUBSPOT_FIELDS.firstName, firstName),
    hubSpotField(HUBSPOT_FIELDS.email, input.email),
    hubSpotField(HUBSPOT_FIELDS.company, input.company),
    hubSpotField(HUBSPOT_FIELDS.industry, input.industry),
    hubSpotField(HUBSPOT_FIELDS.areaOfInterest, input.areaOfInterest),
    hubSpotField(
      HUBSPOT_FIELDS.workflowChallenge,
      input.workflowChallenge,
    ),
    hubSpotField(HUBSPOT_FIELDS.timeline, input.timeline),
    hubSpotField(HUBSPOT_FIELDS.originalPage, input.pagePath),
    hubSpotField(HUBSPOT_FIELDS.source, input.source),
  ];

  const optionalFields: Array<[string, string | undefined]> = [
    [HUBSPOT_FIELDS.lastName, lastName],
    [HUBSPOT_FIELDS.phone, input.phone],
    [HUBSPOT_FIELDS.utmSource, input.utmSource],
    [HUBSPOT_FIELDS.utmMedium, input.utmMedium],
    [HUBSPOT_FIELDS.utmCampaign, input.utmCampaign],
    [HUBSPOT_FIELDS.utmTerm, input.utmTerm],
    [HUBSPOT_FIELDS.utmContent, input.utmContent],
  ];

  for (const [name, value] of optionalFields) {
    if (value) {
      fields.push(hubSpotField(name, value));
    }
  }

  return fields;
}

export class HubSpotLeadDestination implements LeadDestination {
  constructor(private readonly config: HubSpotConfig) {}

  async submitLead(
    input: QualifiedLead,
    context: LeadSubmissionContext,
  ): Promise<LeadResult> {
    if (
      input.marketingConsent &&
      !this.config.marketingSubscriptionTypeId
    ) {
      return { ok: false, kind: "configuration" };
    }

    const communications = input.marketingConsent
      ? [
          {
            value: true,
            subscriptionTypeId:
              this.config.marketingSubscriptionTypeId as number,
            text: MARKETING_CONSENT,
          },
        ]
      : [];

    const payload = {
      submittedAt: String(input.submittedAt),
      fields: buildFields(input),
      context: {
        pageName: context.pageName,
        pageUri: context.pageUri,
        ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
      },
      legalConsentOptions: {
        consent: {
          consentToProcess: true,
          text: PROCESSING_ACKNOWLEDGMENT,
          communications,
        },
      },
    };

    const endpoint =
      "https://api.hsforms.com/submissions/v3/integration/submit/" +
      `${encodeURIComponent(this.config.portalId)}/` +
      encodeURIComponent(this.config.formId);

    try {
      const response = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
        HUBSPOT_TIMEOUT_MS,
      );

      if (response.ok) {
        return { ok: true };
      }

      return {
        ok: false,
        kind:
          response.status === 429 || response.status >= 500
            ? "unavailable"
            : "rejected",
      };
    } catch {
      return { ok: false, kind: "unavailable" };
    }
  }
}

export function getHubSpotLeadDestination():
  | HubSpotLeadDestination
  | undefined {
  const config = readHubSpotConfig();
  return config ? new HubSpotLeadDestination(config) : undefined;
}
