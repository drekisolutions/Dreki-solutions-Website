import type { Metadata, Viewport } from "next";
import { Cinzel, Inter } from "next/font/google";
import SiteChrome from "./components/SiteChrome";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

const defaultTitle = "Dreki Solutions | Custom Agentic Software";
const defaultDescription =
  "Custom agentic software, services, and products for service businesses and aviation operations.";
const siteUrl = "https://dreki-solutions-ops.dreki-solutions.chatgpt.site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: "%s | Dreki Solutions",
  },
  description: defaultDescription,
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
        url: "/og-wide.png",
        width: 1200,
        height: 630,
        alt: "Dreki Solutions custom agent systems",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: ["/og-wide.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c0c0d",
  colorScheme: "dark",
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Dreki Solutions LLC",
    url: `${siteUrl}/`,
    logo: `${siteUrl}/brand/dreki-icon-1024.webp`,
    email: "brett@dreki-solutions.ai",
    telephone: "+1-517-215-7573",
    founder: { "@type": "Person", name: "Brett Moser" },
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Custom Agentic Software Services",
    serviceType: "Agentic software design, deployment, and optimization",
    provider: { "@type": "Organization", name: "Dreki Solutions LLC" },
    audience: [
      { "@type": "BusinessAudience", audienceType: "Service businesses" },
      { "@type": "BusinessAudience", audienceType: "Aviation and charter operations" },
    ],
  },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cinzel.variable} ${inter.variable}`}>
      <body>
        <SiteChrome>{children}</SiteChrome>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
