import { createHmac, timingSafeEqual } from "node:crypto";
import { query, localEditor, withBlogTransaction } from "./database.ts";
import { newsletterHtml } from "./newsletter-template.ts";
import { type ArticleContent, validEmail } from "./model.ts";
export const editorialOrigin = () =>
  process.env.BLOG_AUTH_URL || "https://www.dreki-solutions.ai";
export function unsubscribeToken(
  email: string,
  secret = process.env.BLOG_AUTH_SECRET || "",
) {
  if (secret.length < 32) throw new Error("Newsletter signing is unavailable.");
  return createHmac("sha256", secret)
    .update("newsletter-unsubscribe:" + email.toLowerCase())
    .digest("hex");
}
export function validUnsubscribe(
  email: string,
  token: string,
  secret = process.env.BLOG_AUTH_SECRET || "",
) {
  if (!validEmail(email) || !/^[0-9a-f]{64}$/.test(token)) return false;
  try {
    return timingSafeEqual(
      Buffer.from(token, "hex"),
      Buffer.from(unsubscribeToken(email, secret), "hex"),
    );
  } catch {
    return false;
  }
}
export async function deliverNewsletters(
  options: { send?: typeof fetch; now?: string; pause?: boolean } = {},
) {
  if (localEditor() && !options.send)
    return { sent: 0, skipped: 0, local: true };
  const key = process.env.RESEND_API_KEY,
    from = process.env.BLOG_FROM_EMAIL || process.env.AUDIT_FROM_EMAIL;
  if ((!key || !from) && !options.send)
    return { sent: 0, skipped: 0, configured: false };
  const now = options.now || new Date().toISOString();
  const lease = new Date(Date.parse(now) + 5 * 60000).toISOString();
  // Never retry outside the provider's idempotency window.
  await query(
    "UPDATE newsletter_deliveries SET state='review',error='Delivery needs review; automatic retries stopped to prevent duplicates.' WHERE state IN ('pending','processing') AND first_attempt IS NOT NULL AND first_attempt < $1",
    [new Date(Date.parse(now) - 20 * 3600000).toISOString()],
  );
  const candidates = await query(
    "SELECT id FROM newsletter_deliveries WHERE state IN ('pending','processing') AND next_at <= $1 AND attempts<5 ORDER BY next_at LIMIT 20",
    [now],
  );
  let sent = 0,
    skipped = 0;
  for (const candidate of candidates) {
    const delivery = await withBlogTransaction(async (sql) => {
      const rows = await sql(
        "UPDATE newsletter_deliveries SET state='processing',attempts=attempts+1,next_at=$3,first_attempt=COALESCE(first_attempt,$2) WHERE id=$1 AND state IN ('pending','processing') AND next_at <= $2 AND attempts<5 RETURNING *",
        [String(candidate.id), now, lease],
      );
      return rows[0];
    });
    if (!delivery) continue;
    const issue = (
      await query("SELECT content FROM newsletter_issues WHERE post_id=$1", [
        String(delivery.post_id),
      ])
    )[0];
    const active = (
      await query(
        "SELECT email FROM newsletter_subscribers WHERE email=$1 AND status='subscribed'",
        [String(delivery.email)],
      )
    )[0];
    const edition = (
      await query(
        "SELECT id FROM blog_posts WHERE id=$1 AND deleted_at IS NULL AND published IS NOT NULL",
        [String(delivery.post_id)],
      )
    )[0];
    if (!issue || !active || !edition) {
      await query(
        "UPDATE newsletter_deliveries SET state='skipped',error=NULL WHERE id=$1",
        [String(delivery.id)],
      );
      skipped++;
      continue;
    }
    const content = JSON.parse(String(issue.content)) as ArticleContent;
    const origin = editorialOrigin();
    const unsubscribe = `${origin}/api/newsletter/unsubscribe?email=${encodeURIComponent(String(delivery.email))}&token=${unsubscribeToken(String(delivery.email))}`;
    try {
      const response = await (options.send || fetch)(
        "https://api.resend.com/emails",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key || "test"}`,
            "Content-Type": "application/json",
            "Idempotency-Key": `dreki-newsletter-${delivery.id}`,
          },
          body: JSON.stringify({
            from: from || "test@example.test",
            to: [delivery.email],
            subject: content.title,
            html: newsletterHtml(content, unsubscribe, origin),
            text: `${content.title}\n\n${content.excerpt}\n\n${content.body}\n\nRead online: ${origin}/newsletter/${content.slug}\nUnsubscribe: ${unsubscribe}`,
            headers: {
              "List-Unsubscribe": `<${unsubscribe}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          }),
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!response.ok)
        throw new Error(`Email provider returned ${response.status}.`);
      const result = await response.json();
      if (!result.id)
        throw new Error("Email provider did not acknowledge this message.");
      await query(
        "UPDATE newsletter_deliveries SET state='sent',provider_id=$2,error=NULL WHERE id=$1",
        [String(delivery.id), String(result.id)],
      );
      sent++;
    } catch (error) {
      await query(
        "UPDATE newsletter_deliveries SET state=$2,next_at=$3,error=$4 WHERE id=$1",
        [
          String(delivery.id),
          Number(delivery.attempts) >= 5 ? "review" : "pending",
          lease,
          error instanceof Error
            ? error.message
            : "Delivery was not confirmed.",
        ],
      );
    }
    if (options.pause !== false)
      await new Promise((resolve) => setTimeout(resolve, 600));
  }
  return { sent, skipped, configured: true };
}
