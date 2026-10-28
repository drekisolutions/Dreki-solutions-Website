import { createHash } from "node:crypto";
import { query } from "@/lib/blog/database";
import { validEmail } from "@/lib/blog/model";
import { HttpError, jsonBody, reply, requireOrigin } from "@/lib/blog/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    requireOrigin(request);
    const data = await jsonBody(request, 2048);
    const email = validEmail(data.email);
    if (!email || data.consent !== true || data.website)
      return reply(
        { error: "Enter your email and agree to receive the newsletter." },
        400,
      );
    const now = new Date().toISOString();
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const bucket = createHash("sha256").update(ip).digest("hex");
    const expires = new Date(Date.now() + 3600000).toISOString();
    await query("DELETE FROM newsletter_limits WHERE expires < $1", [now]);
    const rows = await query(
      "INSERT INTO newsletter_limits(bucket,count,expires) VALUES($1,1,$2) ON CONFLICT(bucket) DO UPDATE SET count=newsletter_limits.count+1 RETURNING count",
      [bucket, expires],
    );
    if (Number(rows[0].count) > 10)
      return reply({ error: "Please wait before trying again." }, 429);
    await query(
      "INSERT INTO newsletter_subscribers(email,subscribed_at,consent_version,status) VALUES($1,$2,$3,'subscribed') ON CONFLICT(email) DO NOTHING",
      [email, now, "dreki-dispatch-2026-10-26"],
    );
    return reply({ ok: true });
  } catch (error) {
    if (error instanceof HttpError)
      return reply({ error: error.message }, error.status);
    return reply(
      { error: "Signup is temporarily unavailable. Please try again later." },
      503,
    );
  }
}
