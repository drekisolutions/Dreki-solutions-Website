export const contact = {
  email: "Brett@dreki-solutions.com",
  phoneDisplay: "(517) 215-7573",
  phoneHref: "tel:+15172157573",
} as const;

export const navigation = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/contact", label: "Contact" },
] as const;

export const consultationMailto =
  "mailto:Brett@dreki-solutions.com?subject=Consultation%20and%20Optimization%20Audit%20Request&body=Business%20name%3A%0D%0AWebsite%3A%0D%0AIndustry%3A%0D%0AWorkflow%20to%20optimize%3A%0D%0APreferred%20contact%20method%3A%0D%0A";

export const serviceIndustryServices = [
  {
    index: "01",
    title: "Customer response agents",
    copy: "Triage inquiries, gather approved context, draft clear replies, and route exceptions to the right person.",
  },
  {
    index: "02",
    title: "Reputation operations",
    copy: "Monitor feedback, organize priorities, prepare brand-safe responses, and keep final approval human.",
  },
  {
    index: "03",
    title: "Content operations",
    copy: "Turn approved ideas into a reliable content workflow while preserving editorial judgment.",
  },
  {
    index: "04",
    title: "Intake and scheduling",
    copy: "Collect the right details, prepare appointments, reduce duplicate entry, and escalate unusual requests.",
  },
  {
    index: "05",
    title: "Workflow coordination",
    copy: "Move context across handoffs, reminders, internal systems, and recurring operating checkpoints.",
  },
  {
    index: "06",
    title: "Administrative agents",
    copy: "Handle repeatable status checks, record preparation, follow-up queues, and defined back-office tasks.",
  },
] as const;

export const aviationServices = [
  {
    index: "A1",
    title: "Charter workflow orchestration",
    copy: "Design bounded agents around the coordination work that connects trip requests, internal handoffs, and operating records.",
  },
  {
    index: "A2",
    title: "Trip-readiness coordination",
    copy: "Prepare checklists, surface missing information, and route exceptions to the accountable team member.",
  },
  {
    index: "A3",
    title: "Document workflow agents",
    copy: "Organize recurring document requests, status checks, and review queues without replacing required human oversight.",
  },
  {
    index: "A4",
    title: "Crew and customer communications",
    copy: "Prepare consistent, approved communications and maintain context as details change across a trip workflow.",
  },
  {
    index: "A5",
    title: "Operational handoff design",
    copy: "Map who owns each decision, what the agent may prepare, and exactly when the workflow must escalate.",
  },
  {
    index: "A6",
    title: "Specialized aviation agents",
    copy: "Build narrow agentic services around charter-industry processes, trusted sources, and organization-specific rules.",
  },
] as const;

export const serviceProducts = [
  {
    index: "S-01",
    title: "Margin Hawk",
    focus: "Supplier invoice reconciliation",
    status: "In Development",
    copy: "MarginHawk ingests supplier invoices, reconciles every line against the contractor’s price agreements and rolling price history, flags discrepancies, and drafts the dispute email. The owner approves; the agent never disputes autonomously.",
  },
  {
    index: "S-02",
    title: "Second Swing",
    focus: "Estimate follow-up and rehash",
    status: "In Development",
    copy: "SecondSwing imports open and aged estimates and runs a persistent, owner-voiced SMS/email agent that answers questions, handles objections within hard guardrails, and books the job. “Rehash” mode re-attacks estimates 30–365 days old.",
  },
  {
    index: "S-03",
    title: "License Retention",
    focus: "Compliance renewals and CE tracking",
    status: "In Development",
    copy: "Maintains the full compliance inventory and executes renewals: pre-fills forms, tracks CE requirements, prepares filing packets, and submits where portals allow—with the owner approving signatures and payments. Launch hard-capped at 2 states.",
  },
  {
    index: "S-04",
    title: "Visibility IQ",
    focus: "AI assistant visibility and bookability",
    status: "In Development",
    copy: "More consumers are using AI to search for local trade contractors, and those assistants do not use the same search criteria. Visibility IQ solves this with (1) visibility measurement across assistants, (2) done-for-you agent-readiness fixes, and (3) a bookability endpoint—at local-business prices, plus a white-label tier for agencies.",
  },
  {
    index: "S-05",
    title: "Bifrost",
    focus: "Branded MCP server delivery",
    status: "In Development",
    copy: "Bifrost is productized MCP-server-as-a-service: design, build, host, secure, monitor, and maintain the vendor’s official branded MCP server on the 2026 canonical stack—streamable HTTP, OAuth 2.1 with audience binding, edge runtime, and one-click connector install. Subscription-priced and delivered in 30 days.",
  },
  {
    index: "S-06",
    title: "Asgard",
    focus: "Owner oversight and audit trails",
    status: "In Development",
    copy: "Asgard is the owner’s console: inventory and spend, plain-English activity digests, flagged-conversation review, and exportable audit trails—“the performance review your AI employees never get.”",
  },
] as const;

export const aviationProducts = [
  {
    index: "A-01",
    title: "Valkyrie 135",
    focus: "Charter operations tracking",
    status: "Available for Testing",
    copy: "Tracking software being developed for charter-industry workflows, with human ownership of operational and regulatory decisions.",
    url: "https://valkyrie.dreki-solutions.com",
  },
  {
    index: "A-02",
    title: "Skyfar",
    focus: "Empty-leg trip discovery",
    status: "In Development",
    copy: "Skyfar is a mobile application that finds empty-leg trips on private jets and offers them at a fraction of the normal cost. Empty legs are typically an expense to the operator; Skyfar helps operators recover part of that cost while giving travelers access to otherwise unused capacity.",
  },
  {
    index: "A-03",
    title: "Declare Ready",
    focus: "Agentic safety management",
    status: "In Development",
    copy: "DeclareReady is an agentic SMS: it drafts the policy, runs SRM on every hazard report, generates safety-assurance artifacts, keeps the promotion cadence, and maintains the evidence binder—the accountable executive approves.",
  },
  {
    index: "A-04",
    title: "Squawk Sheet AD",
    focus: "Airworthiness directive reconciliation",
    status: "In Development",
    copy: "SquawkSheet AD reads photographed logbooks, pulls current ADs from FAA DRS, reconciles compliance history entry-by-entry, and outputs an IA-ready AD status report, recurring-AD due list, discrepancy list, and draft logbook entry. The IA reviews, corrects, and signs—research automated, authority human.",
  },
  {
    index: "A-05",
    title: "Trend Sentinel",
    focus: "Engine trend monitoring and reporting",
    status: "In Development",
    copy: "TurbineTells ingests whatever trend data the fleet produces, normalizes it per engine, watches drift, and turns anomalies into plain-English draft advisories and the monthly trend report the DOM signs—vigilance and reporting, not physics models or grounding calls.",
  },
  {
    index: "A-06",
    title: "Rotor Log",
    focus: "Drone maintenance records",
    status: "In Development",
    copy: "RotorLog is aviation-grade maintenance records sized for drones, with an agentic layer that maps manufacturer bulletins to affected fleet aircraft—the drone world’s AD management, built by an A&P.",
  },
] as const;

export const portfolioProjects = [
  {
    index: "P-01",
    title: "Project Demo 01",
    focus: "Service operations",
    status: "Demo slot",
    copy: "Reserved for a customer-response or service-operations demonstration with approved project context.",
  },
  {
    index: "P-02",
    title: "Project Demo 02",
    focus: "Workflow coordination",
    status: "Demo slot",
    copy: "Reserved for an agentic workflow demonstration covering handoffs, checkpoints, and human escalation.",
  },
  {
    index: "P-03",
    title: "Project Demo 03",
    focus: "Intake and scheduling",
    status: "Demo slot",
    copy: "Reserved for an intake, preparation, or scheduling project once the demonstration is approved for display.",
  },
  {
    index: "P-04",
    title: "Project Demo 04",
    focus: "Content and reputation",
    status: "Demo slot",
    copy: "Reserved for a content or reputation-operations demonstration with clear agent boundaries and approvals.",
  },
  {
    index: "P-05",
    title: "Project Demo 05",
    focus: "Aviation operations",
    status: "Demo slot",
    copy: "Reserved for a specialized aviation workflow demonstration built around accountable human decisions.",
  },
  {
    index: "P-06",
    title: "Project Demo 06",
    focus: "Custom agent system",
    status: "Demo slot",
    copy: "Reserved for a custom system demonstration that shows the operating problem, agent role, and human controls.",
  },
] as const;

export const processSteps = [
  { index: "01", title: "Audit", copy: "Map the workflow, the friction, and the decisions that must stay human." },
  { index: "02", title: "Design", copy: "Define the agent's job, trusted sources, boundaries, and escalation path." },
  { index: "03", title: "Deploy", copy: "Introduce the system through visible checkpoints and controlled responsibility." },
  { index: "04", title: "Optimize", copy: "Review the work, improve the instructions, and adapt as operations change." },
] as const;
