export type ArticleContent = {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  body: string;
  motif: "call" | "flow" | "grid" | "paper";
  imageUrl?: string;
  imageAlt?: string;
};
export type BlogPost = {
  id: string;
  draft: ArticleContent;
  published: ArticleContent | null;
  revision: number;
  updatedAt: string;
  publishedAt: string | null;
};
export type ArticleSummary = ArticleContent & {
  id: string;
  publishedAt: string;
};

export function validateArticle(input: unknown): ArticleContent | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const value = input as Record<string, unknown>;
  const limits = {
    title: 140,
    slug: 100,
    excerpt: 300,
    category: 60,
    body: 60000,
  };
  const result: Record<string, string> = {};
  for (const [key, max] of Object.entries(limits)) {
    const text = value[key];
    if (
      typeof text !== "string" ||
      text.length > max ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)
    )
      return null;
    result[key] = text.trim();
  }
  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result.slug) ||
    !result.title ||
    !result.category
  )
    return null;
  if (!["call", "flow", "grid", "paper"].includes(String(value.motif)))
    return null;
  if (value.imageUrl !== undefined && (typeof value.imageUrl !== "string" ||
      (value.imageUrl !== "" && !/^\/api\/blog-images\/[0-9a-f-]{36}$/.test(value.imageUrl)))) return null;
  if (value.imageAlt !== undefined && (typeof value.imageAlt !== "string" || value.imageAlt.length > 300 || /[\u0000-\u001f]/.test(value.imageAlt))) return null;
  return { ...result, motif: value.motif,
    ...(value.imageUrl ? { imageUrl: value.imageUrl, imageAlt: String(value.imageAlt || "").trim() } : {}),
  } as ArticleContent;
}

export function canPublish(article: ArticleContent) {
  return (
    article.body.trim().length >= 80 && article.excerpt.trim().length >= 10
  );
}

export function validEmail(input: unknown) {
  if (typeof input !== "string" || input.length > 254) return null;
  const email = input.trim().toLowerCase();
  return /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email) ? email : null;
}
