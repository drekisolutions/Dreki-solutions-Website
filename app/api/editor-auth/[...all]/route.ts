import { getAuth } from "@/lib/blog/auth";
import { OWNER_EMAIL } from "@/lib/blog/database";
import { HttpError, jsonBody, reply, requireOrigin } from "@/lib/blog/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(request: Request) {
  try {
    const path = new URL(request.url).pathname.replace("/api/editor-auth", "");
    if (
      ![
        "/sign-in/magic-link",
        "/magic-link/verify",
        "/get-session",
        "/sign-out",
        "/ok",
      ].includes(path)
    )
      return reply({ error: "Not found" }, 404);
    if (request.method === "POST") {
      requireOrigin(request);
      if (path === "/sign-in/magic-link") {
        const body = await jsonBody(request.clone(), 2048);
        if (
          typeof body.email !== "string" ||
          body.email.trim().toLowerCase() !== OWNER_EMAIL
        )
          return reply({ status: true });
        if (body.callbackURL !== "/admin/blog")
          return reply({ error: "Invalid return address." }, 400);
      }
    }
    const response = await (await getAuth()).handler(request);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("X-Robots-Tag", "noindex");
    return response;
  } catch (error) {
    if (error instanceof HttpError)
      return reply({ error: error.message }, error.status);
    return reply(
      {
        error:
          "Editor sign-in is not available. Please check the editor setup.",
      },
      503,
    );
  }
}
export const GET = handle;
export const POST = handle;
