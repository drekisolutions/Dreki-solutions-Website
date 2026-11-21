import { HttpError } from "./http.ts";
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
export async function optimizeBlogImage(input: Uint8Array) {
  if (!input.length || input.length > MAX_IMAGE_BYTES)
    throw new HttpError(413, "Choose an image smaller than 3 MB.");
  try {
    const { default: sharp } = await import("sharp");
    const image = sharp(input, { limitInputPixels: 40000000, animated: false });
    const metadata = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format || "") || (metadata.pages || 1) > 1)
      throw new Error("Unsupported image");
    return await image.rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
  } catch {
    throw new HttpError(400, "Choose a valid JPG, PNG, or WebP image (up to 40 megapixels).");
  }
}
