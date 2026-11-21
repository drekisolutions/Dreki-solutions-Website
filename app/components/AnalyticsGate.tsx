"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
export default function AnalyticsGate({
  cloudflareToken,
}: {
  cloudflareToken?: string;
}) {
  const pathname = usePathname();
  const privateBilling =
    !pathname || /^\/(billing|checkout)(\/|$)/.test(pathname);
  useEffect(() => {
    (window as unknown as Record<string, unknown>)["ga-disable-G-9NPJ7GQ70H"] =
      privateBilling;
  }, [privateBilling]);
  // Billing links carry private tokens. Never load third-party analytics there.
  if (privateBilling) return null;
  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-9NPJ7GQ70H"
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
      >{`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-9NPJ7GQ70H', {page_location: window.location.origin + window.location.pathname});`}</Script>
      {cloudflareToken && (
        <Script
          id="cloudflare-web-analytics"
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon={JSON.stringify({ token: cloudflareToken })}
          strategy="afterInteractive"
        />
      )}
    </>
  );
}
