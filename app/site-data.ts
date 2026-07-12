export const contact = {
  email: "Brett@dreki-solutions.com",
  phoneDisplay: "(602) 677-5926",
  phoneHref: "tel:+16026775926",
} as const;

export const navigation = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
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

const serviceProductFocus = [
  "Customer response",
  "Reputation operations",
  "Content operations",
  "Intake and scheduling",
  "Workflow coordination",
  "Recurring administration",
] as const;

export const serviceProducts = serviceProductFocus.map((focus, index) => ({
  index: `S-${String(index + 1).padStart(2, "0")}`,
  title: `Service Product ${String(index + 1).padStart(2, "0")}`,
  focus,
  status: "Reserved",
  copy: `A reserved product position for ${focus.toLowerCase()} workflows. Scope and release details will be published when approved.`,
}));

export const aviationProducts = [
  {
    index: "A-01",
    title: "Valkyrie 135",
    focus: "Charter operations tracking",
    status: "In development",
    copy: "Tracking software being developed for charter-industry workflows, with human ownership of operational and regulatory decisions.",
  },
  {
    index: "A-02",
    title: "Aviation Product 02",
    focus: "Trip readiness",
    status: "Reserved",
    copy: "A reserved product position for trip-readiness coordination. Scope and release details will follow approval.",
  },
  {
    index: "A-03",
    title: "Aviation Product 03",
    focus: "Document flows",
    status: "Reserved",
    copy: "A reserved product position for recurring aviation document workflows and accountable review queues.",
  },
  {
    index: "A-04",
    title: "Aviation Product 04",
    focus: "Crew coordination",
    status: "Reserved",
    copy: "A reserved product position for crew coordination workflows. No release claims are being made at this stage.",
  },
  {
    index: "A-05",
    title: "Aviation Product 05",
    focus: "Customer communications",
    status: "Reserved",
    copy: "A reserved product position for approved charter customer communications and context continuity.",
  },
  {
    index: "A-06",
    title: "Aviation Product 06",
    focus: "Operations intelligence",
    status: "Reserved",
    copy: "A reserved product position for organization-specific operational visibility and agent-assisted preparation.",
  },
] as const;

export const processSteps = [
  { index: "01", title: "Audit", copy: "Map the workflow, the friction, and the decisions that must stay human." },
  { index: "02", title: "Design", copy: "Define the agent's job, trusted sources, boundaries, and escalation path." },
  { index: "03", title: "Deploy", copy: "Introduce the system through visible checkpoints and controlled responsibility." },
  { index: "04", title: "Optimize", copy: "Review the work, improve the instructions, and adapt as operations change." },
] as const;
