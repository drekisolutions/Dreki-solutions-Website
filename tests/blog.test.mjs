import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomBytes } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { validateArticle, canPublish, validEmail } from "../lib/blog/model.ts";
import { HttpError, jsonBody, requireOrigin } from "../lib/blog/http.ts";
import { getDatabase, query } from "../lib/blog/database.ts";
import {
  listPosts,
  publishedPosts,
  publishedPost,
  savePost,
  deletePost,
  restorePost,
  purgePost,
  revisions,
  restoreRevision,
  schedulePost,
  publishDue,
} from "../lib/blog/store.ts";
import { getAuth, ownerSession } from "../lib/blog/auth.ts";
import { getMigrations } from "better-auth/db/migration";
import sharp from "sharp";
import { optimizeBlogImage, MAX_IMAGE_BYTES } from "../lib/blog/images.ts";
import { insertArticleImage } from "../lib/blog/inline-image.ts";
import {
  validateRichDoc,
  richHtml,
  richText,
} from "../lib/blog/rich-content.ts";
import {
  deliverNewsletters,
  validUnsubscribe,
  unsubscribeToken,
} from "../lib/blog/newsletters.ts";
import { publishingChecks, inspectLink } from "../lib/blog/checks.ts";

test("inline images insert at the cursor without losing text and escape descriptions", () => {
  const url = "/api/blog-images/11111111-1111-4111-8111-111111111111";
  const result = insertArticleImage("Before.After.", 7, url, "Tools [ready]");
  assert.equal(
    result.text,
    `Before.\n\n![Tools \\[ready\\]](${url})\n\nAfter.`,
  );
  assert.equal(result.text.slice(result.cursor), "After.");
  assert.ok(insertArticleImage("", 0, url, "").text.startsWith(`![](${url})`));
  const second = insertArticleImage(
    result.text,
    result.text.length,
    url,
    "Second",
  );
  assert.equal(second.text.split(url).length - 1, 2);
});

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

test("image uploads decode and resize actual images and reject invalid files", async () => {
  const input = await sharp({
    create: { width: 2400, height: 1200, channels: 3, background: "#9b7b3f" },
  })
    .png()
    .toBuffer();
  const image = await optimizeBlogImage(input);
  const metadata = await sharp(image).metadata();
  assert.equal(metadata.format, "webp");
  assert.equal(metadata.width, 1600);
  assert.equal(metadata.height, 800);
  await assert.rejects(
    optimizeBlogImage(Buffer.from("<svg>not an upload</svg>")),
    (error) => error.status === 400,
  );
  await assert.rejects(
    optimizeBlogImage(new Uint8Array(MAX_IMAGE_BYTES + 1)),
    (error) => error.status === 413,
  );
});

test("cover images survive saves while arbitrary image URLs are rejected", async () => {
  const imageUrl = "/api/blog-images/11111111-1111-4111-8111-111111111111";
  const content = validateArticle({
    ...article,
    imageUrl,
    imageAlt: "Work in progress",
  });
  assert.equal(content.imageUrl, imageUrl);
  assert.equal(
    validateArticle({ ...article, imageUrl: "https://attacker.invalid/image" }),
    null,
  );
  assert.equal(
    validateArticle({ ...article, imageUrl, imageAlt: "x".repeat(301) }),
    null,
  );
  const post = await savePost(
    { ...content, slug: "image-snapshot-check" },
    "publish",
    null,
    0,
  );
  await savePost(
    { ...post.draft, imageUrl: "", imageAlt: "" },
    "save",
    post.id,
    post.revision,
  );
  assert.equal(
    (await publishedPost("image-snapshot-check")).imageUrl,
    imageUrl,
  );
  await deletePost(post.id, post.revision + 1);
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

test("deletes drafts and published articles without deleting a newer revision", async () => {
  const post = await savePost(
    { ...article, slug: "delete-check" },
    "publish",
    null,
    0,
  );
  const updated = await savePost(post.draft, "save", post.id, post.revision);
  await assert.rejects(
    deletePost(post.id, post.revision),
    (error) => error.status === 409,
  );
  assert.ok(await publishedPost("delete-check"));
  await deletePost(updated.id, updated.revision);
  assert.equal(await publishedPost("delete-check"), null);
  assert.ok(!(await listPosts()).some((item) => item.id === post.id));
  const draft = await savePost(
    { ...article, slug: "delete-draft" },
    "save",
    null,
    0,
  );
  await deletePost(draft.id, draft.revision);
  assert.ok(!(await listPosts()).some((item) => item.id === draft.id));
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

test("rich image attributes are validated and rendered safely for web and email", () => {
  const imageUrl = "/api/blog-images/11111111-1111-4111-8111-111111111111";
  const doc = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "<script>test</script>",
            marks: [{ type: "bold" }],
          },
        ],
      },
      {
        type: "image",
        attrs: {
          src: imageUrl,
          width: 50,
          align: "right",
          alt: 'Tools "ready"',
          caption: "A <caption>",
        },
      },
    ],
  };
  const valid = validateRichDoc(doc);
  assert.ok(valid);
  const html = richHtml(valid, "https://www.dreki-solutions.ai");
  assert.ok(html.includes("width:50%"));
  assert.ok(html.includes("margin:0 0 0 auto"));
  assert.ok(html.includes("https://www.dreki-solutions.ai" + imageUrl));
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;caption&gt;"));
  assert.ok(richText(valid).includes(imageUrl));
  assert.equal(
    validateRichDoc({
      type: "doc",
      content: [{ type: "image", attrs: { src: "javascript:alert(1)" } }],
    }),
    null,
  );
  assert.equal(
    validateRichDoc({
      type: "doc",
      content: [
        {
          type: "text",
          text: "attack",
          marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
        },
      ],
    }),
    null,
  );
  assert.ok(publishingChecks({ ...article, richDoc: valid }).length === 0);
});

test("Trash can restore a private draft and version history preserves published content", async () => {
  let p = await savePost(
    { ...article, slug: "history-and-trash" },
    "publish",
    null,
    0,
  );
  const first = (await revisions(p.id))[0];
  p = await savePost(
    { ...p.draft, title: "A revised headline" },
    "save",
    p.id,
    p.revision,
  );
  p = await restoreRevision(p.id, p.revision, String(first.id));
  assert.equal(p.draft.title, article.title);
  assert.equal(p.published.title, article.title);
  await deletePost(p.id, p.revision);
  assert.equal(await publishedPost("history-and-trash"), null);
  assert.ok((await listPosts(true)).find((x) => x.id === p.id).deletedAt);
  const trashed = (await listPosts(true)).find((x) => x.id === p.id);
  const restored = await restorePost(p.id, trashed.revision);
  assert.equal(restored.published, null);
  assert.equal(restored.deletedAt, null);
  await assert.rejects(
    purgePost(restored.id, restored.revision),
    (e) => e.status === 409,
  );
  await deletePost(restored.id, restored.revision);
  const trash = (await listPosts(true)).find((x) => x.id === p.id);
  await purgePost(trash.id, trash.revision);
  assert.equal(
    (await listPosts(true)).find((x) => x.id === p.id),
    undefined,
  );
  assert.equal((await revisions(p.id)).length, 0);
});

test("scheduled publication freezes the approved snapshot and can be canceled", async () => {
  const when = new Date(Date.now() + 120000).toISOString(),
    after = new Date(Date.now() + 180000).toISOString();
  let p = await savePost(
    { ...article, slug: "scheduled-snapshot" },
    "save",
    null,
    0,
  );
  p = await schedulePost(p.id, p.revision, when);
  p = await savePost(
    { ...p.draft, title: "Later private title" },
    "save",
    p.id,
    p.revision,
  );
  assert.equal(await publishedPost("scheduled-snapshot"), null);
  await publishDue(after);
  assert.equal(
    (await publishedPost("scheduled-snapshot")).title,
    article.title,
  );
  assert.equal(
    (await listPosts()).find((x) => x.id === p.id).draft.title,
    "Later private title",
  );
  assert.equal(await publishDue(after), 0);
  let cancel = await savePost(
    { ...article, slug: "cancel-schedule" },
    "save",
    null,
    0,
  );
  cancel = await schedulePost(cancel.id, cancel.revision, when);
  await schedulePost(cancel.id, cancel.revision, null);
  await publishDue(after);
  assert.equal(await publishedPost("cancel-schedule"), null);
});

test("newsletters queue an immutable edition once and exclude unsubscribed readers", async () => {
  const now = new Date().toISOString();
  for (const [email, status] of [
    ["reader@example.test", "subscribed"],
    ["leaving@example.test", "subscribed"],
    ["unsubscribed@example.test", "unsubscribed"],
  ])
    await query(
      "INSERT INTO newsletter_subscribers(email,subscribed_at,consent_version,status) VALUES($1,$2,'test',$3)",
      [email, now, status],
    );
  let p = await savePost(
    { ...article, kind: "newsletter", slug: "first-dispatch" },
    "publish",
    null,
    0,
  );
  assert.equal(await publishedPost("first-dispatch"), null);
  assert.ok(await publishedPost("first-dispatch", "newsletter"));
  assert.equal(
    (
      await query("SELECT * FROM newsletter_deliveries WHERE post_id=$1", [
        p.id,
      ])
    ).length,
    2,
  );
  p = await savePost(
    { ...p.draft, title: "Updated website title" },
    "publish",
    p.id,
    p.revision,
  );
  assert.equal(
    (
      await query("SELECT * FROM newsletter_deliveries WHERE post_id=$1", [
        p.id,
      ])
    ).length,
    2,
  );
  await query(
    "UPDATE newsletter_subscribers SET status='unsubscribed' WHERE email='leaving@example.test'",
  );
  let sent = 0;
  const keys = [];
  const sender = async (_url, options) => {
    sent++;
    const mail = JSON.parse(options.body);
    assert.equal(mail.to[0], "reader@example.test");
    assert.equal(mail.subject, article.title);
    assert.ok(mail.html.includes("Unsubscribe"));
    assert.ok(mail.headers["List-Unsubscribe"]);
    keys.push(options.headers["Idempotency-Key"]);
    return Response.json({ id: "provider-test-id" });
  };
  const result = await deliverNewsletters({
    send: sender,
    now: new Date(Date.now() + 1000).toISOString(),
    pause: false,
  });
  assert.equal(result.sent, 1);
  assert.equal(result.skipped, 1);
  assert.equal(sent, 1);
  await deliverNewsletters({
    send: sender,
    now: new Date(Date.now() + 2000).toISOString(),
    pause: false,
  });
  assert.equal(sent, 1);
  assert.equal(
    validUnsubscribe(
      "reader@example.test",
      unsubscribeToken("reader@example.test"),
    ),
    true,
  );
  assert.equal(
    validUnsubscribe(
      "someone-else@example.test",
      unsubscribeToken("reader@example.test"),
    ),
    false,
  );
  await query("DELETE FROM newsletter_deliveries WHERE post_id=$1", [p.id]);
  await query("DELETE FROM newsletter_issues WHERE post_id=$1", [p.id]);
  await query("DELETE FROM newsletter_subscribers");
});

test("newsletter retries keep the same idempotency key and stop before its expiry", async () => {
  const now = new Date().toISOString();
  await query(
    "INSERT INTO newsletter_subscribers(email,subscribed_at,consent_version,status) VALUES('retry@example.test',$1,'test','subscribed')",
    [now],
  );
  const p = await savePost(
    { ...article, kind: "newsletter", slug: "retry-dispatch" },
    "publish",
    null,
    0,
  );
  const keys = [];
  const send = async (_url, options) => {
    keys.push(options.headers["Idempotency-Key"]);
    throw Error("Provider timeout");
  };
  await deliverNewsletters({
    send,
    now: new Date(Date.now() + 1000).toISOString(),
    pause: false,
  });
  await deliverNewsletters({
    send,
    now: new Date(Date.now() + 6 * 60000).toISOString(),
    pause: false,
  });
  assert.equal(keys.length, 2);
  assert.equal(keys[0], keys[1]);
  await deliverNewsletters({
    send,
    now: new Date(Date.now() + 21 * 3600000).toISOString(),
    pause: false,
  });
  assert.equal(keys.length, 2);
  assert.equal(
    (
      await query("SELECT state FROM newsletter_deliveries WHERE post_id=$1", [
        p.id,
      ])
    )[0].state,
    "review",
  );
  await query("DELETE FROM newsletter_deliveries WHERE post_id=$1", [p.id]);
  await query("DELETE FROM newsletter_issues WHERE post_id=$1", [p.id]);
  await query("DELETE FROM newsletter_subscribers");
});

test("link checks block private network targets", async () => {
  assert.equal(
    await inspectLink("http://127.0.0.1/admin"),
    "Private network links are not allowed",
  );
  assert.equal(
    await inspectLink("http://169.254.169.254/"),
    "Private network links are not allowed",
  );
  assert.equal(await inspectLink("javascript:alert(1)"), "Invalid link");
});

test("newsletter schedules queue only when due and trashed editions cancel unsent mail", async () => {
  const when = new Date(Date.now() + 120000).toISOString();
  await query(
    "INSERT INTO newsletter_subscribers(email,subscribed_at,consent_version,status) VALUES('scheduled@example.test',$1,'test','subscribed')",
    [new Date().toISOString()],
  );
  let post = await savePost(
    { ...article, kind: "newsletter", slug: "scheduled-dispatch" },
    "save",
    null,
    0,
  );
  post = await schedulePost(post.id, post.revision, when);
  assert.equal(
    (await query("SELECT * FROM newsletter_issues WHERE post_id=$1", [post.id]))
      .length,
    0,
  );
  await publishDue(new Date(Date.now() + 180000).toISOString());
  assert.equal(
    (
      await query("SELECT * FROM newsletter_deliveries WHERE post_id=$1", [
        post.id,
      ])
    ).length,
    1,
  );
  post = (await listPosts()).find((p) => p.id === post.id);
  await deletePost(post.id, post.revision);
  let sent = 0;
  const result = await deliverNewsletters({
    send: async () => {
      sent++;
      return Response.json({ id: "never-send" });
    },
    now: new Date(Date.now() + 181000).toISOString(),
    pause: false,
  });
  assert.equal(sent, 0);
  assert.equal(result.skipped, 1);
  await query("DELETE FROM newsletter_deliveries WHERE post_id=$1", [post.id]);
  await query("DELETE FROM newsletter_issues WHERE post_id=$1", [post.id]);
  await query("DELETE FROM newsletter_subscribers");
});
