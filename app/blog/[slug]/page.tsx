import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publishedPost } from "@/lib/blog/store";
import { absoluteUrl } from "@/app/site-config";
import ArticleBody from "@/app/components/blog/ArticleBody";
import "../blog.css";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await publishedPost(slug);
  if (!post) return { title: "Article not found", robots: { index: false } };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: absoluteUrl(`/blog/${post.slug}`) },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt,
    },
  };
}
export default async function BlogArticle({ params }: Props) {
  const { slug } = await params;
  const post = await publishedPost(slug);
  if (!post) notFound();
  return (
    <main id="main-content" className="blog-article">
      <Link className="blog-back" href="/#journal">
        ← From the workbench
      </Link>
      <header>
        <p className="forge-kicker">{post.category} / DREKI FIELD NOTES</p>
        <h1>{post.title}</h1>
        <p className="blog-excerpt">{post.excerpt}</p>
        <div className="blog-byline">
          Dreki Solutions ·{" "}
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              timeZone: "America/New_York",
            })}
          </time>
        </div>
      </header>
      <ArticleBody body={post.body} />
      <aside className="blog-article-cta">
        <h2>Put the next idea to work.</h2>
        <p>
          See where your trade business could work better with a free digital
          presence audit.
        </p>
        <Link className="button button-primary" href="/free-audit">
          Get my free audit ↗
        </Link>
      </aside>
    </main>
  );
}
