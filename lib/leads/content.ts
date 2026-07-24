export const PROCESSING_ACKNOWLEDGMENT =
  "I agree that Dreki Solutions may store and process the information I provide to respond to this request.";

export const MARKETING_CONSENT =
  "I agree to receive occasional product and service updates from Dreki Solutions. I can unsubscribe at any time.";

export const INDUSTRY_OPTIONS = [
  { value: "home_services", label: "Home services" },
  { value: "professional_services", label: "Professional services" },
  { value: "personal_services", label: "Personal services" },
  { value: "health_wellness", label: "Health and wellness services" },
  { value: "hospitality", label: "Hospitality services" },
  { value: "other_service_business", label: "Other service business" },
] as const;

export const AREA_OF_INTEREST_OPTIONS = [
  { value: "customer_response", label: "Customer response agents" },
  { value: "intake_scheduling", label: "Intake and scheduling agents" },
  { value: "workflow_coordination", label: "Workflow coordination agents" },
  { value: "not_sure", label: "Not sure yet" },
] as const;

export const TIMELINE_OPTIONS = [
  { value: "within_30_days", label: "Within 30 days" },
  { value: "one_to_three_months", label: "1–3 months" },
  { value: "three_to_six_months", label: "3–6 months" },
  { value: "exploring", label: "Exploring options" },
] as const;

export type IndustryValue = (typeof INDUSTRY_OPTIONS)[number]["value"];
export type AreaOfInterestValue =
  (typeof AREA_OF_INTEREST_OPTIONS)[number]["value"];
export type TimelineValue = (typeof TIMELINE_OPTIONS)[number]["value"];
