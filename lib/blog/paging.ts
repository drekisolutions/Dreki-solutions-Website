export const BLOG_PAGE_SIZE = 12;

export function blogPageNumber(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^[1-9]\d{0,3}$/.test(raw)) return 1;
  return Number(raw);
}

export function blogIndexPath(page: number) {
  return page <= 1 ? "/blog" : `/blog?page=${page}`;
}

export function sliceBlogPage<T>(
  items: readonly T[],
  requestedPage: number,
  pageSize = BLOG_PAGE_SIZE,
) {
  const size = pageSize > 0 ? pageSize : BLOG_PAGE_SIZE;
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const page = Math.min(Math.max(requestedPage, 1), totalPages);
  const start = (page - 1) * size;
  return {
    items: items.slice(start, start + size),
    page,
    totalPages,
    total,
  };
}
