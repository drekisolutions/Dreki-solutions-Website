import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: { absolute: "Page Not Found | Dreki Solutions" },
  robots: { index: false, follow: false },
};

export default function TermsPage(): never {
  notFound();
}
