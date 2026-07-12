"use client";

import { type FormEvent, useState } from "react";
import { contact } from "../site-data";

export default function ConsultationForm() {
  const [contactMethod, setContactMethod] = useState("Email");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "").trim();
    const body = [
      `Name: ${value("fullName")}`,
      `Email: ${value("email")}`,
      `Phone: ${value("phone")}`,
      `Business name: ${value("businessName")}`,
      `Website: ${value("website")}`,
      `Industry: ${value("industry")}`,
      `Workflow to optimize: ${value("workflow")}`,
      `Preferred contact method: ${value("contactMethod")}`,
    ].join("\r\n");
    const mailto = `mailto:${contact.email}?subject=${encodeURIComponent(
      "Consultation and Optimization Audit Request",
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  return (
    <form className="consultation-form" id="consultation" onSubmit={handleSubmit}>
      <div className="form-heading">
        <p className="eyebrow">Optimization audit request</p>
        <h2>Show us where the work slows down.</h2>
        <p>
          Complete the short brief. Submitting opens a prefilled message in your
          email application; this website does not store the information.
        </p>
      </div>

      <div className="form-grid">
        <label>
          <span>Your name</span>
          <input name="fullName" type="text" autoComplete="name" required />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          <span>Business name</span>
          <input name="businessName" type="text" autoComplete="organization" required />
        </label>
        <label>
          <span>Website</span>
          <input name="website" type="url" inputMode="url" placeholder="https://" />
        </label>
        <label>
          <span>Industry</span>
          <select name="industry" defaultValue="Service business" required>
            <option>Service business</option>
            <option>Aviation / charter</option>
            <option>Other</option>
          </select>
        </label>
        <label>
          <span>Preferred contact method</span>
          <select
            name="contactMethod"
            value={contactMethod}
            onChange={(event) => setContactMethod(event.target.value)}
            required
          >
            <option>Email</option>
            <option>Phone</option>
          </select>
        </label>
        <label>
          <span>Phone number{contactMethod === "Phone" ? " (required)" : ""}</span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            required={contactMethod === "Phone"}
          />
        </label>
        <label className="form-field-wide">
          <span>Workflow to optimize</span>
          <textarea
            name="workflow"
            rows={5}
            placeholder="Describe the repetitive work, handoff, or operating bottleneck."
            required
          />
        </label>
      </div>
      <button className="button button-primary form-submit" type="submit">
        Schedule a Consultation
      </button>
    </form>
  );
}
