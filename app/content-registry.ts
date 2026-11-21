import type { Metadata } from "next";
import { servicePricing } from "./service-pricing";

export type PublicationStatus = "published" | "draft";
export type IndexingStatus = "index" | "noindex";
export type MarketingPageType =
  | "home"
  | "hub"
  | "agent"
  | "industry"
  | "service"
  | "product"
  | "proof"
  | "company"
  | "conversion"
  | "legal";
export type StructuredDataEligibility =
  | "organization"
  | "service"
  | "breadcrumb"
  | "none";

export type ContentRegistryEntry = {
  route: string;
  slug: string;
  title: string;
  description: string;
  publicationStatus: PublicationStatus;
  indexingStatus: IndexingStatus;
  pageType: MarketingPageType;
  audience: string;
  primaryIntent: string;
  relatedPages: readonly string[];
  updatedDate: `${number}-${number}-${number}`;
  structuredDataEligibility: readonly StructuredDataEligibility[];
  socialImage: string | null;
};

const updatedDate = "2026-07-23" as const;

export const contentRegistry = [
  {
    route: "/free-audit",
    slug: "free-audit",
    title: "Free Website & Digital Presence Audit",
    description: "Request a free digital presence audit from Dreki Solutions. Review how customers find, trust, and contact your business online.",
    publicationStatus: "published",
    indexingStatus: "index",
    pageType: "conversion",
    audience: "Business owners",
    primaryIntent: "Request a free digital presence business audit",
    relatedPages: ["/contact", "/social-media-marketing"],
    updatedDate: "2026-11-20",
    structuredDataEligibility: ["breadcrumb"],
    socialImage: "/og.png",
  },
  {
    route: "/",
    slug: "home",
    title: "Social Media Marketing and Branding for Small Businesses",
    description:
      "Dreki Solutions helps owner-led small businesses with social media marketing, brand development, and a free digital presence audit.",
    publicationStatus: "published",
    indexingStatus: "index",
    pageType: "home",
    audience: "Owner-led small businesses",
    primaryIntent: "Start with a free audit",
    relatedPages: ["/free-audit", "/social-media-marketing", "/brand-development"],
    updatedDate: "2026-11-08",
    structuredDataEligibility: ["organization", "service"],
    socialImage: "/og.png",
  },
  {
    route: "/social-media-marketing",
    slug: "social-media-marketing",
    title: "Social Media Marketing for Small Business",
    description:
      `Up to 30 posts and videos a month across six platforms. ${servicePricing.monthlyContent}, ${servicePricing.minimumTerm}. Start with a free audit.`,
    publicationStatus: "published",
    indexingStatus: "index",
    pageType: "service",
    audience: "Owner-led small businesses",
    primaryIntent: "Start with a free audit",
    relatedPages: ["/free-audit", "/brand-development"],
    updatedDate: "2026-11-21",
    structuredDataEligibility: ["breadcrumb"],
    socialImage: "/og.png",
  },
  {
    route: "/brand-development",
    slug: "brand-development",
    title: "Brand Development for Small Businesses",
    description:
      `Business brand kit: ${servicePricing.businessBrandKit}. Owner personal brand development: ${servicePricing.ownerPersonalBrand}. Monthly content retainer: ${servicePricing.monthlyContent}, ${servicePricing.minimumTerm}.`,
    publicationStatus: "published",
    indexingStatus: "index",
    pageType: "service",
    audience: "Owner-led small businesses",
    primaryIntent: "Start with a free audit",
    relatedPages: ["/free-audit", "/social-media-marketing"],
    updatedDate: "2026-11-21",
    structuredDataEligibility: ["breadcrumb"],
    socialImage: "/og.png",
  },
  {
    route: "/about",
    slug: "about",
    title: "About",
    description:
      "Veteran-owned Dreki Solutions does social media marketing and brand development for owner-led small businesses, starting with a free digital presence audit.",
    publicationStatus: "published",
    indexingStatus: "index",
    pageType: "company",
    audience: "Prospective clients and partners",
    primaryIntent: "Understand who Dreki is and how it works",
    relatedPages: ["/social-media-marketing", "/brand-development", "/book"],
    updatedDate,
    structuredDataEligibility: ["organization"],
    socialImage: "/og.png",
  },
  {
    route: "/contact",
    slug: "contact",
    title: "Contact",
    description:
      "Tell Dreki Solutions about your business and what you want help with: social media marketing, brand development, or a free digital presence audit.",
    publicationStatus: "published",
    indexingStatus: "index",
    pageType: "conversion",
    audience: "Prospective clients and partners",
    primaryIntent: "Submit an inquiry",
    relatedPages: ["/book", "/free-audit", "/privacy"],
    updatedDate,
    structuredDataEligibility: ["none"],
    socialImage: "/og.png",
  },
  {
    route: "/book",
    slug: "book",
    title: "Book a Call",
    description:
      "Request a call with Dreki Solutions to talk through social media marketing or brand development for your small business.",
    publicationStatus: "published",
    indexingStatus: "index",
    pageType: "conversion",
    audience: "Owner-led small businesses",
    primaryIntent: "Request a call",
    relatedPages: ["/contact", "/free-audit", "/privacy"],
    updatedDate,
    structuredDataEligibility: ["none"],
    socialImage: "/og.png",
  },
  {
    route: "/thank-you",
    slug: "thank-you",
    title: "Thank You",
    description:
      "Next steps after contacting Dreki Solutions.",
    publicationStatus: "published",
    indexingStatus: "noindex",
    pageType: "conversion",
    audience: "People who have contacted Dreki Solutions",
    primaryIntent: "Understand the next step",
    relatedPages: ["/book", "/free-audit", "/"],
    updatedDate,
    structuredDataEligibility: ["none"],
    socialImage: null,
  },
  {
    route: "/privacy",
    slug: "privacy",
    title: "Privacy Policy",
    description:
      "Privacy practices for Dreki Solutions website inquiries, service providers, analytics, and related internal software tools.",
    publicationStatus: "published",
    indexingStatus: "index",
    pageType: "legal",
    audience: "Website visitors",
    primaryIntent: "Review privacy practices",
    relatedPages: ["/terms", "/contact"],
    updatedDate,
    structuredDataEligibility: ["none"],
    socialImage: "/og.png",
  },
  {
    route: "/terms",
    slug: "terms",
    title: "Terms and Conditions",
    description:
      "Terms for Dreki Solutions website use, free audit requests, and optional text messages, including frequency, rates, help, and opt-out instructions.",
    publicationStatus: "published",
    indexingStatus: "index",
    pageType: "legal",
    audience: "Website visitors",
    primaryIntent: "Review website and text messaging terms",
    relatedPages: ["/privacy", "/contact"],
    updatedDate: "2026-10-10",
    structuredDataEligibility: ["none"],
    socialImage: "/og.png",
  },
] as const satisfies readonly ContentRegistryEntry[];

export type RegistryRoute = (typeof contentRegistry)[number]["route"];

export function getContentEntry(route: RegistryRoute) {
  const entry = contentRegistry.find((item) => item.route === route);

  if (!entry) {
    throw new Error(`No content registry entry exists for ${route}.`);
  }

  return entry;
}

export function metadataFromRegistry(route: RegistryRoute): Metadata {
  const entry = getContentEntry(route);
  const image = entry.socialImage
    ? [{ url: entry.socialImage, alt: `${entry.title} — Dreki Solutions` }]
    : undefined;

  return {
    title:
      entry.route === "/"
        ? { absolute: `${entry.title} | Dreki Solutions` }
        : entry.title,
    description: entry.description,
    alternates: { canonical: entry.route },
    robots:
      entry.indexingStatus === "noindex"
        ? { index: false, follow: false }
        : { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: "Dreki Solutions",
      title: entry.title,
      description: entry.description,
      url: entry.route,
      images: image,
    },
    twitter: {
      title: entry.title,
      description: entry.description,
      images: entry.socialImage ? [entry.socialImage] : undefined,
    },
  };
}
