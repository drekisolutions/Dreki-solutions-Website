import type { MetadataRoute } from "next";
import { contentRegistry } from "./content-registry";
import { absoluteUrl } from "./site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  return contentRegistry
    .filter(
      (entry) =>
        entry.publicationStatus === "published" &&
        entry.indexingStatus === "index",
    )
    .map((entry) => ({
      url: absoluteUrl(entry.route),
      lastModified: new Date(`${entry.updatedDate}T00:00:00.000Z`),
      changeFrequency:
        entry.route === "/"
          ? ("weekly" as const)
          : entry.pageType === "legal"
            ? ("yearly" as const)
            : ("monthly" as const),
      priority:
        entry.route === "/"
          ? 1
          : entry.pageType === "agent" || entry.pageType === "conversion"
            ? 0.9
            : 0.8,
    }));
}
