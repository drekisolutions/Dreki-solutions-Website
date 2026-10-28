import { ownerSession } from "@/lib/blog/auth";
import { query } from "@/lib/blog/database";
import { reply } from "@/lib/blog/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    if (!(await ownerSession(request.headers)))
      return reply({ error: "Please sign in." }, 401);
    const subscribers = await query(
      "SELECT email,subscribed_at,consent_version,status FROM newsletter_subscribers ORDER BY subscribed_at DESC LIMIT 5000",
    );
    if (new URL(request.url).searchParams.get("format") === "csv") {
      const cell = (value: unknown) =>
        `"${String(value ?? "")
          .replace(/^[=+@-]/, "'$&")
          .replaceAll('"', '""')}"`;
      const csv = [
        "Email,Subscribed at,Consent version,Status",
        ...subscribers.map((row) =>
          [row.email, row.subscribed_at, row.consent_version, row.status]
            .map(cell)
            .join(","),
        ),
      ].join("\r\n");
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="dreki-newsletter-subscribers.csv"',
          "Cache-Control": "no-store",
        },
      });
    }
    return reply({ subscribers });
  } catch {
    return reply({ error: "Could not load subscribers." }, 503);
  }
}
