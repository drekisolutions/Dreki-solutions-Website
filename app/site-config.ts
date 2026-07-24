const productionSiteUrl = "https://www.dreki-solutions.ai";

function normalizeSiteUrl(value: string | undefined) {
  if (!value) return productionSiteUrl;

  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return productionSiteUrl;
  }
}

function normalizeMeetingUrl(value: string | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export const siteConfig = {
  name: "Dreki Solutions",
  legalName: "Dreki Solutions LLC",
  siteUrl: normalizeSiteUrl(
    process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL,
  ),
  primaryAudience: "Service businesses",
  primaryAction: {
    label: "Book a Strategy Call",
    href: "/contact#consultation",
  },
  meetingUrl: normalizeMeetingUrl(
    process.env.NEXT_PUBLIC_HUBSPOT_MEETING_URL?.trim(),
  ),
} as const;

export function absoluteUrl(path = "/") {
  return new URL(path, `${siteConfig.siteUrl}/`).toString();
}
