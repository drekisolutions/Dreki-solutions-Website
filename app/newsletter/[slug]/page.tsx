import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { publishedPost } from "@/lib/blog/store";
import { absoluteUrl } from "@/app/site-config";
import ArticleBody from "@/app/components/blog/ArticleBody";
import "../../blog/blog.css";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await publishedPost((await params).slug, "newsletter");
  if (!post) return { title: "Edition not found", robots: { index: false } };
  const image = post.socialImage || post.imageUrl;
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    alternates: { canonical: absoluteUrl("/newsletter/" + post.slug) },
    openGraph: {
      type: "article",
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      publishedTime: post.publishedAt,
      ...(image ? { images: [absoluteUrl(image)] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      ...(image ? { images: [absoluteUrl(image)] } : {}),
    },
  };
}
export default async function NewsletterEdition({ params }: Props) {
  const post = await publishedPost((await params).slug, "newsletter");
  if (!post) notFound();
  return (
    <main id="main-content" className="blog-article">
      <Link className="blog-back" href="/newsletter">
        ← The Dispatch archive
      </Link>
      <header>
        <p className="forge-kicker">DREKI / THE DISPATCH</p>
        <h1>{post.title}</h1>
        <p className="blog-excerpt">{post.excerpt}</p>
        <div className="blog-byline">
          Dreki Solutions ·{" "}
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString("en-US", {
              dateStyle: "long",
              timeZone: "America/New_York",
            })}
          </time>
        </div>
      </header>
      {post.imageUrl && (
        <Image
          className="blog-cover"
          src={post.imageUrl}
          alt={post.imageAlt || ""}
          width={1600}
          height={1000}
          unoptimized
        />
      )}
      <ArticleBody body={post.body} richDoc={post.richDoc} />
      <aside className="blog-article-cta">
        <h2>The next edition, in your inbox.</h2>
        <Link href="/#newsletter" className="button button-primary">
          Subscribe to The Dispatch ↗
        </Link>
      </aside>
    </main>
  );
}
