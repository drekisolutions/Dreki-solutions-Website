import { isLeadCaptureConfigured } from "@/lib/leads/configuration";
import { getHubSpotLeadDestination } from "@/lib/leads/hubspot";
import { verifyTurnstile } from "@/lib/leads/turnstile";
import { validateLeadPayload } from "@/lib/leads/validation";

const MAX_BODY_BYTES = 16 * 1_024;
const JSON_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
} as const;

class PayloadTooLargeError extends Error {}

function jsonResponse(
  body: { ok: boolean; code?: string },
  status: number,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

async function readBoundedJson(request: Request): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new PayloadTooLargeError();
  }

  if (!request.body) {
    throw new SyntaxError("Missing request body");
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let body = "";

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) {
      break;
    }

    totalBytes += chunk.value.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new PayloadTooLargeError();
    }

    body += decoder.decode(chunk.value, { stream: true });
  }

  body += decoder.decode();
  return JSON.parse(body) as unknown;
}

function getRemoteIp(request: Request): string | undefined {
  const forwardedIp =
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  return forwardedIp &&
    forwardedIp.length <= 64 &&
    /^[0-9a-fA-F:.]+$/u.test(forwardedIp)
    ? forwardedIp
    : undefined;
}

function getPageUri(request: Request, pagePath: string): string {
  const configuredSiteUrl = process.env.SITE_URL?.trim();

  try {
    const baseUrl = new URL(configuredSiteUrl || request.url);
    return new URL(pagePath, baseUrl.origin).toString();
  } catch {
    return new URL(pagePath, request.url).toString();
  }
}

export async function POST(request: Request): Promise<Response> {
  const contentType = request.headers
    .get("content-type")
    ?.split(";")[0]
    ?.trim()
    .toLowerCase();

  if (contentType !== "application/json") {
    return jsonResponse(
      { ok: false, code: "unsupported_media_type" },
      415,
    );
  }

  let payload: unknown;
  try {
    payload = await readBoundedJson(request);
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return jsonResponse({ ok: false, code: "payload_too_large" }, 413);
    }
    return jsonResponse({ ok: false, code: "invalid_submission" }, 400);
  }

  const validated = validateLeadPayload(payload);
  if (!validated.ok) {
    return jsonResponse({ ok: false, code: "invalid_submission" }, 400);
  }

  if (!isLeadCaptureConfigured()) {
    return jsonResponse(
      { ok: false, code: "integration_unavailable" },
      503,
    );
  }

  const destination = getHubSpotLeadDestination();
  if (!destination) {
    return jsonResponse(
      { ok: false, code: "integration_unavailable" },
      503,
    );
  }

  const remoteIp = getRemoteIp(request);
  const verification = await verifyTurnstile(
    validated.data.turnstileToken,
    remoteIp,
    validated.data.submissionId,
  );
  if (!verification.ok) {
    if (verification.kind === "configuration") {
      return jsonResponse(
        { ok: false, code: "integration_unavailable" },
        503,
      );
    }

    return jsonResponse(
      {
        ok: false,
        code:
          verification.kind === "unavailable"
            ? "verification_unavailable"
            : "verification_failed",
      },
      verification.kind === "unavailable" ? 503 : 400,
    );
  }

  const result = await destination.submitLead(validated.data, {
    pageName: "Dreki Solutions strategy call request",
    pageUri: getPageUri(request, validated.data.pagePath),
    ...(remoteIp ? { ipAddress: remoteIp } : {}),
  });

  if (!result.ok) {
    if (result.kind === "configuration") {
      return jsonResponse(
        { ok: false, code: "integration_unavailable" },
        503,
      );
    }

    return jsonResponse(
      {
        ok: false,
        code:
          result.kind === "unavailable"
            ? "delivery_unavailable"
            : "submission_failed",
      },
      result.kind === "unavailable" ? 503 : 502,
    );
  }

  return jsonResponse({ ok: true }, 200);
}
