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

export const processSteps = [
  { index: "01", title: "Audit", copy: "Review your website, social accounts, and Google Business Profile, and report what to fix first." },
  { index: "02", title: "Plan", copy: "Agree on the brand direction or the month's content calendar before any work starts." },
  { index: "03", title: "Produce", copy: "Create the brand assets or the month's posts and videos for your approval." },
  { index: "04", title: "Publish", copy: "Post on schedule once you approve. Nothing goes out without your say." },
] as const;
