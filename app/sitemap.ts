import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "services", "products", "about", "portfolio", "contact"];
  const siteUrl = "https://dreki-solutions-ops.dreki-solutions.chatgpt.site";

  return routes.map((route, index) => ({
    url: `${siteUrl}/${route}`,
    changeFrequency: "monthly",
    priority: index === 0 ? 1 : 0.8,
  }));
}
