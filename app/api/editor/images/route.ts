import { randomUUID } from "node:crypto";
import { ownerSession } from "@/lib/blog/auth";
import { getDatabase, query } from "@/lib/blog/database";
import { HttpError, reply, requireOrigin } from "@/lib/blog/http";
import { MAX_IMAGE_BYTES, optimizeBlogImage } from "@/lib/blog/images";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    requireOrigin(request);
    if (!(await ownerSession(request.headers))) return reply({ error: "Please sign in." }, 401);
    if (!request.body) throw new HttpError(400, "Choose an image first.");
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.length;
      if (size > MAX_IMAGE_BYTES) { await reader.cancel(); throw new HttpError(413, "Choose an image smaller than 3 MB."); }
      chunks.push(next.value);
    }
    const image = await optimizeBlogImage(Buffer.concat(chunks));
    const id = randomUUID();
    const db = await getDatabase();
    const rows = db.sqlite
      ? db.sqlite.prepare("INSERT INTO blog_images(id,data) SELECT ?,? WHERE (SELECT count(*) FROM blog_images)<1000 RETURNING id").all(id, image)
      : await query("INSERT INTO blog_images(id,data) SELECT $1,decode($2,'base64') WHERE (SELECT count(*) FROM blog_images)<1000 RETURNING id", [id, image.toString("base64")]);
    if (!rows.length) throw new HttpError(409, "Your image library is full. Contact Dreki to review storage.");
    return reply({ imageUrl: `/api/blog-images/${id}` });
  } catch (error) {
    if (error instanceof HttpError) return reply({ error: error.message }, error.status);
    return reply({ error: "The image could not be uploaded. Please try again." }, 503);
  }
}
