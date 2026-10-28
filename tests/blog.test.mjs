import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomBytes } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { validateArticle, canPublish, validEmail } from "../lib/blog/model.ts";
import { HttpError, jsonBody, requireOrigin } from "../lib/blog/http.ts";
import { getDatabase } from "../lib/blog/database.ts";
import {
  listPosts,
  publishedPosts,
  publishedPost,
  savePost,
} from "../lib/blog/store.ts";
import { getAuth, ownerSession } from "../lib/blog/auth.ts";
import { getMigrations } from "better-auth/db/migration";

const directory = resolve(`.codex-tmp/blog-tests-${process.pid}`);
await mkdir(directory, { recursive: true });
process.env.BLOG_LOCAL_DEV = "true";
process.env.NODE_ENV = "test";
process.env.BLOG_LOCAL_DB_PATH = resolve(directory, "test.sqlite");
process.env.BLOG_AUTH_SECRET = randomBytes(48).toString("hex");
process.env.BLOG_AUTH_URL = "http://127.0.0.1:3045";
const article = {
  title: "A clear handoff",
  slug: "a-clear-handoff",
  excerpt: "A practical guide to a clear job handoff.",
  category: "Field notes",
  body: "This local test article explains a clear handoff between the field and the office. The owner reviews the information before the work moves forward.",
  motif: "flow",
};
after(async () => {
  const db = await getDatabase();
  db.sqlite.close();
  await rm(directory, { recursive: true, force: true });
});

test("validates article addresses and bounded writing fields", () => {
  assert.ok(validateArticle(article));
  for (const slug of [
    "../admin",
    "javascript:alert(1)",
    "UPPER CASE",
    "<script>",
    "",
  ])
    assert.equal(validateArticle({ ...article, slug }), null);
  assert.equal(validateArticle({ ...article, title: "x".repeat(141) }), null);
  assert.equal(validateArticle({ ...article, body: "x".repeat(60001) }), null);
  assert.equal(canPublish({ ...article, body: "short" }), false);
  assert.equal(validEmail(" Owner@Example.com "), "owner@example.com");
  assert.equal(validEmail("person@example.com\r\nBCC:other@example.com"), null);
});

test("keeps drafts private, publishes snapshots, and prevents conflicting writes", async () => {
  const draft = await savePost(article, "save", null, 0);
  assert.equal((await listPosts()).length, 1);
  assert.equal((await publishedPosts()).length, 0);
  assert.equal(await publishedPost(article.slug), null);
  const published = await savePost(
    article,
    "publish",
    draft.id,
    draft.revision,
  );
  assert.equal((await publishedPost(article.slug)).body, article.body);
  const revised = {
    ...article,
    body: article.body + " A private new paragraph.",
  };
  const saved = await savePost(
    revised,
    "save",
    published.id,
    published.revision,
  );
  assert.equal(
    (await publishedPost(article.slug)).body,
    article.body,
    "saving must not silently replace the public article",
  );
  await assert.rejects(
    savePost(revised, "save", published.id, published.revision),
    (error) => error.status === 409,
  );
  await assert.rejects(
    savePost(article, "save", null, 0),
    (error) => error.status === 409,
  );
  const removed = await savePost(
    revised,
    "unpublish",
    saved.id,
    saved.revision,
  );
  assert.equal(await publishedPost(article.slug), null);
  assert.equal((await listPosts())[0].draft.body, revised.body);
  assert.equal(removed.published, null);
});

test("rejects foreign origins and oversized request bodies", async () => {
  assert.throws(
    () =>
      requireOrigin(
        new Request("http://127.0.0.1:3045/api/editor/posts", {
          headers: { origin: "https://attacker.invalid" },
        }),
      ),
    (error) => error instanceof HttpError && error.status === 403,
  );
  assert.throws(
    () => requireOrigin(new Request("http://127.0.0.1:3045/api/editor/posts")),
    (error) => error.status === 403,
  );
  await assert.rejects(
    jsonBody(
      new Request("http://127.0.0.1:3045/api/editor/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: "x".repeat(500) }),
      }),
      100,
    ),
    (error) => error.status === 413,
  );
});

test("fails closed for forged sessions and non-owner sign-ins", async () => {
  const auth = await getAuth();
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
  assert.equal(await ownerSession(new Headers()), null);
  assert.equal(
    await ownerSession(
      new Headers({ cookie: "better-auth.session_token=forged" }),
    ),
    null,
  );
  await assert.rejects(
    auth.api.signInMagicLink({
      body: { email: "intruder@example.test", callbackURL: "/admin/blog" },
    }),
  );
});
