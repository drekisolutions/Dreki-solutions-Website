import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { publishedPosts } from "@/lib/blog/store";
import { absoluteUrl } from "@/app/site-config";
import "../blog/blog.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "The Dispatch",
  description:
    "Ideas, field notes, and practical next steps from Dreki Solutions.",
  alternates: { canonical: absoluteUrl("/newsletter") },
};
export default async function NewsletterArchive() {
  const posts = await publishedPosts("newsletter");
  return (
    <main id="main-content" className="blog-article">
      <Link className="blog-back" href="/">
        ← Dreki Solutions
      </Link>
      <header>
        <p className="forge-kicker">DREKI / THE DISPATCH</p>
        <h1>The next edition.</h1>
        <p className="blog-excerpt">
          Ideas, field notes, and practical next steps for your business.
        </p>
      </header>
      {posts.length ? (
        posts.map((post) => (
          <article className="dispatch-archive-card" key={post.id}>
            {post.imageUrl && (
              <Image
                className="blog-cover"
                src={post.imageUrl}
                alt={post.imageAlt || ""}
                width={800}
                height={460}
                unoptimized
              />
            )}
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString()}
            </time>
            <h2>
              <Link href={"/newsletter/" + post.slug}>{post.title}</Link>
            </h2>
            <p>{post.excerpt}</p>
          </article>
        ))
      ) : (
        <p>The first edition is on its way.</p>
      )}
      <Link className="button button-primary" href="/#newsletter">
        Subscribe to The Dispatch ↗
      </Link>
    </main>
  );
}
