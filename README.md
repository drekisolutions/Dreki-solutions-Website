# Dreki Solutions Site

Single-page Sites website for Dreki Solutions LLC, built with Vinext and Next.js.

## Local development

Requires Node.js `24.x`.

```bash
npm install
npm run dev
npm run lint
npm test
```

`npm run build` creates the standard `.next` output used by Vercel. The
Vinext/Sites build remains available through `npm run build:sites`.

Google Analytics (`G-9NPJ7GQ70H`) loads from the shared root layout on all pages.
Keep enhanced measurement for browser history changes enabled in the Google
Analytics web stream to track navigation between pages. Optional Cloudflare
Web Analytics uses `NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN` when configured.

## Free digital presence audit

`/free-audit` collects owner first/last name, email, company, city, state,
required phone, optional unchecked SMS consent, and a separate required,
unchecked Terms and Privacy Policy agreement. `/api/audit-requests`
sends requests only to `brett@dreki-solutions.ai` using Resend. Configure
server-only `RESEND_API_KEY` and `AUDIT_FROM_EMAIL` (a verified Resend sender).
Success appears only after Resend accepts an email with a message ID.
This form does not enroll contacts in an SMS service or send any texts.

Emails retain the SMS consent choice and wording/version, separate policy
agreement and Terms version, public policy links, and request ID;
email receipt time records when the request arrived. Failed sends preserve
the form. Unchanged retries reuse a Resend idempotency key. Validation,
bounded request bodies, an empty honeypot, and best-effort per-instance
throttling reduce abuse; configure platform rate limits for shared enforcement
across serverless instances if traffic requires it.

## Structure

- `app/` contains the server-rendered page and focused client experience.
- `public/brand/` contains approved, optimized Dreki brand assets.
- `tests/rendered-html.test.mjs` validates semantic output, links, metadata,
  schema, and prohibited public positioning.
- `.openai/hosting.json` stores Sites hosting identifiers and declares no D1 or
  R2 resources.
