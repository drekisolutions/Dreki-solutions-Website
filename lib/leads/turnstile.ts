import { fetchWithTimeout } from "./http";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_TIMEOUT_MS = 5_000;

type TurnstileResult =
  | { ok: true }
  | { ok: false; kind: "configuration" | "invalid" | "unavailable" };

interface TurnstileResponse {
  success?: boolean;
  hostname?: string;
  action?: string;
}

function normalizeHostname(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/u, "");
}

export async function verifyTurnstile(
  token: string | undefined,
  remoteIp?: string,
  idempotencyKey?: string,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const expectedHostname =
    process.env.TURNSTILE_EXPECTED_HOSTNAME?.trim();
  const expectedAction = process.env.TURNSTILE_EXPECTED_ACTION?.trim();

  if (!secret || !expectedHostname || !expectedAction) {
    return { ok: false, kind: "configuration" };
  }

  if (!token) {
    return { ok: false, kind: "invalid" };
  }

  const body: Record<string, string> = {
    secret,
    response: token,
    idempotency_key: idempotencyKey ?? crypto.randomUUID(),
  };
  if (remoteIp) {
    body.remoteip = remoteIp;
  }

  try {
    const response = await fetchWithTimeout(
      SITEVERIFY_URL,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
      TURNSTILE_TIMEOUT_MS,
    );

    if (!response.ok) {
      return { ok: false, kind: "unavailable" };
    }

    const result = (await response.json()) as TurnstileResponse;
    if (!result.success) {
      return { ok: false, kind: "invalid" };
    }

    if (
      normalizeHostname(result.hostname ?? "") !==
      normalizeHostname(expectedHostname)
    ) {
      return { ok: false, kind: "invalid" };
    }

    if (result.action !== expectedAction) {
      return { ok: false, kind: "invalid" };
    }

    return { ok: true };
  } catch {
    return { ok: false, kind: "unavailable" };
  }
}
