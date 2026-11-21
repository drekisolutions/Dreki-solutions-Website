import { lookup } from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import { documentLinks, imageUrls, safeLink } from "./rich-content.ts";
import { type ArticleContent } from "./model.ts";
import { query } from "./database.ts";
export function publishingChecks(content: ArticleContent) {
  const warnings: string[] = [];
  if (!content.title.trim()) warnings.push("Add a title.");
  if (!content.excerpt.trim()) warnings.push("Add a short summary.");
  if (content.body.trim().length < 80)
    warnings.push("Add at least 80 characters of article text.");
  if (!content.imageUrl && !imageUrls(content.richDoc).length)
    warnings.push("Consider adding an image.");
  if (content.imageUrl && !content.imageAlt)
    warnings.push("Add a description for the cover image.");
  const walk = (node: NonNullable<ArticleContent["richDoc"]>) => {
    if (node.type === "image" && !node.attrs?.alt)
      warnings.push("An image is missing its accessibility description.");
    node.content?.forEach(walk);
  };
  if (content.richDoc) walk(content.richDoc);
  if (!(content.seoDescription || content.excerpt))
    warnings.push("Add a search description.");
  return [...new Set(warnings)];
}
function publicAddress(address: string) {
  if (address.includes(":"))
    return /^[23][0-9a-f]{3}:/i.test(address) && !/^2001:db8:/i.test(address);
  const n = address.split(".").map(Number);
  return (
    n.length === 4 &&
    n.every((x) => Number.isInteger(x) && x >= 0 && x <= 255) &&
    ![0, 10, 127].includes(n[0]) &&
    n[0] < 224 &&
    !(n[0] === 169 && n[1] === 254) &&
    !(n[0] === 172 && n[1] >= 16 && n[1] <= 31) &&
    !(n[0] === 192 && n[1] === 168) &&
    !(n[0] === 100 && n[1] >= 64 && n[1] <= 127) &&
    !(n[0] === 198 && [18, 19].includes(n[1]))
  );
}
export async function inspectLink(
  href: string,
  remaining = 3,
): Promise<string> {
  if (!safeLink(href)) return "Invalid link";
  if (/^(mailto:|tel:)/i.test(href)) return "OK";
  const origin = process.env.BLOG_AUTH_URL || "https://www.dreki-solutions.ai";
  const url = new URL(href, origin);
  if (url.origin === origin && /^\/(blog|newsletter)\//.test(url.pathname)) {
    const slug = decodeURIComponent(url.pathname.split("/")[2] || "");
    return (
      await query(
        "SELECT id FROM blog_posts WHERE slug=$1 AND kind=$2 AND published IS NOT NULL AND deleted_at IS NULL",
        [slug, url.pathname.startsWith("/newsletter/") ? "newsletter" : "blog"],
      )
    ).length
      ? "OK"
      : "Article is not published";
  }
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    (url.port && !["80", "443"].includes(url.port))
  )
    return "Unsupported link";
  try {
    const addresses = await lookup(url.hostname, { all: true });
    if (!addresses.length || addresses.some((a) => !publicAddress(a.address)))
      return "Private network links are not allowed";
    const resolved = addresses[0];
    const result = await new Promise<{ status: number; location?: string }>(
      (resolve, reject) => {
        const req = (url.protocol === "https:" ? https : http).request(
          url,
          {
            method: "HEAD",
            family: resolved.family,
            headers: { "User-Agent": "Dreki-Link-Check/1.0" },
            lookup: (_host, _opts, callback) =>
              callback(null, resolved.address, resolved.family),
          },
          (response) => {
            response.resume();
            resolve({
              status: response.statusCode || 0,
              location: response.headers.location,
            });
          },
        );
        req.setTimeout(4000, () => req.destroy(new Error("Timed out")));
        req.on("error", reject);
        req.end();
      },
    );
    if (result.status >= 300 && result.status < 400 && result.location)
      return remaining
        ? inspectLink(new URL(result.location, url).toString(), remaining - 1)
        : "Too many redirects";
    return result.status >= 200 && result.status < 400
      ? "OK"
      : [403, 405, 429].includes(result.status)
        ? "Site blocked the check; open to verify"
        : `Link returned ${result.status}`;
  } catch {
    return "Could not reach this link; open to verify";
  }
}
export async function checkArticleLinks(content: ArticleContent) {
  const links = [
    ...new Set([
      ...documentLinks(content.richDoc),
      ...(!content.richDoc
        ? [...content.body.matchAll(/(?<!!)\[[^\]]*\]\(([^\s)]+)\)/g)].map(
            (m) => m[1],
          )
        : []),
    ]),
  ].slice(0, 20);
  return await Promise.all(
    links.map(async (href) => ({ href, result: await inspectLink(href) })),
  );
}
