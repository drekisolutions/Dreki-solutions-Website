export const BILLING_SCOPE = "dreki-website-services-v1";
export const BILLING_TERMS = "2026-11-21";
export const billingOffers = {
  "business-brand-kit": {
    name: "Business brand kit",
    amount: 150000,
    monthly: false,
    product: "prod_VfhjMeItYdcTr8",
    description: "Logo, colors, type, and guidelines.",
  },
  "owner-personal-brand": {
    name: "Owner personal brand development",
    amount: 75000,
    monthly: false,
    product: "prod_Vfhk8FLPhKC0kE",
    description: "Positioning and profile overhaul.",
  },
  "social-media-marketing": {
    name: "Social media marketing",
    amount: 100000,
    monthly: true,
    product: "prod_VfhlFqA2KbFfcj",
    description:
      "Choose 30 static ad posts, or 20 posts and 8 videos each month.",
  },
  "monthly-content-retainer": {
    name: "Monthly content retainer",
    amount: 100000,
    monthly: true,
    product: "prod_VfhlyQf6BU6wId",
    description: "Ongoing content support for brand development.",
  },
} as const;
export type OfferKey = keyof typeof billingOffers;
export function offerKey(value: unknown): value is OfferKey {
  return typeof value === "string" && Object.hasOwn(billingOffers, value);
}
export const monthlyAgreement =
  "$1,000 billed monthly in advance. Three-month minimum: three monthly payments, $3,000 total before applicable tax. Then renews monthly until canceled. You may request cancellation at any time; it takes effect no earlier than the end of your first three months, then at the end of the current paid monthly period.";
