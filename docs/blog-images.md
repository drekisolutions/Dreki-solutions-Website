# Blog cover images

The owner can upload JPG, PNG, or WebP images from the article workspace. The uploaded image appears on the blog card and at the top of the article after publishing. Replacing or removing a draft image does not change the published snapshot until it is published again.

Uploads use the existing private Postgres connection. `dreki_blog.blog_images` stores compressed WebP data; no additional storage service or credentials are required. Source files are limited to 3 MiB and 40 megapixels, and resized to fit 1600 by 1600 pixels. Sharp strips original metadata. SVG and animated images are rejected. The library has a 1,000-image upload guard. Image records are retained when removed from drafts so published snapshots and unsaved work are not broken; storage can be reviewed separately as the library grows.

Only owner sessions with the expected origin can upload. Public image requests succeed only when the image is referenced by a published article. Draft previews require the owner session. Responses disable caching so unpublishing or deleting an article also ends public image access. Runtime database roles have no browser API access; RLS and grants limit image reads/writes to the editorial server role.

Production table setup:

```sql
CREATE TABLE dreki_blog.blog_images (
  id text PRIMARY KEY,
  data bytea NOT NULL CHECK (octet_length(data)<=3145728),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE dreki_blog.blog_images ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON dreki_blog.blog_images FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON dreki_blog.blog_images TO dreki_website_blog;
CREATE POLICY private_editor_images ON dreki_blog.blog_images
  TO dreki_website_blog USING (true) WITH CHECK (true);
```

Validation includes native image decoding/resizing, invalid-file rejection, draft versus published snapshot isolation, and a local HTTP flow covering upload, owner preview, public publication, deletion privacy, and rejected unsigned/foreign-origin requests.

## Images inside articles

The writing toolbar also provides Insert image. Place the cursor in the article, optionally add an image description, then select a file. The editor inserts an image line at that position, preserving surrounding text. Repeat to add multiple images. Preview renders these images at responsive widths. Move or delete the image line to reposition or remove it, then save or publish. Inline images use the same upload limits and draft/public access checks as covers.

