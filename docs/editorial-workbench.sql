-- Additive production upgrade. Existing draft and published JSON are preserved.
-- Temporarily use the original table-owner role, then restore its membership settings.
GRANT dreki_migration TO postgres WITH SET TRUE;
SET LOCAL ROLE dreki_migration;
ALTER TABLE dreki_blog.blog_posts
  ADD COLUMN kind text NOT NULL DEFAULT 'blog' CHECK (kind IN ('blog','newsletter')),
  ADD COLUMN deleted_at text,
  ADD COLUMN scheduled_at text,
  ADD COLUMN scheduled_content text;
RESET ROLE;
REVOKE dreki_migration FROM postgres GRANTED BY postgres;
CREATE TABLE dreki_blog.blog_revisions (
  id text PRIMARY KEY, post_id text NOT NULL, revision integer NOT NULL,
  content text NOT NULL, saved_at text NOT NULL
);
CREATE UNIQUE INDEX blog_revisions_post ON dreki_blog.blog_revisions(post_id,revision);
CREATE TABLE dreki_blog.newsletter_issues (
  post_id text PRIMARY KEY, content text NOT NULL, created_at text NOT NULL
);
CREATE TABLE dreki_blog.newsletter_deliveries (
  id text PRIMARY KEY, post_id text NOT NULL, email text NOT NULL,
  state text NOT NULL DEFAULT 'pending', attempts integer NOT NULL DEFAULT 0,
  next_at text NOT NULL, first_attempt text, provider_id text, error text,
  UNIQUE(post_id,email)
);
CREATE INDEX newsletter_delivery_queue ON dreki_blog.newsletter_deliveries(state,next_at);
ALTER TABLE dreki_blog.blog_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dreki_blog.newsletter_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE dreki_blog.newsletter_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON dreki_blog.blog_revisions,dreki_blog.newsletter_issues,dreki_blog.newsletter_deliveries FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,DELETE ON dreki_blog.blog_revisions TO dreki_website_blog;
GRANT SELECT,INSERT ON dreki_blog.newsletter_issues TO dreki_website_blog;
GRANT SELECT,INSERT,UPDATE ON dreki_blog.newsletter_deliveries TO dreki_website_blog;
CREATE POLICY private_editorial_server ON dreki_blog.blog_revisions TO dreki_website_blog USING (true) WITH CHECK (true);
CREATE POLICY private_editorial_server ON dreki_blog.newsletter_issues TO dreki_website_blog USING (true) WITH CHECK (true);
CREATE POLICY private_editorial_server ON dreki_blog.newsletter_deliveries TO dreki_website_blog USING (true) WITH CHECK (true);
INSERT INTO dreki_blog.blog_revisions(id,post_id,revision,content,saved_at)
  SELECT gen_random_uuid()::text,id,revision,draft,updated_at FROM dreki_blog.blog_posts;
