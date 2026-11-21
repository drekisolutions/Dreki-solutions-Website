export type RichNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: RichNode[];
};
const nodes = new Set([
  "doc",
  "paragraph",
  "text",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "codeBlock",
  "hardBreak",
  "horizontalRule",
  "image",
]);
const marks = new Set([
  "bold",
  "italic",
  "strike",
  "underline",
  "code",
  "link",
]);
export const imagePath = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\/api\/blog-images\/[0-9a-f-]{36}$/.test(value);
export function safeLink(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    value.length > 2000 ||
    /[\u0000-\u0020\\]/.test(value)
  )
    return false;
  return /^\/(?!\/)/.test(value) || /^(https?:|mailto:|tel:)/i.test(value);
}
export function validateRichDoc(input: unknown): RichNode | null {
  let count = 0;
  function visit(value: unknown, depth: number): RichNode {
    if (!value || typeof value !== "object" || depth > 12 || ++count > 3000)
      throw Error();
    const v = value as RichNode;
    if (!nodes.has(v.type)) throw Error();
    const result: RichNode = { type: v.type };
    if (v.type === "text") {
      if (typeof v.text !== "string" || v.text.length > 60000) throw Error();
      result.text = v.text;
    }
    if (v.attrs) {
      result.attrs = {};
      if (["paragraph", "heading"].includes(v.type))
        result.attrs.textAlign = [
          "left",
          "center",
          "right",
          "justify",
        ].includes(String(v.attrs.textAlign))
          ? v.attrs.textAlign
          : "left";
      if (v.type === "heading")
        result.attrs.level = [1, 2, 3].includes(Number(v.attrs.level))
          ? Number(v.attrs.level)
          : 2;
      if (v.type === "orderedList")
        result.attrs.start = Math.max(
          1,
          Math.min(1000, Number(v.attrs.start) || 1),
        );
      if (v.type === "image") {
        if (!imagePath(v.attrs.src)) throw Error();
        result.attrs = {
          src: v.attrs.src,
          width: Math.max(20, Math.min(100, Number(v.attrs.width) || 100)),
          align: ["left", "center", "right"].includes(String(v.attrs.align))
            ? v.attrs.align
            : "center",
          alt: String(v.attrs.alt || "").slice(0, 300),
          caption: String(v.attrs.caption || "").slice(0, 500),
        };
      }
    } else if (v.type === "image") throw Error();
    if (v.marks) {
      if (!Array.isArray(v.marks) || v.marks.length > 8) throw Error();
      result.marks = v.marks.map((m) => {
        if (!marks.has(m.type)) throw Error();
        if (m.type === "link") {
          if (!safeLink(m.attrs?.href)) throw Error();
          return { type: m.type, attrs: { href: m.attrs?.href } };
        }
        return { type: m.type };
      });
    }
    if (v.content) {
      if (!Array.isArray(v.content)) throw Error();
      result.content = v.content.map((c) => visit(c, depth + 1));
    }
    return result;
  }
  try {
    if (JSON.stringify(input).length > 200000) return null;
    const doc = visit(input, 0);
    return doc.type === "doc" ? doc : null;
  } catch {
    return null;
  }
}
export const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function richText(doc: RichNode): string {
  return (
    (doc.text || "") +
    (doc.type === "image"
      ? `\n![${doc.attrs?.alt || ""}](${doc.attrs?.src})\n${doc.attrs?.caption || ""}`
      : "") +
    (doc.content
      ?.map(richText)
      .join(
        ["paragraph", "heading", "doc", "listItem"].includes(doc.type)
          ? "\n"
          : "",
      ) || "")
  );
}
export function imageUrls(doc?: RichNode): string[] {
  return !doc
    ? []
    : [
        ...(doc.type === "image" ? [String(doc.attrs?.src)] : []),
        ...(doc.content?.flatMap(imageUrls) || []),
      ];
}
export function documentLinks(doc?: RichNode): string[] {
  return !doc
    ? []
    : [
        ...(doc.marks
          ?.filter((m) => m.type === "link")
          .map((m) => String(m.attrs?.href)) || []),
        ...(doc.content?.flatMap(documentLinks) || []),
      ];
}
export function richHtml(input: unknown, origin = ""): string {
  const doc = validateRichDoc(input);
  if (!doc) return "";
  const visit = (n: RichNode): string => {
    if (n.type === "text") {
      let html = escapeHtml(n.text);
      for (const m of n.marks || []) {
        const tag = (
          {
            bold: "strong",
            italic: "em",
            strike: "s",
            underline: "u",
            code: "code",
          } as Record<string, string>
        )[m.type];
        html =
          m.type === "link"
            ? `<a href="${escapeHtml(String(m.attrs?.href).startsWith("/") ? origin + m.attrs?.href : m.attrs?.href)}" rel="noopener noreferrer">${html}</a>`
            : `<${tag}>${html}</${tag}>`;
      }
      return html;
    }
    const inner = n.content?.map(visit).join("") || "";
    if (n.type === "doc") return inner;
    if (n.type === "image") {
      const width = Number(n.attrs?.width) || 100;
      const align = n.attrs?.align;
      const margins =
        align === "left"
          ? "0 auto 0 0"
          : align === "right"
            ? "0 0 0 auto"
            : "0 auto";
      return `<figure style="width:${width}%;max-width:100%;margin:${margins};padding:16px 0"><img src="${escapeHtml(origin + n.attrs?.src)}" alt="${escapeHtml(n.attrs?.alt)}" width="${Math.round((600 * width) / 100)}" style="display:block;width:100%;max-width:100%;height:auto;border:0"/>${n.attrs?.caption ? `<figcaption style="font-size:13px;color:#777;text-align:center;margin-top:8px">${escapeHtml(n.attrs.caption)}</figcaption>` : ""}</figure>`;
    }
    if (n.type === "hardBreak") return "<br/>";
    if (n.type === "horizontalRule") return "<hr/>";
    if (n.type === "codeBlock") return `<pre><code>${inner}</code></pre>`;
    const tag =
      n.type === "heading"
        ? `h${n.attrs?.level || 2}`
        : (
            {
              paragraph: "p",
              bulletList: "ul",
              orderedList: "ol",
              listItem: "li",
              blockquote: "blockquote",
            } as Record<string, string>
          )[n.type];
    return `<${tag}${["paragraph", "heading"].includes(n.type) ? ` style="text-align:${n.attrs?.textAlign || "left"}"` : ""}>${inner || (n.type === "paragraph" ? "<br/>" : "")}</${tag}>`;
  };
  return visit(doc);
}
