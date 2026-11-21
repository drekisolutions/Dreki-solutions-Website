// Owner-authorized provisioning. Credentials are read only from the environment.
// Does not create customers, subscriptions, or charges.
import Stripe from "stripe";
import { spawnSync } from "node:child_process";
import { billingOffers } from "../lib/billing/catalog.ts";
import { billingEvents } from "../lib/billing/stripe.ts";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const catalog = [];
for (const [key, offer] of Object.entries(billingOffers)) {
  const product = await stripe.products.retrieve(offer.product, {
    expand: ["default_price"],
  });
  if (product.deleted) throw new Error("Missing product");
  const price = product.default_price as Stripe.Price;
  if (
    !product.active ||
    product.tax_code !== "txcd_10701100" ||
    !price.active ||
    price.unit_amount !== offer.amount ||
    price.currency !== "usd" ||
    (offer.monthly
      ? price.recurring?.interval !== "month" ||
        price.recurring.interval_count !== 1
      : price.recurring !== null)
  )
    throw new Error("Catalogue mismatch: " + key);
  catalog.push({
    offer: key,
    product: product.id,
    price: price.id,
    amount: price.unit_amount,
    currency: price.currency,
    recurring: price.recurring,
    tax_code: product.tax_code,
  });
}
console.log(JSON.stringify({ catalog }));
if (process.argv.includes("--configure-webhook")) {
  const url = "https://www.dreki-solutions.ai/api/billing/webhook";
  const existing = (
    await stripe.webhookEndpoints.list({ limit: 100 })
  ).data.find((e) => e.url === url);
  if (existing) {
    console.log(
      JSON.stringify({
        webhook: existing.id,
        status: existing.status,
        existing: true,
      }),
    );
  } else {
    const endpoint = await stripe.webhookEndpoints.create({
      url,
      description:
        "Dreki website service checkout, commitment enforcement, and billing alerts",
      api_version: "2026-11-18.endive",
      enabled_events: [...billingEvents],
    });
    if (!endpoint.secret) throw new Error("Webhook secret missing");
    // Pass the secret over stdin; never put it in arguments, source, or logs.
    const result = spawnSync(
      "vercel.cmd",
      [
        "env",
        "add",
        "STRIPE_WEBHOOK_SECRET",
        "production",
        "--sensitive",
        "--scope",
        "dreki-solutions-llc",
      ],
      { input: endpoint.secret, encoding: "utf8", shell: true },
    );
    if (result.status !== 0)
      throw new Error(
        "Webhook exists but its secret could not be stored. Review " +
          endpoint.id,
      );
    console.log(
      JSON.stringify({
        webhook: endpoint.id,
        stored: true,
        status: endpoint.status,
      }),
    );
  }
}
