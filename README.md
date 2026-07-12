# Dreki Solutions Site

Single-page Sites website for Dreki Solutions LLC, built with Vinext and Next.js.

## Local development

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev
npm run lint
npm test
```

The release has no form backend, database, analytics, or visitor tracking. The
primary contact action opens a prefilled email to Brett at Dreki Solutions.

## Structure

- `app/` contains the server-rendered page and focused client experience.
- `public/brand/` contains approved, optimized Dreki brand assets.
- `tests/rendered-html.test.mjs` validates semantic output, links, metadata,
  schema, and prohibited public positioning.
- `.openai/hosting.json` stores Sites hosting identifiers and declares no D1 or
  R2 resources.
