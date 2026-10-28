import type { MetadataRoute } from "next";
import { contentRegistry } from "./content-registry";
import { absoluteUrl } from "./site-config";
import { publishedPosts } from "@/lib/blog/store";

export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = contentRegistry
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
  const posts = await publishedPosts().catch(() => []);
  return [...pages, ...posts.map(post => ({ url: absoluteUrl(`/blog/${post.slug}`), lastModified: new Date(post.publishedAt), changeFrequency: "monthly" as const, priority: 0.7 }))];
}
