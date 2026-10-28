export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
export function requireOrigin(request: Request) {
  const expected = new URL(process.env.BLOG_AUTH_URL || request.url).origin;
  if (request.headers.get("origin") !== expected)
    throw new HttpError(403, "This request must come from this website.");
}
export async function jsonBody(
  request: Request,
  max = 100000,
): Promise<Record<string, unknown>> {
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  )
    throw new HttpError(415, "A JSON request is required.");
  if (!request.body) throw new HttpError(400, "Missing request.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    size += next.value.byteLength;
    if (size > max) {
      await reader.cancel();
      throw new HttpError(413, "This request is too large.");
    }
    chunks.push(next.value);
  }
  const joined = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    const data = JSON.parse(new TextDecoder().decode(joined));
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw new Error();
    return data;
  } catch {
    throw new HttpError(400, "Invalid request.");
  }
}
export const reply = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
