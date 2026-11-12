import assert from "node:assert/strict";
import test from "node:test";

delete process.env.BLOG_DATABASE_URL;
delete process.env.BLOG_LOCAL_DEV;

const { publishedPosts } = await import("../lib/blog/store.ts");
const { blogIndexPath, blogPageNumber, sliceBlogPage } = await import(
  "../lib/blog/paging.ts"
);

test("published posts stay empty when blog storage is not configured", async () => {
  assert.deepEqual(await publishedPosts(), []);
});

test("parses blog page numbers without accepting junk", () => {
  assert.equal(blogPageNumber(undefined), 1);
  assert.equal(blogPageNumber("1"), 1);
  assert.equal(blogPageNumber("12"), 12);
  assert.equal(blogPageNumber(["3", "4"]), 3);
  for (const value of ["0", "-1", "1.5", "nope", "99999", "01", ""]) {
    assert.equal(blogPageNumber(value), 1, value);
  }
});

test("caps each blog index page and keeps the supplied order", () => {
  const posts = Array.from({ length: 30 }, (_, index) => ({
    slug: `note-${String(index).padStart(2, "0")}`,
  }));
  const first = sliceBlogPage(posts, 1);
  assert.equal(first.items.length, 12);
  assert.equal(first.page, 1);
  assert.equal(first.totalPages, 3);
  assert.equal(first.total, 30);
  assert.equal(first.items[0].slug, "note-00");
  assert.equal(first.items.at(-1).slug, "note-11");

  const second = sliceBlogPage(posts, 2);
  assert.equal(second.items[0].slug, "note-12");
  assert.equal(blogIndexPath(second.page), "/blog?page=2");
  assert.equal(blogIndexPath(1), "/blog");

  const last = sliceBlogPage(posts, 99);
  assert.equal(last.page, 3);
  assert.equal(last.items.length, 6);
  assert.equal(last.items[0].slug, "note-24");

  const empty = sliceBlogPage([], 4);
  assert.equal(empty.page, 1);
  assert.equal(empty.totalPages, 1);
  assert.deepEqual(empty.items, []);
});
