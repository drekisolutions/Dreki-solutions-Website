import { ownerSession } from "@/lib/blog/auth";
import { validateArticle } from "@/lib/blog/model";
import { BlogError, listPosts, savePost } from "@/lib/blog/store";
import { HttpError, jsonBody, reply, requireOrigin } from "@/lib/blog/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    if (!(await ownerSession(request.headers)))
      return reply({ error: "Please sign in." }, 401);
    return reply({ posts: await listPosts() });
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
    const content = validateArticle(data.content);
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
