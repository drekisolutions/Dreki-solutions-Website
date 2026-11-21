# Website service billing

Production account: Dreki Solutions LLC (`acct_1TP1IKPoN0MD3e7C`), live mode.
The canonical catalogue is `lib/billing/catalog.ts`. All four products use
Website Hosting (`txcd_10701100`), as requested by the owner. Stripe Tax was
already configured with a Michigan registration; this release adds no registrations.

## Customer flow

- Business brand kit: `/checkout/business-brand-kit`, $1,500 once.
- Owner personal brand: `/checkout/owner-personal-brand`, $750 once.
- Social media marketing: `/checkout/social-media-marketing`, $1,000/month.
  Customers must select 30 static ad posts OR 20 posts and 8 videos.
- Brand content retainer: `/checkout/monthly-content-retainer`, $1,000/month.
- Both monthly offers require three months, then renew monthly.
- Checkout records the service, content choice, and service-terms version in
  Stripe metadata. Terms acceptance is required both on-site and in Stripe.
- Applicable tax is shown before payment. No quantity adjustment or client-supplied
  price is accepted. The current Stripe price is checked against the approved amount.

## Commitment and cancellation

Signed subscription and paid checkout/invoice webhooks attach one three-month
Subscription Schedule, measured from the original subscription start in UTC.
Month-end starts clamp to the last valid day of the target month. A recovery
worker checks managed subscriptions every five minutes. Duplicate events reuse
Stripe idempotency keys; delayed recovery does not extend the original commitment.

The schedule releases after the term, allowing ordinary monthly renewal. Stripe's
portal does not let customers change/cancel a subscription with an active schedule.
The website does not change the account's existing portal settings.

Customers can request cancellation anytime at `/billing`. A private email link
expires after 24 hours. Opening it does nothing; a separate confirmation schedules
termination. During the commitment this changes the schedule's end behavior to
cancel, without shortening its phase. After the term it cancels at the current
monthly period end. This is a billing/cancellation control, not a guarantee that
a bank will honor every charge. Failed payments, refunds, fraud, and disputes
require normal owner review; they never cause automatic refunds or new charges.

## Credentials and deployment

Store only sensitive, server-side Vercel variables:
`STRIPE_SECRET_KEY` (restricted live key), `STRIPE_WEBHOOK_SECRET`, and
`STRIPE_BILLING_SIGNING_SECRET` (at least 32 characters). Reuse existing
`RESEND_API_KEY`, `AUDIT_FROM_EMAIL`, `BLOG_DATABASE_URL`, TLS CA, and `CRON_SECRET`.
`STRIPE_CHECKOUT_ENABLED=true` opens new checkout. Turning it off does not disable
existing customer cancellation or webhook processing. Default mode is live;
an isolated test environment must explicitly use `STRIPE_BILLING_MODE=test`.

Webhook destination: `https://www.dreki-solutions.ai/api/billing/webhook`.
Selected lifecycle/payment/risk events are listed in `billingEvents` in the server
module. Requests require a valid Stripe signature, recent timestamp and matching
mode. Unrelated products/subscriptions are ignored. Payment success is confirmed
by events, never by trusting a browser redirect. Owner billing alerts use Resend;
failed processing returns an error for Stripe retries. The worker repairs missing
commitment schedules. Billing URLs are excluded from third-party analytics and
use no-referrer/no-store responses.

The restricted key requires Customers and Checkout Sessions write; Subscriptions
(including schedules) write; Products, Prices, Invoices, Payment Intents, Charges,
and Events read. Webhook Endpoints write is used for setup. No payouts or bank
account changes are permitted. `scripts/setup-billing.ts` verifies the live
catalogue and provisions the webhook without creating customers or charges.

## Verification and rollback

Run `npm run verify` (includes billing security and term tests). The separate
`scripts/test-billing-sandbox.mjs` refuses live keys and uses synthetic customers
and Stripe test clocks to verify both monthly offers: early cancellation means
three invoices; normal renewal releases the schedule and continues monthly;
later cancellation stops at the next period end. Shared sandbox tax settings
are left unchanged; live automatic-tax configuration is separately checked by
`scripts/verify-billing-checkout.ts`, which creates and immediately expires empty
sessions for all four services and never submits payment.

Before release, confirm sandbox acceptance results, production Vercel READY,
live checkout and cancellation UI, unsigned webhook rejection, and protected worker.
Rollback should first disable new checkout. Keep cancellation and webhook handling
available for existing customers, and preserve their schedules. Do not roll back
to a version without billing routes once real customers have subscribed.
