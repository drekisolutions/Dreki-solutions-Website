import { randomUUID } from "node:crypto";
import { blogConfigured, query } from "./database.ts";
import {
  canPublish,
  type ArticleContent,
  type BlogPost,
  type ArticleSummary,
} from "./model.ts";

export class BlogError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
function fromRow(row: Record<string, unknown>): BlogPost {
  return {
    id: String(row.id),
    draft: JSON.parse(String(row.draft)),
    published: row.published ? JSON.parse(String(row.published)) : null,
    revision: Number(row.revision),
    updatedAt: String(row.updated_at),
    publishedAt: row.published_at ? String(row.published_at) : null,
  };
}
export async function listPosts() {
  return (await query("SELECT * FROM blog_posts ORDER BY updated_at DESC")).map(
    fromRow,
  );
}
export async function publishedPosts(): Promise<ArticleSummary[]> {
  if (!blogConfigured()) return [];
  const rows = await query(
    "SELECT * FROM blog_posts WHERE published IS NOT NULL ORDER BY published_at DESC",
  );
  return rows
    .map(fromRow)
    .map((post) => ({
      ...post.published!,
      id: post.id,
      publishedAt: post.publishedAt!,
    }));
}
export async function publishedPost(slug: string) {
  if (!blogConfigured()) return null;
  const rows = await query(
    "SELECT * FROM blog_posts WHERE slug=$1 AND published IS NOT NULL",
    [slug],
  );
  if (!rows[0]) return null;
  const post = fromRow(rows[0]);
  return { ...post.published!, id: post.id, publishedAt: post.publishedAt! };
}

export async function savePost(
  content: ArticleContent,
  action: "save" | "publish" | "unpublish",
  id: string | null,
  expectedRevision: number,
) {
  if (action === "publish" && !canPublish(content))
    throw new BlogError(
      400,
      "Add a summary and at least 80 characters of article text before publishing.",
    );
  const now = new Date().toISOString();
  const existingRows = id
    ? await query("SELECT * FROM blog_posts WHERE id=$1", [id])
    : [];
  const existing = existingRows[0] ? fromRow(existingRows[0]) : null;
  if (id && !existing) throw new BlogError(404, "This post no longer exists.");
  if (existing?.published && existing.draft.slug !== content.slug)
    throw new BlogError(
      400,
      "Unpublish this article before changing its web address.",
    );
  const published =
    action === "publish"
      ? content
      : action === "unpublish"
        ? null
        : (existing?.published ?? null);
  const publishedAt =
    action === "publish"
      ? (existing?.publishedAt ?? now)
      : action === "unpublish"
        ? null
        : (existing?.publishedAt ?? null);
  try {
    if (!existing) {
      if (expectedRevision !== 0)
        throw new BlogError(
          409,
          "This draft changed. Reload it before saving.",
        );
      const rows = await query(
        "INSERT INTO blog_posts(id,slug,draft,published,revision,updated_at,published_at) VALUES($1,$2,$3,$4,1,$5,$6) RETURNING *",
        [
          randomUUID(),
          content.slug,
          JSON.stringify(content),
          published ? JSON.stringify(published) : null,
          now,
          publishedAt,
        ],
      );
      return fromRow(rows[0]);
    }
    const rows = await query(
      "UPDATE blog_posts SET slug=$1,draft=$2,published=$3,revision=revision+1,updated_at=$4,published_at=$5 WHERE id=$6 AND revision=$7 RETURNING *",
      [
        content.slug,
        JSON.stringify(content),
        published ? JSON.stringify(published) : null,
        now,
        publishedAt,
        existing.id,
        expectedRevision,
      ],
    );
    if (!rows[0])
      throw new BlogError(
        409,
        "This post was changed in another tab or device. Reload it before saving so nothing is overwritten.",
      );
    return fromRow(rows[0]);
  } catch (error) {
    if (error instanceof BlogError) throw error;
    if (
      String((error as { code?: string }).code).includes("CONSTRAINT") ||
      (error as { code?: string }).code === "23505" ||
      (error instanceof Error && error.message.includes("UNIQUE constraint failed: blog_posts.slug"))
    )
      throw new BlogError(
        409,
        "That web address is already used by another article.",
      );
    throw error;
  }
}
