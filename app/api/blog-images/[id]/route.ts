import { ownerSession } from "@/lib/blog/auth";
import { query } from "@/lib/blog/database";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response(null, { status: 404 });
  try {
    const published = await query(
      "SELECT id FROM blog_posts WHERE published IS NOT NULL AND published LIKE $1 LIMIT 1",
      [`%/api/blog-images/${id}%`],
    );
    const issue = published.length
      ? []
      : await query(
          "SELECT post_id FROM newsletter_issues WHERE content LIKE $1 LIMIT 1",
          [`%/api/blog-images/${id}%`],
        );
    if (
      !published.length &&
      !issue.length &&
      !(await ownerSession(request.headers))
    )
      return new Response(null, {
        status: 404,
        headers: { "Cache-Control": "private, no-store" },
      });
    const rows = await query<{ data: Buffer }>(
      "SELECT data FROM blog_images WHERE id=$1",
      [id],
    );
    if (!rows[0]) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(rows[0].data), {
      headers: {
        "Content-Type": "image/webp",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response(null, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
