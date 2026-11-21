# Website database migration — November 21, 2026

The production website uses the dedicated `dreki-website` Supabase project in Dreki Solutions's Org (US East). The existing BetterAuth owner-only editor remains in use; Supabase Auth does not replace it.

## Configuration

- `BLOG_DATABASE_URL`: private `dreki_website_blog` role, session pooler, database `postgres`, search path `dreki_blog`.
- `VOICE_DATABASE_URL`: separate private `dreki_website_voice` role, session pooler, search path `public`.
- `DATABASE_SSL_CA`: official Supabase database CA in PEM format. Both connections require certificate verification.
- Existing `BLOG_AUTH_SECRET`, Resend settings, and voice service credentials remain unchanged.
- Owner sign-in remains restricted to `brett@dreki-solutions.ai` at `/admin/blog`.

Do not use the legacy Neon-generated `VOICE_POSTGRES_*` or `VOICE_PG*` variables as runtime connections. Do not expose database credentials through public environment variables.

## Verification

All 15 source tables were restored, including 10 published blog posts, editor accounts/session data, newsletter tables, and voice records. Row counts and SHA-256 hashes matched the source. Tables retain their constraints and indexes. All application tables have RLS enabled, deny anonymous/browser access, and allow only their dedicated server role. Security advisors reported no findings.

The real editor storage code passed loading, draft creation, editing, publishing, and unpublishing against Supabase inside a rolled-back transaction. Role isolation and voice transaction/advisory-lock access passed. `npm run verify` passed all 39 tests and production builds.

Production deployment `dpl_DEf3rSTuApqmuJ1P11LmqMYzXnWw` returned READY and was assigned to `www.dreki-solutions.ai`. Public articles returned HTTP 200; signed-out editor posts returned 401, and session lookup returned 200 instead of 503. The live sign-in form successfully requested an owner email link.

Full Neon backups, manifests, and migration verification output are retained locally under `.codex-tmp/neon-migration/` and must never be committed. The original Neon database is retained for recovery. A rollback requires restoring a working Neon plan and its former connection settings; simply redeploying old code would not restore the old environment.
