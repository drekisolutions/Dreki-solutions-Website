import { escapeHtml, richHtml } from "./rich-content.ts";
import type { ArticleContent } from "./model.ts";
export function newsletterHtml(
  content: ArticleContent,
  unsubscribe: string,
  origin = "https://www.dreki-solutions.ai",
) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="margin:0;background:#f3f0e8;color:#252820;font-family:Arial,sans-serif"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(content.excerpt)}</div><table role="presentation" style="width:100%;border-spacing:0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" style="width:100%;max-width:640px;background:#fff;border-spacing:0"><tr><td style="padding:28px"><p style="color:#9b7b3f;letter-spacing:3px;font-size:12px">DREKI / THE DISPATCH</p><h1>${escapeHtml(content.title)}</h1><p style="font-size:18px;color:#5b6253">${escapeHtml(content.excerpt)}</p>${content.imageUrl ? `<img src="${escapeHtml(origin + content.imageUrl)}" alt="${escapeHtml(content.imageAlt)}" width="584" style="width:100%;height:auto"/>` : ""}<div style="font-size:16px;line-height:1.7">${content.richDoc ? richHtml(content.richDoc, origin) : `<p>${escapeHtml(content.body).replace(/\n/g, "<br/>")}</p>`}</div><hr style="border:0;border-top:1px solid #e3e4dc;margin:32px 0"/><p style="font-size:12px;color:#676b61">Dreki Solutions · You subscribed to The Dispatch.<br/><a href="${escapeHtml(origin + "/newsletter/" + content.slug)}">Read the web edition</a> · <a href="${escapeHtml(unsubscribe)}">Unsubscribe</a></p></td></tr></table></td></tr></table></body></html>`;
}
