import type { Metadata } from "next";
import TradesHome from "./components/trades/TradesHome";
import { metadataFromRegistry } from "./content-registry";
import { publishedPosts } from "@/lib/blog/store";
import { journalTopics } from "./components/trades/content";
export const metadata: Metadata = metadataFromRegistry("/");
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function HomePage() {
  const posts = await publishedPosts().catch(() => []);
  const articles = posts.length
    ? posts.map((post, index) => ({
        number: String(index + 1).padStart(2, "0"),
        category: post.category,
        title: post.title,
        motif: post.motif,
        href: "/blog/" + post.slug,
      }))
    : journalTopics;
  return <TradesHome articles={articles} />;
}
