import { deliverAuditRequest, isAuditDeliveryConfigured } from "@/lib/audit/delivery";
import { validateAuditRequest } from "@/lib/audit/validation";

const attempts = new Map<string, { count: number; expires: number }>();
const MAX_BYTES = 8_192;
const reply = (status: number, code: string) => Response.json(
  { ok: status === 200, code },
  { status, headers: { "Cache-Control": "no-store" } },
);

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const localPreviewOrigin = process.env.NODE_ENV === "development" && origin &&
    /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin) &&
    new URL(origin).host === request.headers.get("host");
  if (origin && origin !== new URL(request.url).origin && !localPreviewOrigin) return reply(403, "invalid_origin");
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    return reply(415, "invalid_content_type");
  }
  if (Number(request.headers.get("content-length")) > MAX_BYTES) return reply(413, "too_large");
  // Best-effort per-instance throttling; platform firewall limits should also cover this route.
  const now = Date.now();
  for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim().slice(0, 64) || "unknown";
  const entry = attempts.get(ip) ?? { count: 0, expires: now + 600_000 };
  if (entry.count >= 5 || (!attempts.has(ip) && attempts.size >= 10_000)) return reply(429, "rate_limited");
  entry.count++;
  attempts.set(ip, entry);

  let payload: unknown;
  try {
    if (!request.body) return reply(400, "invalid_submission");
    const reader = request.body.getReader();
    const decoder = new TextDecoder();
    let size = 0;
    let body = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        return reply(413, "too_large");
      }
      body += decoder.decode(value, { stream: true });
    }
    payload = JSON.parse(body + decoder.decode());
  } catch {
    return reply(400, "invalid_submission");
  }
  const data = validateAuditRequest(payload);
  if (!data) return reply(400, "invalid_submission");
  if (!isAuditDeliveryConfigured()) return reply(503, "delivery_unavailable");
  if (!(await deliverAuditRequest(data))) return reply(502, "delivery_failed");
  return reply(200, "received");
}
