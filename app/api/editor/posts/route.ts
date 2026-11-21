import { ownerSession } from "@/lib/blog/auth";
import { validateArticle } from "@/lib/blog/model";
import {
  BlogError,
  deletePost,
  listPosts,
  savePost,
  restorePost,
  purgePost,
  revisions,
  restoreRevision,
  schedulePost,
} from "@/lib/blog/store";
import { localEditor, query } from "@/lib/blog/database";
import { checkArticleLinks, publishingChecks } from "@/lib/blog/checks";
import { HttpError, jsonBody, reply, requireOrigin } from "@/lib/blog/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function DELETE(request: Request) {
  try {
    requireOrigin(request);
    if (!(await ownerSession(request.headers)))
      return reply({ error: "Please sign in." }, 401);
    const data = await jsonBody(request, 1000);
    if (
      typeof data.id !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(data.id) ||
      !Number.isSafeInteger(data.revision) ||
      Number(data.revision) < 1
    )
      return reply({ error: "Choose a saved article to delete." }, 400);
    if (data.permanent === true)
      await purgePost(data.id, Number(data.revision));
    else await deletePost(data.id, Number(data.revision));
    return reply({ deleted: true });
  } catch (error) {
    if (error instanceof HttpError || error instanceof BlogError)
      return reply({ error: error.message }, error.status);
    return reply(
      { error: "The article could not be deleted. Please try again." },
      503,
    );
  }
}

export async function GET(request: Request) {
  try {
    if (!(await ownerSession(request.headers)))
      return reply({ error: "Please sign in." }, 401);
    const id = new URL(request.url).searchParams.get("history");
    if (id) return reply({ history: await revisions(id) });
    return reply({
      posts: await listPosts(true),
      subscriberCount: Number(
        (
          await query(
            "SELECT count(*) AS count FROM newsletter_subscribers WHERE status='subscribed'",
          )
        )[0].count,
      ),
      delivery: await query(
        "SELECT post_id,state,count(*) AS count FROM newsletter_deliveries GROUP BY post_id,state",
      ),
      emailReady:
        localEditor() ||
        Boolean(
          process.env.RESEND_API_KEY &&
            (process.env.BLOG_FROM_EMAIL || process.env.AUDIT_FROM_EMAIL),
        ),
      localPreview: localEditor(),
    });
  } catch {
    return reply(
      { error: "The editor could not load your posts. Try again." },
      503,
    );
  }
}
export async function POST(request: Request) {
  try {
    requireOrigin(request);
    if (!(await ownerSession(request.headers)))
      return reply({ error: "Please sign in." }, 401);
    const data = await jsonBody(request);
    if (
      typeof data.id === "string" &&
      /^[0-9a-f-]{36}$/i.test(data.id) &&
      Number.isSafeInteger(data.revision) &&
      Number(data.revision) > 0
    ) {
      if (data.action === "restore")
        return reply({
          post: await restorePost(data.id, Number(data.revision)),
        });
      if (
        data.action === "restoreRevision" &&
        typeof data.historyId === "string"
      )
        return reply({
          post: await restoreRevision(
            data.id,
            Number(data.revision),
            data.historyId,
          ),
        });
      if (data.action === "schedule") {
        const post = (await listPosts()).find((p) => p.id === data.id);
        if (
          post?.kind === "newsletter" &&
          !post.newsletterSent &&
          data.when !== null &&
          data.confirmNewsletter !== true
        )
          return reply(
            { error: "Confirm emailing subscribers before scheduling." },
            400,
          );
        if (
          post?.kind === "newsletter" &&
          !post.newsletterSent &&
          data.when !== null &&
          !localEditor() &&
          (!process.env.RESEND_API_KEY ||
            !(process.env.BLOG_FROM_EMAIL || process.env.AUDIT_FROM_EMAIL))
        )
          return reply(
            { error: "Newsletter email delivery is not configured." },
            503,
          );
        if (data.when !== null && typeof data.when !== "string")
          return reply({ error: "Choose a publication time." }, 400);
        return reply({
          post: await schedulePost(
            data.id,
            Number(data.revision),
            data.when as string | null,
          ),
        });
      }
    }
    const content = validateArticle(data.content);
    if (content && data.action === "check")
      return reply({
        warnings: publishingChecks(content),
        links: await checkArticleLinks(content),
      });
    if (content?.kind === "newsletter" && data.action === "publish") {
      const existing =
        typeof data.id === "string"
          ? (await listPosts()).find((p) => p.id === data.id)
          : null;
      if (!existing?.newsletterSent && data.confirmNewsletter !== true)
        return reply(
          { error: "Confirm emailing subscribers before publishing." },
          400,
        );
      if (
        !localEditor() &&
        (!process.env.RESEND_API_KEY ||
          !(process.env.BLOG_FROM_EMAIL || process.env.AUDIT_FROM_EMAIL))
      )
        return reply(
          { error: "Newsletter email delivery is not configured." },
          503,
        );
    }
    if (
      !content ||
      !["save", "publish", "unpublish"].includes(String(data.action)) ||
      !Number.isSafeInteger(data.revision) ||
      Number(data.revision) < 0 ||
      (data.id !== null &&
        (typeof data.id !== "string" || !/^[0-9a-f-]{36}$/i.test(data.id)))
    )
      return reply(
        { error: "Check the title, web address, and article fields." },
        400,
      );
    const post = await savePost(
      content,
      data.action as "save" | "publish" | "unpublish",
      data.id as string | null,
      data.revision as number,
    );
    return reply({ post });
  } catch (error) {
    if (error instanceof HttpError || error instanceof BlogError)
      return reply({ error: error.message }, error.status);
    return reply(
      {
        error:
          "Your changes could not be saved. The text is still in the editor. Please try again.",
      },
      503,
    );
  }
}
