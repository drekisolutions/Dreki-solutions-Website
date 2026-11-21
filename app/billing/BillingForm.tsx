"use client";
import { useState } from "react";
export default function BillingForm({ token }: { token?: string }) {
  const [email, setEmail] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  return (
    <form
      className="billing-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        try {
          const response = await fetch(
            token ? "/api/billing/cancel" : "/api/billing/access",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(token ? { token, confirm } : { email }),
            },
          );
          const data = await response.json();
          setMessage(data.message || data.error || "Please try again.");
          setDone(response.ok);
        } catch {
          setMessage(
            "Billing is unavailable. Contact brett@dreki-solutions.ai.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      {token ? (
        <label className="billing-agreement">
          <input
            type="checkbox"
            required
            checked={confirm}
            onChange={(e) => setConfirm(e.target.checked)}
          />
          <span>
            I want to cancel at the earliest allowed date: after my three-month
            commitment, or at the end of my current paid monthly period if
            later.
          </span>
        </label>
      ) : (
        <label>
          Checkout email address
          <input
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
      )}
      <button className="button button-primary" disabled={busy || done}>
        {busy
          ? "Please wait…"
          : token
            ? "Confirm cancellation request"
            : "Email my private billing link"}
      </button>
      <p role="status">{message}</p>
    </form>
  );
}
