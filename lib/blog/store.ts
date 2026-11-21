import { randomUUID } from "node:crypto";
import { blogConfigured, query, withBlogTransaction } from "./database.ts";
import {
  canPublish,
  validateArticle,
  type ArticleContent,
  type BlogPost,
  type ArticleSummary,
} from "./model.ts";

export class BlogError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
const fromRow = (r: Record<string, unknown>): BlogPost => ({
  id: String(r.id),
  draft: JSON.parse(String(r.draft)),
  published: r.published ? JSON.parse(String(r.published)) : null,
  revision: Number(r.revision),
  updatedAt: String(r.updated_at),
  publishedAt: r.published_at ? String(r.published_at) : null,
  kind: r.kind === "newsletter" ? "newsletter" : "blog",
  deletedAt: r.deleted_at ? String(r.deleted_at) : null,
  scheduledAt: r.scheduled_at ? String(r.scheduled_at) : null,
  newsletterSent: Boolean(r.newsletter_sent),
});
export async function listPosts(includeTrash = false) {
  return (
    await query(
      `SELECT p.*, (SELECT count(*) FROM newsletter_issues n WHERE n.post_id=p.id) as newsletter_sent FROM blog_posts p ${includeTrash ? "" : "WHERE deleted_at IS NULL"} ORDER BY updated_at DESC`,
    )
  ).map(fromRow);
}
export async function publishedPosts(kind = "blog"): Promise<ArticleSummary[]> {
  if (!blogConfigured()) return [];
  return (
    await query(
      "SELECT * FROM blog_posts WHERE published IS NOT NULL AND deleted_at IS NULL AND kind=$1 ORDER BY published_at DESC",
      [kind],
    )
  )
    .map(fromRow)
    .map((p) => ({ ...p.published!, id: p.id, publishedAt: p.publishedAt! }));
}
export async function publishedPost(slug: string, kind = "blog") {
  if (!blogConfigured()) return null;
  const rows = await query(
    "SELECT * FROM blog_posts WHERE slug=$1 AND published IS NOT NULL AND deleted_at IS NULL AND kind=$2",
    [slug, kind],
  );
  if (!rows[0]) return null;
  const p = fromRow(rows[0]);
  return { ...p.published!, id: p.id, publishedAt: p.publishedAt! };
}
async function remember(sql: typeof query, row: Record<string, unknown>) {
  await sql(
    "INSERT INTO blog_revisions(id,post_id,revision,content,saved_at) VALUES($1,$2,$3,$4,$5) ON CONFLICT(post_id,revision) DO NOTHING",
    [
      randomUUID(),
      String(row.id),
      Number(row.revision),
      String(row.draft),
      String(row.updated_at),
    ],
  );
  await sql(
    "DELETE FROM blog_revisions WHERE post_id=$1 AND id NOT IN (SELECT id FROM blog_revisions WHERE post_id=$1 ORDER BY revision DESC LIMIT 100)",
    [String(row.id)],
  );
}
export async function queueNewsletter(
  sql: typeof query,
  id: string,
  content: ArticleContent,
  now: string,
) {
  const issue = await sql(
    "INSERT INTO newsletter_issues(post_id,content,created_at) VALUES($1,$2,$3) ON CONFLICT(post_id) DO NOTHING RETURNING post_id",
    [id, JSON.stringify(content), now],
  );
  if (issue.length) {
    const recipients = await sql(
      "SELECT email FROM newsletter_subscribers WHERE status='subscribed' ORDER BY email",
    );
    for (let start = 0; start < recipients.length; start += 100) {
      const params: string[] = [];
      const values = recipients.slice(start, start + 100).map((r) => {
        const at = params.length;
        params.push(randomUUID(), id, String(r.email), now);
        return `($${at + 1},$${at + 2},$${at + 3},'pending',0,$${at + 4})`;
      });
      await sql(
        `INSERT INTO newsletter_deliveries(id,post_id,email,state,attempts,next_at) VALUES ${values.join(",")} ON CONFLICT(post_id,email) DO NOTHING`,
        params,
      );
    }
  }
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
  try {
    return await withBlogTransaction(async (sql) => {
      const now = new Date().toISOString();
      const rows = id
        ? await sql("SELECT * FROM blog_posts WHERE id=$1", [id])
        : [];
      const previous = rows[0] ? fromRow(rows[0]) : null;
      if (id && (!previous || previous.deletedAt))
        throw new BlogError(404, "This item is in Trash or no longer exists.");
      if (previous && previous.revision !== expectedRevision)
        throw new BlogError(
          409,
          "This item changed on another device. Reload it before saving. Your writing is still here.",
        );
      if (previous?.published && previous.draft.slug !== content.slug)
        throw new BlogError(400, "Unpublish before changing the web address.");
      if (previous?.scheduledAt && previous.draft.slug !== content.slug)
        throw new BlogError(
          400,
          "Cancel the scheduled publication before changing the web address.",
        );
      if (previous && (content.kind || "blog") !== previous.kind)
        throw new BlogError(
          400,
          "The content type cannot change after saving.",
        );
      if (rows[0]) await remember(sql, rows[0]);
      const published =
        action === "publish"
          ? content
          : action === "unpublish"
            ? null
            : (previous?.published ?? null);
      const publishedAt =
        action === "publish"
          ? (previous?.publishedAt ?? now)
          : action === "unpublish"
            ? null
            : (previous?.publishedAt ?? null);
      const nextId = id || randomUUID();
      let updated;
      if (!previous) {
        if (expectedRevision !== 0)
          throw new BlogError(409, "Reload this draft before saving.");
        updated = await sql(
          "INSERT INTO blog_posts(id,slug,draft,published,revision,updated_at,published_at,kind) VALUES($1,$2,$3,$4,1,$5,$6,$7) RETURNING *",
          [
            nextId,
            content.slug,
            JSON.stringify(content),
            published ? JSON.stringify(published) : null,
            now,
            publishedAt,
            content.kind || "blog",
          ],
        );
      } else {
        updated = await sql(
          "UPDATE blog_posts SET slug=$1,draft=$2,published=$3,revision=revision+1,updated_at=$4,published_at=$5,scheduled_at=CASE WHEN $8='save' THEN scheduled_at ELSE NULL END,scheduled_content=CASE WHEN $8='save' THEN scheduled_content ELSE NULL END WHERE id=$6 AND revision=$7 AND deleted_at IS NULL RETURNING *",
          [
            content.slug,
            JSON.stringify(content),
            published ? JSON.stringify(published) : null,
            now,
            publishedAt,
            nextId,
            expectedRevision,
            action,
          ],
        );
        if (!updated.length)
          throw new BlogError(
            409,
            "This item changed. Reload it before saving.",
          );
      }
      await remember(sql, updated[0]);
      if (action === "publish" && content.kind === "newsletter")
        await queueNewsletter(sql, nextId, content, now);
      return fromRow({
        ...updated[0],
        newsletter_sent: (
          await sql("SELECT post_id FROM newsletter_issues WHERE post_id=$1", [
            nextId,
          ])
        ).length,
      });
    });
  } catch (error) {
    if (error instanceof BlogError) throw error;
    if (
      (error as { code?: string }).code === "23505" ||
      String((error as { code?: string }).code).includes("CONSTRAINT") ||
      String(error).includes("UNIQUE constraint")
    )
      throw new BlogError(
        409,
        "That web address is already used. Choose another.",
      );
    throw error;
  }
}
export async function deletePost(id: string, revision: number) {
  return withBlogTransaction(async (sql) => {
    const row = (
      await sql(
        "SELECT * FROM blog_posts WHERE id=$1 AND revision=$2 AND deleted_at IS NULL",
        [id, revision],
      )
    )[0];
    if (!row)
      throw new BlogError(
        409,
        "This item changed or was already deleted. Reload before deleting.",
      );
    await remember(sql, row);
    const rows = await sql(
      "UPDATE blog_posts SET deleted_at=$3,published=NULL,published_at=NULL,scheduled_at=NULL,scheduled_content=NULL,revision=revision+1,updated_at=$3 WHERE id=$1 AND revision=$2 AND deleted_at IS NULL RETURNING id",
      [id, revision, new Date().toISOString()],
    );
    if (!rows.length)
      throw new BlogError(409, "This item changed. Reload before deleting.");
  });
}
export async function restorePost(id: string, revision: number) {
  const rows = await query(
    "UPDATE blog_posts SET deleted_at=NULL,revision=revision+1,updated_at=$3 WHERE id=$1 AND revision=$2 AND deleted_at IS NOT NULL RETURNING *",
    [id, revision, new Date().toISOString()],
  );
  if (!rows.length)
    throw new BlogError(409, "This item changed. Reload Trash.");
  return fromRow({
    ...rows[0],
    newsletter_sent: (
      await query("SELECT post_id FROM newsletter_issues WHERE post_id=$1", [
        id,
      ])
    ).length,
  });
}
export async function purgePost(id: string, revision: number) {
  return withBlogTransaction(async (sql) => {
    const rows = await sql(
      "DELETE FROM blog_posts WHERE id=$1 AND revision=$2 AND deleted_at IS NOT NULL RETURNING id",
      [id, revision],
    );
    if (!rows.length)
      throw new BlogError(
        409,
        "Only an unchanged item in Trash can be permanently deleted.",
      );
    await sql("DELETE FROM blog_revisions WHERE post_id=$1", [id]);
  });
}
export async function revisions(id: string) {
  return await query(
    "SELECT id,revision,content,saved_at FROM blog_revisions WHERE post_id=$1 ORDER BY revision DESC LIMIT 100",
    [id],
  );
}
export async function restoreRevision(
  id: string,
  revision: number,
  historyId: string,
) {
  const rows = await query(
    "SELECT content FROM blog_revisions WHERE id=$1 AND post_id=$2",
    [historyId, id],
  );
  const content = rows[0]
    ? validateArticle(JSON.parse(String(rows[0].content)))
    : null;
  if (!content) throw new BlogError(404, "That revision is unavailable.");
  return savePost(content, "save", id, revision);
}
export async function schedulePost(
  id: string,
  revision: number,
  when: string | null,
) {
  if (
    when &&
    (!Number.isFinite(Date.parse(when)) ||
      Date.parse(when) < Date.now() + 60000 ||
      Date.parse(when) > Date.now() + 366 * 86400000)
  )
    throw new BlogError(
      400,
      "Choose a time at least one minute ahead and within one year.",
    );
  const existing = (
    await query(
      "SELECT * FROM blog_posts WHERE id=$1 AND revision=$2 AND deleted_at IS NULL",
      [id, revision],
    )
  )[0];
  if (!existing)
    throw new BlogError(409, "This draft changed. Reload before scheduling.");
  const content = validateArticle(JSON.parse(String(existing.draft)));
  if (when && (!content || !canPublish(content)))
    throw new BlogError(
      400,
      "Finish the title, summary, and article before scheduling.",
    );
  const rows = await query(
    "UPDATE blog_posts SET scheduled_at=$3,scheduled_content=$4,revision=revision+1,updated_at=$5 WHERE id=$1 AND revision=$2 AND deleted_at IS NULL RETURNING *",
    [
      id,
      revision,
      when ? new Date(when).toISOString() : null,
      when ? String(existing.draft) : null,
      new Date().toISOString(),
    ],
  );
  if (!rows.length)
    throw new BlogError(409, "This draft changed. Reload before scheduling.");
  return fromRow({
    ...rows[0],
    newsletter_sent: (
      await query("SELECT post_id FROM newsletter_issues WHERE post_id=$1", [
        id,
      ])
    ).length,
  });
}
export async function publishDue(now = new Date().toISOString()) {
  const due = await query(
    "SELECT id,revision FROM blog_posts WHERE scheduled_at IS NOT NULL AND scheduled_at <= $1 AND deleted_at IS NULL ORDER BY scheduled_at LIMIT 20",
    [now],
  );
  let count = 0;
  for (const item of due)
    await withBlogTransaction(async (sql) => {
      const rows = await sql(
        "UPDATE blog_posts SET published=scheduled_content,published_at=COALESCE(published_at,scheduled_at),scheduled_at=NULL,revision=revision+1,updated_at=$3 WHERE id=$1 AND revision=$2 AND scheduled_at IS NOT NULL AND deleted_at IS NULL RETURNING *",
        [String(item.id), Number(item.revision), now],
      );
      if (!rows.length) return;
      const content = validateArticle(JSON.parse(String(rows[0].published)));
      if (!content) throw new BlogError(400, "Scheduled content is invalid.");
      await sql("UPDATE blog_posts SET scheduled_content=NULL WHERE id=$1", [
        String(item.id),
      ]);
      if (content.kind === "newsletter")
        await queueNewsletter(sql, String(item.id), content, now);
      count++;
    });
  return count;
}
