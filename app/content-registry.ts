import type { Metadata } from "next";

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
    route: "/",
    slug: "home",
    title: "Agentic Systems for Service Businesses",
    description:
      "Dreki Solutions designs bounded agents that help service businesses respond, schedule, and coordinate work with human approval intact.",
    publicationStatus: "published",
    indexingStatus: "index",
    pageType: "home",
    audience: "Service-business owners and operations leaders",
    primaryIntent: "Book a strategy call",
    relatedPages: ["/agents", "/industries/service-businesses", "/engagements"],
    updatedDate,
    structuredDataEligibility: ["organization", "service"],
    socialImage: "/og.png",
  },
  {
    route: "/agents",
    slug: "agents",
    title: "AI Agents for Service Operations",
    description:
      "Explore Dreki agents for customer response, intake and scheduling, and workflow coordination in service businesses.",
    publicationStatus: "published",
    indexingStatus: "index",
    pageType: "hub",
    audience: "Service-business owners and operations leaders",
    primaryIntent: "Compare agent jobs",
    relatedPages: [
      "/agents/customer-response",
      "/agents/intake-and-scheduling",
      "/agents/workflow-coordination",
      "/industries/service-businesses",
    ],
    updatedDate,
    structuredDataEligibility: ["breadcrumb"],
    socialImage: "/og.png",
  },
  {
    route: "/agents/customer-response",
    slug: "customer-response",
    title: "Customer Response Agent",
    description:
      "A bounded customer response agent that organizes inquiries, prepares approved replies, and escalates decisions to your team.",
    publicationStatus: "published",
    indexingStatus: "index",
    pageType: "agent",
    audience: "Service-business owners and customer-facing teams",
    primaryIntent: "Evaluate a customer response workflow",
    relatedPages: [
      "/agents/intake-and-scheduling",
      "/industries/service-businesses",
      "/services",
      "/book",
    ],
    updatedDate,
    structuredDataEligibility: ["service", "breadcrumb"],
    socialImage: "/og.png",
  },
  {
    route: "/agents/intake-and-scheduling",
    slug: "intake-and-scheduling",
    title: "Intake and Scheduling Agent",
    description:
      "A service-business intake agent that gathers approved details, prepares scheduling, and routes exceptions to a person.",
    publicationStatus: "published",
    indexingStatus: "index",
    pageType: "agent",
    audience: "Service businesses with repeatable qualification and scheduling work",
    primaryIntent: "Evaluate an intake and scheduling workflow",
    relatedPages: [
      "/agents/customer-response",
      "/agents/workflow-coordination",
      "/industries/service-businesses",
      "/book",
    ],
    updatedDate,
    structuredDataEligibility: ["service", "breadcrumb"],
    socialImage: "/og.png",
  },
  {
    route: "/agents/workflow-coordination",
    slug: "workflow-coordination",
    title: "Workflow Coordination Agent",
    description:
      "A bounded coordination agent that keeps handoffs, status checks, and exceptions visible without taking over human decisions.",
    publicationStatus: "published",
    indexingStatus: "index",
    pageType: "agent",
    audience: "Service teams managing recurring handoffs and follow-up",
    primaryIntent: "Evaluate a workflow coordination system",
    relatedPages: [
      "/agents/customer-response",
      "/agents/intake-and-scheduling",
      "/industries/service-businesses",
      "/engagements",
    ],
    updatedDate,
    structuredDataEligibility: ["service", "breadcrumb"],
    socialImage: "/og.png",
  },
  {
    route: "/industries",
    slug: "industries",
    title: "Agentic Systems by Industry",
    description:
      "See how Dreki applies bounded agents to the operating realities of service businesses, with each responsibility kept explicit.",
    publicationStatus: "published",
    indexingStatus: "index",
    pageType: "hub",
    audience: "Operations leaders evaluating workflow fit",
    primaryIntent: "Select an industry path",
    relatedPages: ["/industries/service-businesses", "/agents", "/products"],
    updatedDate,
    structuredDataEligibility: ["breadcrumb"],
    socialImage: "/og.png",
  },
  {
    route: "/industries/service-businesses",
    slug: "service-businesses",
    title: "AI Agents for Service Businesses",
    description:
      "Agentic systems for service-business inquiry response, intake, scheduling preparation, and operational handoffs.",
    publicationStatus: "published",
    indexingStatus: "index",
    pageType: "industry",
    audience: "Owners and operations leaders at service businesses",
    primaryIntent: "Assess service-business workflow fit",
    relatedPages: [
      "/agents/customer-response",
      "/agents/intake-and-scheduling",
      "/agents/workflow-coordination",
      "/services",
      "/book",
    ],
    updatedDate,
    structuredDataEligibility: ["service", "breadcrumb"],
    socialImage: "/og.png",
  },
  {
    route: "/services",
    slug: "services",
    title: "Custom Agentic Software Services",
    description:
      "Audit, design, deploy, and improve a bounded agentic workflow for your service business.",
    publicationStatus: "published",
    indexingStatus: "index",
    pageType: "service",
    audience: "Organizations that need a custom workflow system",
    primaryIntent: "Discuss a workflow",
    relatedPages: ["/agents", "/engagements", "/book"],
    updatedDate,
    structuredDataEligibility: ["service"],
    socialImage: "/og.png",
  },
  {
    route: "/products",
    slug: "products",
    title: "Agentic Software Product Registry",
    description:
      "Review the current development status of Dreki Solutions software products for service businesses.",
    publicationStatus: "published",
    indexingStatus: "index",
    pageType: "product",
    audience: "Prospective product users and testing partners",
    primaryIntent: "Review truthful product availability",
    relatedPages: ["/agents", "/portfolio", "/book"],
    updatedDate,
    structuredDataEligibility: ["none"],
    socialImage: "/og.png",
  },
  {
    route: "/portfolio",
    slug: "portfolio",
    title: "Internal Workflow Demonstrations",
    description:
      "Clearly labeled Dreki Solutions internal demonstrations of bounded customer response, intake, and workflow coordination systems.",
    publicationStatus: "published",
    indexingStatus: "index",
    pageType: "proof",
    audience: "Buyers who want to inspect how the workflow is designed",
    primaryIntent: "Review internal demonstrations",
    relatedPages: [
      "/agents/customer-response",
      "/agents/intake-and-scheduling",
      "/agents/workflow-coordination",
      "/book",
    ],
    updatedDate,
    structuredDataEligibility: ["none"],
    socialImage: "/og.png",
  },
  {
    route: "/about",
    slug: "about",
    title: "About",
    description:
      "Learn how veteran-founded Dreki Solutions approaches agentic software with bounded authority, visible handoffs, and human accountability.",
    publicationStatus: "published",
    indexingStatus: "index",
    pageType: "company",
    audience: "Prospective clients and partners",
    primaryIntent: "Understand Dreki's operating principles",
    relatedPages: ["/services", "/portfolio", "/book"],
    updatedDate,
    structuredDataEligibility: ["organization"],
    socialImage: "/og.png",
  },
  {
    route: "/engagements",
    slug: "engagements",
    title: "Agentic Software Engagements",
    description:
      "See how Dreki scopes workflow audits, custom agent builds, and ongoing optimization without publishing one-size-fits-all pricing.",
    publicationStatus: "published",
    indexingStatus: "index",
    pageType: "conversion",
    audience: "Qualified organizations planning an agentic workflow project",
    primaryIntent: "Request a scoped estimate",
    relatedPages: ["/services", "/agents", "/book"],
    updatedDate,
    structuredDataEligibility: ["service"],
    socialImage: "/og.png",
  },
  {
    route: "/contact",
    slug: "contact",
    title: "Contact",
    description:
      "Share the service-business workflow you want to improve with Dreki Solutions.",
    publicationStatus: "published",
    indexingStatus: "index",
    pageType: "conversion",
    audience: "Prospective clients and partners",
    primaryIntent: "Submit an inquiry",
    relatedPages: ["/book", "/services", "/privacy"],
    updatedDate,
    structuredDataEligibility: ["none"],
    socialImage: "/og.png",
  },
  {
    route: "/book",
    slug: "book",
    title: "Book a Strategy Call",
    description:
      "Request a strategy call with Dreki Solutions to discuss one service-business workflow and receive a scoped next step.",
    publicationStatus: "published",
    indexingStatus: "index",
    pageType: "conversion",
    audience: "Service-business owners and operations leaders",
    primaryIntent: "Request a strategy call",
    relatedPages: ["/contact", "/engagements", "/privacy"],
    updatedDate,
    structuredDataEligibility: ["none"],
    socialImage: "/og.png",
  },
  {
    route: "/thank-you",
    slug: "thank-you",
    title: "Thank You",
    description:
      "Next steps after contacting Dreki Solutions about a service-business workflow.",
    publicationStatus: "published",
    indexingStatus: "noindex",
    pageType: "conversion",
    audience: "People who have contacted Dreki Solutions",
    primaryIntent: "Understand the next step",
    relatedPages: ["/book", "/agents", "/"],
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
    title: "Website Terms",
    description:
      "Concise website-use terms for dreki-solutions.ai, including acceptable use, intellectual property, and important limitations.",
    publicationStatus: "draft",
    indexingStatus: "noindex",
    pageType: "legal",
    audience: "Website visitors",
    primaryIntent: "Review website terms",
    relatedPages: ["/privacy", "/contact"],
    updatedDate,
    structuredDataEligibility: ["none"],
    socialImage: null,
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

export type AgentOffer = {
  slug: "customer-response" | "intake-and-scheduling" | "workflow-coordination";
  route:
    | "/agents/customer-response"
    | "/agents/intake-and-scheduling"
    | "/agents/workflow-coordination";
  name: string;
  shortJob: string;
  audience: string;
  problem: string;
  tasks: readonly string[];
  inputs: readonly string[];
  outputs: readonly string[];
  before: string;
  after: string;
  approvalPoints: readonly string[];
  exclusions: readonly string[];
  dataBoundaries: readonly string[];
  demonstration: {
    title: string;
    scenario: string;
    shows: readonly string[];
  };
  faq: readonly { question: string; answer: string }[];
};

export const featuredAgents = [
  {
    slug: "customer-response",
    route: "/agents/customer-response",
    name: "Customer Response Agent",
    shortJob:
      "Organize incoming questions, prepare policy-aligned replies, and put exceptions in front of the right person.",
    audience:
      "Owners, office managers, and customer-facing teams that receive recurring inquiries across a defined set of services.",
    problem:
      "Important inquiries arrive while the team is serving customers. Context is scattered, response quality varies, and unusual requests can sit beside routine questions without a clear owner.",
    tasks: [
      "Classify an inquiry using business-approved categories.",
      "Identify missing details before a team member starts the conversation.",
      "Prepare a reply from approved service, policy, and availability information.",
      "Route urgent, sensitive, or out-of-policy requests to a named owner.",
    ],
    inputs: [
      "Approved service and policy information",
      "Business hours and service-area rules",
      "Response tone and escalation instructions",
      "Only the inquiry details needed for the workflow",
    ],
    outputs: [
      "Categorized inquiry",
      "Draft response or approved next question",
      "Visible exception reason",
      "Handoff record for the responsible person",
    ],
    before:
      "A person opens each message, searches for context, decides what can be said, and manually forwards anything that belongs elsewhere.",
    after:
      "The agent prepares the routine work in a consistent format. A person reviews decisions, commitments, and exceptions before the conversation moves forward.",
    approvalPoints: [
      "Price changes, discounts, refunds, and contractual commitments",
      "Complaints, emergencies, threats, or other sensitive situations",
      "Requests outside the approved service area or operating policy",
    ],
    exclusions: [
      "It does not invent availability, policy, or service details.",
      "It does not make binding promises on behalf of the business.",
      "It does not replace the accountable relationship owner.",
    ],
    dataBoundaries: [
      "Limit access to the channels and reference material approved for this job.",
      "Define retention and deletion before production use.",
      "Keep secrets and unnecessary personal information out of agent instructions.",
    ],
    demonstration: {
      title: "Response Relay",
      scenario:
        "A simulated service inquiry arrives with one missing detail and a request that falls outside the standard policy.",
      shows: [
        "Inquiry classification",
        "A policy-grounded follow-up draft",
        "A visible human approval gate for the exception",
      ],
    },
    faq: [
      {
        question: "Does this agent replace the person who owns customer relationships?",
        answer:
          "No. It prepares and routes defined work. Your team keeps authority over commitments, exceptions, and the relationship.",
      },
      {
        question: "Can it connect to our current inbox or customer system?",
        answer:
          "Possible connections are assessed during discovery. Dreki does not assume access or promise an integration before the system and its permissions are reviewed.",
      },
      {
        question: "What makes a workflow a good fit?",
        answer:
          "The strongest fit has repeated inquiry patterns, approved reference information, a clear exception owner, and enough volume or interruption to justify a system.",
      },
    ],
  },
  {
    slug: "intake-and-scheduling",
    route: "/agents/intake-and-scheduling",
    name: "Intake and Scheduling Agent",
    shortJob:
      "Gather the right request details, prepare a scheduling handoff, and escalate edge cases before a commitment is made.",
    audience:
      "Service businesses that qualify requests, collect job details, and coordinate appointments through a repeatable intake process.",
    problem:
      "Incomplete requests create phone tag and duplicate entry. Schedulers spend time asking the same questions, while unusual jobs still require experienced judgment.",
    tasks: [
      "Ask approved intake questions in a consistent order.",
      "Check answers against service-area and request-type rules.",
      "Prepare the information needed to offer or confirm a time.",
      "Route exceptions, conflicts, and special requirements to a person.",
    ],
    inputs: [
      "Approved qualification questions",
      "Service-area and request-type rules",
      "Scheduling policies and required buffers",
      "Authorized calendar or scheduling data, when configured",
    ],
    outputs: [
      "Complete intake summary",
      "Missing-information request",
      "Scheduling-ready handoff",
      "Exception queue with the reason made visible",
    ],
    before:
      "A scheduler reconstructs every request, repeats qualification questions, and discovers conflicts after the customer expects a time.",
    after:
      "The agent prepares a complete, policy-aligned intake record. A person owns unusual requests, final commitments, and any decision outside the defined rules.",
    approvalPoints: [
      "Nonstandard scope, access, safety, or service-area questions",
      "Priority overrides and schedule conflicts",
      "Pricing, deposits, guarantees, or other commercial commitments",
    ],
    exclusions: [
      "It does not promise a time that the source system has not made available.",
      "It does not decide whether a complex or unusual job is safe or appropriate.",
      "It does not collect information that the approved intake does not need.",
    ],
    dataBoundaries: [
      "Collect the minimum information required to qualify and schedule.",
      "Restrict calendar access to the exact actions the workflow needs.",
      "Document where intake records are stored and who may review them.",
    ],
    demonstration: {
      title: "Intake Gate",
      scenario:
        "A simulated request begins with incomplete service details and includes one condition that requires office review.",
      shows: [
        "Progressive intake questions",
        "A scheduling-ready summary",
        "An exception routed without an automatic promise",
      ],
    },
    faq: [
      {
        question: "Will it book every request automatically?",
        answer:
          "No. Automation is limited to approved rules and connected availability. Edge cases remain with the accountable scheduler or owner.",
      },
      {
        question: "Do we need to replace our scheduling software?",
        answer:
          "Not necessarily. Dreki first evaluates the current workflow and available connection options. A replacement is not assumed.",
      },
      {
        question: "Can we choose which questions are required?",
        answer:
          "Yes. The intake is designed around approved business requirements, data minimization, and a clear reason for each question.",
      },
    ],
  },
  {
    slug: "workflow-coordination",
    route: "/agents/workflow-coordination",
    name: "Workflow Coordination Agent",
    shortJob:
      "Keep recurring handoffs, status checks, and missing dependencies visible while people retain control of priorities and decisions.",
    audience:
      "Owners and operations teams coordinating work across office, field, customer, and vendor handoffs.",
    problem:
      "The work itself may be clear, but handoffs are not. Teams chase status, discover missing information late, and rely on memory to decide who should act next.",
    tasks: [
      "Track defined workflow stages and required dependencies.",
      "Prepare reminders and status requests at approved checkpoints.",
      "Summarize what changed before the next person takes over.",
      "Escalate overdue, blocked, or out-of-sequence work to a named owner.",
    ],
    inputs: [
      "Approved stages, owners, and completion criteria",
      "Authorized status signals from connected systems",
      "Reminder timing and escalation rules",
      "Exceptions that always require human review",
    ],
    outputs: [
      "Current stage and next-owner summary",
      "Missing-dependency notice",
      "Prepared status communication",
      "Escalation record with context",
    ],
    before:
      "People check several places, ask for updates, and reconstruct what happened whenever work crosses a team boundary.",
    after:
      "The agent maintains a defined coordination layer. People still set priorities, resolve conflicts, and approve any decision with customer, financial, or operational consequences.",
    approvalPoints: [
      "Priority changes and resource allocation",
      "Customer, vendor, financial, or contractual commitments",
      "Safety, compliance, personnel, and other accountable decisions",
    ],
    exclusions: [
      "It does not become the system of record unless that scope is explicitly designed.",
      "It does not infer completion without an approved signal.",
      "It does not hide exceptions or silently reroute responsibility.",
    ],
    dataBoundaries: [
      "Use narrow permissions for each source and action.",
      "Record the source of status information so people can verify it.",
      "Set retention, audit, and exception-review rules before deployment.",
    ],
    demonstration: {
      title: "Handoff Ledger",
      scenario:
        "A simulated service job moves from intake to preparation while one required dependency remains missing.",
      shows: [
        "Stage and owner visibility",
        "A prepared reminder with context",
        "Escalation when the dependency reaches its approved checkpoint",
      ],
    },
    faq: [
      {
        question: "Is this a project-management replacement?",
        answer:
          "Not by default. It is a coordination layer for a defined workflow and can work with existing systems when practical.",
      },
      {
        question: "Can it change priorities on its own?",
        answer:
          "No. It can surface a conflict and prepare the relevant context. An accountable person decides the priority.",
      },
      {
        question: "Where should a first implementation begin?",
        answer:
          "Choose one recurring handoff with clear stages, known owners, and a visible cost when information or follow-up is missed.",
      },
    ],
  },
] as const satisfies readonly AgentOffer[];

export type AgentSlug = (typeof featuredAgents)[number]["slug"];

export function getAgentOffer(slug: AgentSlug) {
  const agent = featuredAgents.find((item) => item.slug === slug);

  if (!agent) {
    throw new Error(`No approved agent offer exists for ${slug}.`);
  }

  return agent;
}
