import { query } from "@/lib/blog/database";
import { validUnsubscribe } from "@/lib/blog/newsletters";
import { escapeHtml } from "@/lib/blog/rich-content";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email") || "",
    token = url.searchParams.get("token") || "";
  if (!validUnsubscribe(email, token))
    return new Response("This unsubscribe link is invalid.", { status: 400 });
  return new Response(
    `<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe | Dreki</title><body style="font:18px Arial;background:#131811;color:#f3f0e8;padding:40px"><h1>The Dispatch</h1><p>Stop receiving newsletters from Dreki Solutions?</p><form method="post" action="${escapeHtml(url.pathname + url.search)}"><button style="padding:14px 24px">Unsubscribe</button></form></body></html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    },
  );
}
export async function POST(request: Request) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("email") || "").toLowerCase(),
    token = url.searchParams.get("token") || "";
  if (!validUnsubscribe(email, token))
    return new Response("Invalid unsubscribe link.", { status: 400 });
  await query(
    "UPDATE newsletter_subscribers SET status='unsubscribed' WHERE email=$1",
    [email],
  );
  return new Response("You have been unsubscribed from The Dispatch.", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
