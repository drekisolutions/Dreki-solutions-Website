# Lead flow integration

`LeadForm` posts bounded JSON to `/api/leads`. The route validates and
normalizes the request, verifies Turnstile, and submits the accepted lead to
HubSpot's Forms v3 endpoint.

## Environment variables

Set these in the deployment secret manager. Do not commit real values.

| Variable | Visibility | Required |
| --- | --- | --- |
| `HUBSPOT_PORTAL_ID` | Server only | Yes |
| `HUBSPOT_FORM_ID` | Server only | Yes |
| `HUBSPOT_MARKETING_SUBSCRIPTION_TYPE_ID` | Server only | Required before marketing opt-ins can be accepted |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public | Yes |
| `TURNSTILE_SECRET_KEY` | Server only | Yes |
| `TURNSTILE_EXPECTED_HOSTNAME` | Server only | Yes; use one hostname per environment |
| `TURNSTILE_EXPECTED_ACTION` | Server only | Yes; set to `lead_form` |
| `LEAD_RATE_LIMIT_VERIFIED` | Server only | Yes; set to `true` only after the production firewall rule returns `429` as expected |
| `SITE_URL` | Server only | Recommended for accurate original-page context |

The page keeps the online form disabled and the route returns
`503 integration_unavailable` while any required HubSpot, Turnstile, consent,
or verified firewall setting is missing. Direct email and phone remain
available during setup.

## Page integration

```tsx
import { LeadForm } from "@/app/components/lead-form";

export default function ContactPage() {
  return (
    <LeadForm
      source="contact"
      successHref="/book"
      successLabel="Choose a strategy-call time"
    />
  );
}
```

The component reads `NEXT_PUBLIC_TURNSTILE_SITE_KEY` at build time. It keeps
entered values in the browser after recoverable errors and offers a direct
email fallback without copying personal form data into a URL.

## HubSpot form contract

Add the standard contact fields `firstname`, `lastname`, `email`, `phone`, and
`company` to the HubSpot form. Create and add these custom contact properties
with the exact internal names:

- `dreki_submission_id`
- `dreki_industry`
- `dreki_area_of_interest`
- `dreki_workflow_challenge`
- `dreki_timeline`
- `dreki_original_page`
- `dreki_lead_source`
- `dreki_utm_source`
- `dreki_utm_medium`
- `dreki_utm_campaign`
- `dreki_utm_term`
- `dreki_utm_content`

For dropdown properties, use the internal option values exported from
`lib/leads/content.ts`. Add HubSpot data-privacy consent to the form and confirm
the approved processing and communication language matches the source
constants. Do not enable the flow until the privacy policy names the active
processors and the owner has approved retention and deletion rules.

## Production abuse and replay controls

The application fails closed until a production rate-limit control has been
verified. On the current Vercel target, create one Firewall rule with both
conditions below:

- Path equals `/api/leads`.
- Method equals `POST`.

Use a fixed window of 600 seconds, a limit of 5 requests, the IP key, and the
deny action. Confirm that excess requests return `429`, then set
`LEAD_RATE_LIMIT_VERIFIED=true` in the production environment.

The browser creates a version-four `submissionId`, keeps it stable across a
retry, and sends it to HubSpot as `dreki_submission_id`. The same ID is used as
Turnstile Siteverify's idempotency key. Turnstile tokens are single-use, so a
replayed token is rejected before another HubSpot submission. HubSpot remains
the contact system of record; use the submission ID when investigating an
ambiguous retry.

Before production:

1. Verify the Vercel Firewall rule in the production project.
2. If downstream email, billing, or another non-repeatable side effect is added,
   add an atomic shared idempotency store before enabling that side effect.
3. Monitor only non-personal outcome codes. Never log request bodies, email
   addresses, names, phone numbers, IP addresses, or provider response bodies.
4. Verify the API route, outbound HTTPS, secrets, timeouts, and real HubSpot
   delivery in the deployed Vercel runtime.
