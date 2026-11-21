# Editorial workbench

The owner editor stays at `/admin/blog`, restricted to the verified owner email. Articles and newsletters share the same writing tools. No additional paid editor or email platform was provisioned. Newsletter sends use the existing server-side Resend configuration and count toward that account's normal usage.

## Writing and managing editions

- Visual editing supports headings, emphasis, lists, links, images, undo and redo. Existing Markdown articles load into the visual writer; their published snapshots are preserved until explicitly published again.
- Click an image for 25/50/75/100 percent presets, a 20–100 percent width slider, left/center/right alignment, an accessibility description, and a visible caption. These attributes are persisted in the document, rendered on the website, and used by the email template.
- Drag the grip beside a block to reorder it. Up/down buttons provide a keyboard/touch alternative.
- The image library supports uploads, reuse, article usage labels, and version-history references. Upload limits and private preview rules from `blog-images.md` remain in place.
- Drafts autosave after a 1.8-second pause. Optimistic revisions reject stale writes from another tab or device. Failed saves retain the current writing and pause automatic retries until the owner retries or reloads.
- The latest 100 saved versions per edition can be restored as a new draft revision. Restoration never silently republishes an edition.
- Delete moves an edition to Trash, removes its web publication, and cancels its schedule. Restore returns it as a private draft. A separate confirmation is required for permanent deletion from Trash.
- Search titles/categories, filter by draft/published/scheduled, or duplicate an edition into a new private draft with a distinct web address.
- Desktop/phone previews cover article pages and blog cards. Newsletter previews show the actual email template, with a separate web-edition view. Search and sharing fields update published metadata and sharing images.
- The prepublication check reports missing content/descriptions and inspects up to 20 links. External HEAD requests use validated public DNS addresses pinned to the connection, bounded timeouts, and revalidation on redirects. Private network targets are blocked. Sites that reject HEAD checks are labeled for manual verification.

## Scheduling

Schedules use the device's local date/time and are normalized to UTC on the server. The scheduled document is a frozen snapshot. Subsequent autosaves change the private draft only; schedule again to replace the approved snapshot. Web addresses cannot change while published or scheduled.

Vercel invokes `/api/editor/worker` once per minute using the existing `CRON_SECRET`. The worker publishes up to 20 due editions and processes up to 20 newsletter recipients per tick. Queues or provider retries can delay completion beyond the selected time. The existing voice cron is unchanged.

## Newsletter publication and delivery

The first publication of a newsletter requires an explicit owner confirmation that it will email subscribed readers and publish a web edition at `/newsletter/[slug]`. Scheduling requires the same confirmation. Recipients are captured from active subscriptions when the scheduled edition actually publishes.

Each newsletter edition ID has one immutable email snapshot. Publishing edits updates the web edition without emailing the same edition again. Duplicate the edition to create a new newsletter send. Existing delivery records are not erased by Trash or permanent deletion. Images referenced by issued newsletters remain available so previously sent emails do not break.

Delivery uses per-recipient provider idempotency keys, exclusive leases, and bounded retries. A subscriber who unsubscribes before their message is processed is skipped. Unpublishing or trashing an edition stops its unprocessed messages. After five failed attempts, or 20 hours after the first attempt, the record moves to `review` rather than risk a duplicate outside the provider's idempotency window. The UI's “Accepted by email provider” count means Resend accepted the request; it does not prove inbox placement or that the reader opened it.

Emails include HTML/text versions, a web-edition link, a signed unsubscribe link, and one-click unsubscribe headers. GET displays an unsubscribe confirmation; POST changes the subscription. A new explicit signup can resubscribe the reader. Local development never sends real newsletter mail. Delivery tests inject a simulated provider.

## Storage and release verification

`editorial-workbench.sql` is the additive production migration. It adds edition metadata, revision snapshots, immutable newsletter issues, and delivery queues. New tables have RLS enabled and grant only the editorial runtime role the operations it needs. The temporary table-owner membership is revoked after the schema change.

Production's ten existing draft/published documents retained the same content hash across the migration. Runtime-role insert/update checks passed inside a rolled-back transaction. Security advisors reported no findings. The release suite exercises rich-content validation, snapshots, stale revisions, Trash/restore/purge, scheduling/cancellation, unsubscribe signatures, queue uniqueness, recipient suppression, safe retry expiry, and private-network link rejection. Local HTTP and browser checks cover actual owner sign-in, visual editing, image layouts, autosave, public rendering, metadata, newsletter confirmation, and phone previews.

Deployments require `npm run verify`, then Vercel READY and live route checks. No subscriber campaign is sent as part of deployment verification.
