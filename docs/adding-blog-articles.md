# Add a blog card

The usual no-code workflow is now the private editor at `/admin/blog`.
See [the editor guide](private-editor.md). Publishing there creates an article
page and carousel card automatically. The content-list method below is retained
for planned topics and manually linked references.

Add an entry to `journalTopics` in `app/components/trades/content.ts`:

```ts
{
  number: "05", // Use a unique number for each card.
  category: "Trade operations",
  title: "Your published article title",
  motif: "flow", // call, flow, grid, or paper
  href: "/blog/your-article-slug",
},
```

The URL must point to an article that already exists, either on this site or at
an external HTTPS address. This list creates the card; it does not create the
article page. Omit `href` while drafting to show “Coming soon” instead of a link.

Append more entries as articles are written. No carousel layout or card-count
changes are needed. The looping track and center-card depth use the current
article count automatically. Save to update the local preview; publish through
the normal site release workflow when ready.
