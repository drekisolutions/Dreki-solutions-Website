import type { Metadata } from "next";
import PageTurnLink from "./components/PageTurnLink";

export const metadata: Metadata = {
  title: { absolute: "Page Not Found | Dreki Solutions" },
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="page-main" id="main-content">
      <section className="not-found">
        <p className="eyebrow">404 / Route not found</p>
        <h1>This page left the flight path.</h1>
        <p>The requested page is not part of the current Dreki operating lattice.</p>
        <PageTurnLink className="button button-primary" href="/">Return Home</PageTurnLink>
      </section>
    </main>
  );
}
