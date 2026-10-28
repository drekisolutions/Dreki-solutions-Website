"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, X } from "lucide-react";
import "./newsletter.css";

export default function NewsletterPopup() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const reopen = () => setOpen(true);
    window.addEventListener("dreki-open-newsletter", reopen);
    let seen = false;
    try {
      seen = Boolean(
        sessionStorage.getItem("dreki-dispatch-seen") ||
        localStorage.getItem("dreki-dispatch-subscribed"),
      );
    } catch {}
    const timer =
      !seen || window.location.hash === "#newsletter"
        ? window.setTimeout(reopen, 900)
        : null;
    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("dreki-open-newsletter", reopen);
    };
  }, []);
  useEffect(() => {
    if (!open || !dialog.current) return;
    const node = dialog.current;
    node.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      node.close();
    };
  }, [open]);
  function dismiss() {
    try {
      sessionStorage.setItem("dreki-dispatch-seen", "true");
    } catch {}
    setOpen(false);
  }
  async function subscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const values = new FormData(event.currentTarget);
    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.get("email"),
          consent: values.get("consent") === "on",
          website: values.get("website"),
        }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await response.json();
      if (!response.ok || data.ok !== true)
        throw new Error(
          data.error || "We couldn't save your signup. Try again.",
        );
      setStatus("success");
      try {
        localStorage.setItem("dreki-dispatch-subscribed", "true");
      } catch {}
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Please try again.");
    }
  }
  if (!open) return null;
  return (
    <dialog
      ref={dialog}
      className="newsie-dialog"
      aria-labelledby="newsie-title"
      onCancel={dismiss}
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <motion.section
        className="newsie-paper"
        initial={reduced ? false : { scale: 0.08, rotate: -1080, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <button
          type="button"
          className="newsie-close"
          aria-label="Close newsletter signup"
          onClick={dismiss}
        >
          <X size={20} />
        </button>
        <div className="newsie-extra">EXTRA! EXTRA!</div>
        <div className="newsie-masthead">
          The Dreki
          <br />
          <span>Dispatch</span>
        </div>
        <div className="newsie-edition">
          <span>THE FIELD EDITION</span>
          <span>FREE TO READ</span>
        </div>
        {status === "success" ? (
          <div className="newsie-success" role="status">
            <Check size={35} />
            <h2 id="newsie-title">You’re on the list.</h2>
            <p>The next edition has your name on it.</p>
            <button type="button" onClick={dismiss}>
              Back to the good work →
            </button>
          </div>
        ) : (
          <>
            <h2 id="newsie-title">
              GOOD WORK.
              <br />
              LESS BUSYWORK.
            </h2>
            <p className="newsie-lede">
              Fresh ideas for people who build things.
            </p>
            <p className="newsie-copy">
              Automation, better workflows, and field notes for the trades.
              Delivered to your inbox.
            </p>
            <form onSubmit={subscribe}>
              <label className="newsie-email-label">
                Your email address
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  placeholder="you@yourbusiness.com"
                />
              </label>
              <label className="newsie-honeypot" aria-hidden="true">
                Leave empty
                <input name="website" autoComplete="off" tabIndex={-1} />
              </label>
              <label className="newsie-consent">
                <input type="checkbox" name="consent" required />
                <span>
                  I agree to receive the Dreki Dispatch by email.{" "}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </a>
                </span>
              </label>
              <button
                type="submit"
                className="newsie-subscribe"
                disabled={status === "sending"}
              >
                {status === "sending" ? "ADDING YOUR NAME…" : "COUNT ME IN"}
                <span>↗</span>
              </button>
              {status === "error" && (
                <p className="newsie-error" role="alert">
                  {message}
                </p>
              )}
            </form>
            <button type="button" className="newsie-later" onClick={dismiss}>
              I’ll catch the next edition.
            </button>
          </>
        )}
        <div className="newsie-bottom">
          YOUR CRAFT. OUR CODE. SOMETHING WORTH READING.
        </div>
      </motion.section>
    </dialog>
  );
}
