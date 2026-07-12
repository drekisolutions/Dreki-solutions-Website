import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://dreki-solutions-ops.dreki-solutions.chatgpt.site/sitemap.xml",
  };
}
