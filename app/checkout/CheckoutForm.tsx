"use client";
import { useState } from "react";
import {
  type OfferKey,
  billingOffers,
  monthlyAgreement,
} from "@/lib/billing/catalog";
export default function CheckoutForm({
  offer,
  ready,
}: {
  offer: OfferKey;
  ready: boolean;
}) {
  const service = billingOffers[offer];
  const [choice, setChoice] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [attempt] = useState(() => crypto.randomUUID());
  return (
    <form
      className="billing-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          const response = await fetch("/api/billing/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ offer, choice, accepted, attempt }),
          });
          const data = await response.json();
          if (!response.ok || !data.url)
            throw new Error(data.error || "Checkout is unavailable.");
          window.location.assign(data.url);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Checkout is unavailable.",
          );
          setBusy(false);
        }
      }}
    >
      {offer === "social-media-marketing" && (
        <fieldset>
          <legend>Choose one monthly content option</legend>
          <label>
            <input
              type="radio"
              name="content"
              value="static"
              required
              checked={choice === "static"}
              onChange={() => setChoice("static")}
            />
            30 static ad posts
          </label>
          <label>
            <input
              type="radio"
              name="content"
              value="mixed"
              checked={choice === "mixed"}
              onChange={() => setChoice("mixed")}
            />
            20 posts and 8 videos
          </label>
        </fieldset>
      )}
      <p>
        {service.monthly
          ? monthlyAgreement
          : "One payment. Brett will follow up by email to arrange your project."}
      </p>
      <label className="billing-agreement">
        <input
          type="checkbox"
          required
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
        />{" "}
        <span>
          I agree to the{" "}
          <a href="/terms#terms-paid-services" target="_blank" rel="noreferrer">
            service terms
          </a>{" "}
          and{" "}
          <a href="/privacy" target="_blank" rel="noreferrer">
            Privacy Policy
          </a>
          {service.monthly &&
            ", including the three-month commitment and monthly renewal"}
          .
        </span>
      </label>
      <button className="button button-primary" disabled={!ready || busy}>
        {busy ? "Opening secure checkout…" : "Continue to secure checkout"}
      </button>
      {!ready && (
        <p>
          Checkout is being prepared. Contact{" "}
          <a href="mailto:brett@dreki-solutions.ai">Brett</a> to arrange this
          service.
        </p>
      )}
      <p className="billing-note">
        Stripe securely handles payment details. Applicable tax is shown before
        payment. <a href="/billing">Manage or cancel a subscription</a>.
      </p>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
