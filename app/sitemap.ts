import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "services", "products", "about", "contact"];

  return routes.map((route, index) => ({
    url: `https://dreki-solutions.com/${route}`,
    changeFrequency: "monthly",
    priority: index === 0 ? 1 : 0.8,
  }));
}
