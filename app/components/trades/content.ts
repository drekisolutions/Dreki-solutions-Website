import { servicePricing, monthlyContentOptions } from "../../service-pricing.ts";

export const services = [
  {
    title: "Social media marketing",
    short: "Social media",
    copy: "We plan, produce, and post your monthly social content after your approval.",
    options: monthlyContentOptions,
    prices: [{ name: "Monthly content", amount: servicePricing.monthlyContent, term: servicePricing.minimumTerm }],
    node: 0,
    href: "/social-media-marketing",
    cta: "See monthly options",
  },
  {
    title: "Brand development",
    short: "Brand",
    copy: "Logo, colors, type, and guidelines for your business, or positioning and a profile overhaul for you as the owner.",
    options: [],
    prices: [
      { name: "Business brand kit", amount: servicePricing.businessBrandKit, term: "" },
      { name: "Owner personal brand development", amount: servicePricing.ownerPersonalBrand, term: "" },
      { name: "Monthly content retainer", amount: servicePricing.monthlyContent, term: servicePricing.minimumTerm },
    ],
    node: 1,
    href: "/brand-development",
    cta: "See branding options",
  },
  {
    title: "Digital presence audit",
    short: "Free audit",
    copy: "A free review of your website, social accounts, and Google Business Profile, with a written report on what to fix first.",
    options: [],
    prices: [],
    node: 3,
    href: "#free-audit",
    cta: "Request your free audit",
  },
] as const;

export type JournalArticle = {
  /** Unique card identifier; also displayed on the illustration. */
  number: string;
  category: string;
  title: string;
  motif: "call" | "flow" | "grid" | "paper";
  /** Add the article URL when published. Omit it for a coming-soon topic. */
  href?: string;
  imageUrl?: string;
};

// Append one entry per article. The carousel adapts to any number of entries.
export const journalTopics: JournalArticle[] = [
  {
    number: "01",
    category: "Social media",
    title: "What to post when you have no time to post.",
    motif: "call",
  },
  {
    number: "02",
    category: "Branding",
    title: "What your brand says before you say a word.",
    motif: "flow",
  },
  {
    number: "03",
    category: "Digital presence",
    title: "What customers see when they search for you.",
    motif: "grid",
  },
  {
    number: "04",
    category: "Google Business Profile",
    title: "The free listing most owners leave half finished.",
    motif: "paper",
  },
];
