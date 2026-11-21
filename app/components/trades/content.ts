export const services = [
  {
    title: "Digital presence audit",
    short: "Free audit",
    copy: "Step 1. A free review of your Google Business Profile, website, and social accounts, with a clear list of what to fix first.",
    node: 0,
    href: "#free-audit",
    cta: "Request your free audit",
  },
  {
    title: "Brand development",
    short: "Brand",
    copy: "A brand for the company and a personal brand for you, the owner. Quoted privately. Not part of the monthly social plan.",
    node: 1,
    href: "/brand-development",
    cta: "See what is included",
  },
  {
    title: "Social media marketing",
    short: "Social media",
    copy: "Monthly social content on a retainer. Up to 30 posts a month. You approve the calendar before anything goes out.",
    node: 3,
    href: "/social-media-marketing",
    cta: "See what you get",
  },
  {
    title: "Profile and site fixes",
    short: "Fixes",
    copy: "Fixes for the Google profile and the website after the audit. Quoted privately. Not part of the monthly social plan, and not priced here.",
    node: 4,
    href: "/free-audit",
    cta: "Start with the audit",
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
