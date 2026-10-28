# Dreki Editorial

Open `/admin/blog`. Only **brett@dreki-solutions.ai** can sign in. There is no
public account registration. Hosted sign-in uses a single-use email link that
expires after 10 minutes. Sessions expire after eight hours.

## Write and publish

1. Choose **New article**.
2. Enter a title, category, and short summary. The web address fills from the title.
3. Write the article. The optional formatting buttons add headings, bold text,
   italic text, and lists. Use **Preview** to check the finished result.
4. Choose **Save draft** to keep it private.
5. Choose **Publish article** when it is ready. The article page and its carousel
   card are created automatically; no source edit or deployment is needed per post.

Use **Card image** to choose a generated cover for customer response, connected
workflows, tools and craft, or estimates and paperwork. New cards use the chosen
image automatically. These covers are hosted with the website.

Saving a draft of an already-published article preserves the public version.
**Publish changes** replaces that version. **Unpublish** removes the article
from public pages and the carousel while keeping the draft.

If another device saves the same article first, the editor refuses to overwrite
it. Your unsaved text stays in the editor so you can copy it before reloading.
Published web addresses stay fixed until the article is unpublished.

## Newsletter

The black-and-white **Dreki Dispatch** popup appears once per browser session.
Visitors can close it or reopen it from the **Newsletter** footer link.
Subscribers must enter an email address and explicitly consent to the email
newsletter. This consent does not authorize SMS or change the audit form.

**Newsletter subscribers** shows signup dates and consent status. **Export CSV**
downloads the list after checking the owner's session. The application captures
signups; it does not create or send newsletter campaigns automatically. Use the
requested mailing provider for campaigns, honoring removal requests and including
an unsubscribe method in every campaign.

## Local preview

`npm run dev -- --hostname 127.0.0.1 --port 3045` runs Next.js. The older Sites
preview remains available as `npm run dev:sites`.

Local content lives in ignored `.codex-tmp/blog-editor/content.sqlite`.
Initialize the local tables with `npm run blog:setup`. Local mode is enabled only
outside production and is disabled on Vercel. Local sign-in links are written to
ignored `.codex-tmp/blog-editor/local-mail.json`; no email is sent. This mailbox
contains a short-lived sign-in credential and must never be shared or committed.

## One-time hosted activation

This step changes live infrastructure and the site, so complete the owner review
before activating it. Local SQLite is a development adapter, not hosted storage.

Use the existing site's Postgres service, with an isolated `dreki_blog` schema
and preferably a database role restricted to that schema. No Supabase, CMS, or
additional paid service is required by this implementation.

Set these **server-only** environment variables on the hosting project:

- `BLOG_DATABASE_URL`: the verified Postgres connection URL, with write access to
  the isolated blog schema. Do not use a public browser variable.
- `BLOG_AUTH_SECRET`: a fresh cryptographically random secret of at least 32
  characters. Keep it stable across instances so sessions work across devices.
- `BLOG_AUTH_URL`: `https://www.dreki-solutions.ai`.
- `BLOG_FROM_EMAIL`: a sender already verified with Resend; if omitted, the
  existing `AUDIT_FROM_EMAIL` is used.
- `RESEND_API_KEY`: the existing server-side email provider key.

Keep `BLOG_LOCAL_DEV` unset on hosting. Never copy the local sign-in mailbox or
local development secret to production.

Run `scripts/setup-blog.ts --production` in a trusted Node 24 environment with
the hosted variables loaded securely. It creates only `dreki_blog` and the blog,
subscriber, and authentication tables in that schema. It does not edit the site's
voice tables. Review the schema before executing it on production.

Deploy the reviewed site, then verify on two devices: owner email sign-in, draft
save, preview, publish, public card/article, draft edits preserving the public
snapshot, unpublish, newsletter signup, and subscriber export. Verify that
signed-out visitors cannot read drafts or subscribers or write articles.

Existing drafts are not public posts. Public pages and sitemap include only
explicitly published article snapshots.
