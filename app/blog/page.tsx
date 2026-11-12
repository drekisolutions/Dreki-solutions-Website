import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { metadataFromRegistry } from "@/app/content-registry";
import {
  blogIndexPath,
  blogPageNumber,
  sliceBlogPage,
} from "@/lib/blog/paging";
import { publishedPosts } from "@/lib/blog/store";
import "./blog.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Props = {
  searchParams: Promise<{ page?: string | string[] }>;
};

const loadPublishedIndex = cache(async (requestedPage: number) => {
  const posts = await publishedPosts().catch(() => []);
  return sliceBlogPage(posts, requestedPage);
});

function formatPublishedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const params = await searchParams;
  const view = await loadPublishedIndex(blogPageNumber(params.page));
  const base = metadataFromRegistry("/blog");
  if (view.page <= 1) return base;
  const title = `Field Notes, page ${view.page}`;
  const canonical = blogIndexPath(view.page);
  return {
    ...base,
    title,
    alternates: { canonical },
    openGraph: {
      ...base.openGraph,
      title,
      url: canonical,
    },
    twitter: {
      ...base.twitter,
      title,
    },
    robots: { index: false, follow: true },
  };
}

export default async function BlogIndex({ searchParams }: Props) {
  const params = await searchParams;
  const view = await loadPublishedIndex(blogPageNumber(params.page));
  return (
    <main id="main-content" className="blog-index">
      <header>
        <p className="blog-kicker">Dreki field notes</p>
        <h1>Field notes from the workbench.</h1>
        <p className="blog-excerpt">
          Practical notes on automation and running a trade business. Published
          articles are listed here, newest first.
        </p>
      </header>
      {view.items.length === 0 ? (
        <div className="blog-empty">
          <p>Posts coming soon.</p>
          <p>
            The first field notes are still on the bench. When an article is
            published, it will show up here with its date, a short excerpt, and
            a link to the full note.
          </p>
          <Link className="button button-primary" href="/free-audit">
            Start with a free audit
          </Link>
        </div>
      ) : (
        <ul className="blog-list">
          {view.items.map((post) => (
            <li key={post.id}>
              <article className="blog-card">
                <p className="blog-kicker">{post.category}</p>
                <h2>
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <time dateTime={post.publishedAt}>
                  {formatPublishedDate(post.publishedAt)}
                </time>
                <p className="blog-excerpt">{post.excerpt}</p>
                <Link className="blog-read" href={`/blog/${post.slug}`}>
                  Read article
                </Link>
              </article>
            </li>
          ))}
        </ul>
      )}
      {view.totalPages > 1 ? (
        <nav className="blog-pager" aria-label="Field notes pages">
          {view.page > 1 ? (
            <Link href={blogIndexPath(view.page - 1)}>Newer notes</Link>
          ) : (
            <span>Newest notes</span>
          )}
          <p>
            Page {view.page} of {view.totalPages}
          </p>
          {view.page < view.totalPages ? (
            <Link href={blogIndexPath(view.page + 1)}>Older notes</Link>
          ) : (
            <span>Oldest notes</span>
          )}
        </nav>
      ) : null}
    </main>
  );
}
