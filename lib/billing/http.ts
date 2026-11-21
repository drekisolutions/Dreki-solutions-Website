import { createHash } from "node:crypto";
import { query } from "../blog/database.ts";
export { requireOrigin, jsonBody, reply, HttpError } from "../blog/http.ts";
export async function billingLimit(
  request: Request,
  purpose: string,
  limit = 10,
) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 30 * 60000).toISOString();
  const bucket =
    "billing/" + purpose + "/" + createHash("sha256").update(ip).digest("hex");
  const rows = await query(
    "INSERT INTO newsletter_limits(bucket,count,expires) VALUES($1,1,$3) ON CONFLICT(bucket) DO UPDATE SET count=CASE WHEN newsletter_limits.expires <= $2 THEN 1 ELSE newsletter_limits.count+1 END,expires=CASE WHEN newsletter_limits.expires <= $2 THEN $3 ELSE newsletter_limits.expires END RETURNING count",
    [bucket, now, expires],
  );
  return Number(rows[0]?.count) <= limit;
}
