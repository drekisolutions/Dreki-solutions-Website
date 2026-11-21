export function insertArticleImage(body: string, position: number, imageUrl: string, description: string) {
  const cursor = Math.max(0, Math.min(body.length, position));
  const alt = description.replace(/[\r\n]+/g, " ").replace(/[\\[\]]/g, "\\$&").trim();
  const before = body.slice(0, cursor);
  const after = body.slice(cursor);
  const insertion = `${before && !before.endsWith("\n\n") ? "\n\n" : ""}![${alt}](${imageUrl})\n\n`;
  const text = before + insertion + after;
  return { text, cursor: before.length + insertion.length };
}
