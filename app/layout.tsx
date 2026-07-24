import type { Metadata, Viewport } from "next";
import Script from "next/script";
import SiteChrome from "./components/SiteChrome";
import { absoluteUrl, siteConfig } from "./site-config";
import "@fontsource-variable/cinzel/wght.css";
import "@fontsource-variable/inter/wght.css";
import "./globals.css";

const defaultTitle = "Dreki Solutions | Governed AI Agents for Service Businesses";
const defaultDescription =
  "Dreki Solutions designs governed AI agents for customer response, intake and scheduling, and workflow coordination.";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: defaultTitle,
    template: "%s | Dreki Solutions",
  },
  description: defaultDescription,
  applicationName: siteConfig.name,
  authors: [{ name: "Dreki Solutions LLC", url: siteConfig.siteUrl }],
  creator: "Dreki Solutions LLC",
  publisher: "Dreki Solutions LLC",
  category: "Business automation",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Dreki Solutions",
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Dreki Solutions governed agent control path",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#07090b",
  colorScheme: "dark",
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.legalName,
  url: absoluteUrl("/"),
  logo: absoluteUrl("/brand/dreki-icon-1024.webp"),
  email: "brett@dreki-solutions.ai",
  telephone: "+1-517-215-7573",
  founder: { "@type": "Person", name: "Brett Moser" },
};

const serializedStructuredData = JSON.stringify(structuredData).replace(
  /</g,
  "\\u003c",
);

const analyticsToken =
  process.env.NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN?.trim();

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteChrome>{children}</SiteChrome>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializedStructuredData }}
        />
        {analyticsToken ? (
          <Script
            id="cloudflare-web-analytics"
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: analyticsToken })}
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
