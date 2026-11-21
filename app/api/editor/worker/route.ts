import { timingSafeEqual } from "node:crypto";
import { publishDue } from "@/lib/blog/store";
import { deliverNewsletters } from "@/lib/blog/newsletters";
export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization") || "";
  if (
    !expected ||
    supplied.length !== `Bearer ${expected}`.length ||
    !timingSafeEqual(Buffer.from(supplied), Buffer.from(`Bearer ${expected}`))
  )
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const published = await publishDue();
  const delivery = await deliverNewsletters();
  return Response.json(
    { published, ...delivery },
    { headers: { "Cache-Control": "no-store" } },
  );
}
