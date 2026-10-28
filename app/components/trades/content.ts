export const workflows = [
  {
    title: "Missed-call follow-up",
    short: "Missed calls",
    label: "Catch the opportunity.",
    copy: "You're on a roof. Under a sink. In the middle of a job. Build a follow-up workflow that helps every missed call find its way back to your team.",
    steps: ["Missed call", "Follow-up prepared", "Conversation handed off"],
  },
  {
    title: "Lead intake",
    short: "Lead intake",
    label: "Start with the right details.",
    copy: "Bring scattered inquiries into one clear intake. Collect the job details, check your service area, and give your team the context to take the next step.",
    steps: ["New inquiry", "Job details collected", "Ready for review"],
  },
  {
    title: "Scheduling",
    short: "Scheduling",
    label: "Make room for the work.",
    copy: "Connect customer requests with your scheduling process. Prepare appointments and reminders around your availability, with exceptions routed to a person.",
    steps: [
      "Appointment requested",
      "Availability checked",
      "Your team confirms",
    ],
  },
  {
    title: "Estimates",
    short: "Estimates",
    label: "Keep the next job moving.",
    copy: "Organize job information, prepare estimate workflows, and follow up on open quotes. Your team stays in charge of pricing, scope, and commitments.",
    steps: ["Job details ready", "Estimate prepared", "Owner approves"],
  },
  {
    title: "Invoicing",
    short: "Invoicing",
    label: "Close the paperwork loop.",
    copy: "Turn completed-job handoffs into an organized invoice workflow. Prepare records and reminders without losing track of who approves the final numbers.",
    steps: ["Work completed", "Invoice prepared", "Owner reviews"],
  },
] as const;

export const projects = [
  {
    name: "Old Dog Sauce & Spice",
    category: "Client project",
    kind: "client",
    number: "01",
    description:
      "A business dashboard with automated content generation for a sauce and spice brand.",
    tags: ["Dashboard", "Content automation"],
    visual: "content",
    href: null,
    cta: null,
  },
  {
    name: "Sea Wolf Cove",
    category: "Client project",
    kind: "client",
    number: "02",
    description: "A website and dashboard built for a 3D printing company.",
    tags: ["Website", "Business dashboard"],
    visual: "print",
    href: null,
    cta: null,
  },
  {
    name: "RoofBid",
    category: "Dreki product",
    kind: "dreki",
    number: "03",
    description:
      "Automation for commercial roofers that speeds up the bidding process. Estimation measurements from your desk are coming soon.",
    tags: ["Commercial roofing", "Bid automation"],
    visual: "roof",
    href: "https://roofbid.dreki-solutions.ai",
    cta: "Explore RoofBid",
  },
  {
    name: "Hook and Clip",
    category: "Dreki product",
    kind: "dreki",
    number: "04",
    description:
      "A platform for content creators to clip long-form videos and automate carousels and reels.",
    tags: ["Content creators", "Content automation"],
    visual: "clip",
    href: "https://www.hookandclip.com",
    cta: "Visit Hook and Clip",
  },
  {
    name: "Deskhand / Foreman",
    category: "Dreki product & offer",
    kind: "dreki",
    number: "05",
    description:
      "Meet Deskhand and review the Foreman offer sheet for the details.",
    tags: ["Trade operations", "Foreman offer"],
    visual: "desk",
    href: "https://deskhand-foreman.vercel.app/deskhand",
    cta: "View offer sheet",
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
    category: "Customer response",
    title: "The work that happens after a missed call.",
    motif: "call",
  },
  {
    number: "02",
    category: "Operations",
    title: "From first inquiry to the next job on the calendar.",
    motif: "flow",
  },
  {
    number: "03",
    category: "Field notes",
    title: "Where automation fits in a hands-on business.",
    motif: "grid",
  },
  {
    number: "04",
    category: "Back office",
    title: "Connecting estimates, invoices, and the work between.",
    motif: "paper",
  },
];
