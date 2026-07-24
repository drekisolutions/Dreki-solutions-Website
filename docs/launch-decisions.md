# Dreki website launch decisions

Last updated: July 23, 2026

## Confirmed

- Primary conversion: booked strategy calls.
- Primary audience: service businesses.
- Featured offers: Customer Response, Intake and Scheduling, and Workflow Coordination agents.
- Public domain: keep the existing `www.dreki-solutions.ai` production domain and replace the current site.
- Lead system: HubSpot form and one-on-one meeting scheduling.
- Proof treatment: clearly labeled internal demonstrations, never implied customer work.
- Signature interaction: the Three.js Guardian Circuit with an explicit human-approval gate.
- Commercial CTA: request a scoped estimate; do not publish pricing ranges.

## Implementation boundaries

- Keep public claims descriptive and verifiable. Do not invent customer outcomes, certifications, integrations, or performance metrics.
- Keep the current email contact path available until HubSpot and its connected calendar are configured.
- Preserve both deployment builds: standard Next.js for Vercel and Vinext for Sites.
- Keep the Three.js scene isolated from critical content and provide complete non-WebGL and reduced-motion fallbacks.

## Pending owner setup

- Create or confirm the HubSpot account.
- Connect the scheduling calendar and publish the meeting page.
- Create the HubSpot website inquiry form and approve its fields and consent copy.
- Create the production Turnstile widget.
- Add and verify the Vercel Firewall rate-limit rule for `POST /api/leads`.
- Add the Cloudflare Web Analytics site token for privacy-safe page and Web Vitals measurement.
- Add provider values through the deployment environment, not source control or chat.
- Obtain legal review before treating draft Terms or updated processor disclosures as final legal advice.
