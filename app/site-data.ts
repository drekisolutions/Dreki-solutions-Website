export const contact = {
  email: "brett@dreki-solutions.ai",
  phoneDisplay: "(517) 215-7573",
  phoneHref: "tel:+15172157573",
} as const;

export const navigation = [
  { href: "/social-media-marketing", label: "Social media" },
  { href: "/brand-development", label: "Branding" },
  { href: "/#journal", label: "Field notes" },
  { href: "/about", label: "About" },
] as const;

export const consultationMailto =
  "mailto:brett@dreki-solutions.ai?subject=Call%20request&body=Business%20name%3A%0D%0AWebsite%3A%0D%0AWhat%20you%20want%20help%20with%3A%0D%0APreferred%20contact%20method%3A%0D%0A";

// TODO: prices from offer ladder, pending Brett's approval
// Null stays off the page. Do not render a setup fee, a one-time fix price,
// or any dollar amount while these values are null.
export const pricing = {
  socialMonthly: null as number | null,
  socialSetup: null as number | null,
  freeAudit: null as number | null,
} as const;

export const pricingPendingCopy = "Pricing shared after your free audit";

export function socialPriceCopy(): string {
  if (pricing.socialMonthly == null || pricing.socialSetup == null) {
    return pricingPendingCopy;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(pricing.socialMonthly) + " a month.";
}

export const processSteps = [
  {
    index: "01",
    title: "Audit",
    copy: "Review the Google Business Profile, website, and social accounts. You get a clear list of what to fix first.",
  },
  {
    index: "02",
    title: "Fix and brand",
    copy: "Fix the profile and site gaps, and build a brand for the company and a personal brand for the owner. This work is quoted privately. It is not part of the monthly social plan.",
  },
  {
    index: "03",
    title: "Monthly content",
    copy: "Stay on a retainer for social content. Up to 30 posts a month. You approve the calendar before anything goes out.",
  },
] as const;
