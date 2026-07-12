import type { Metadata, Viewport } from "next";
import { Cinzel, Inter } from "next/font/google";
import { headers } from "next/headers";
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

const title = "Dreki Solutions | Custom AI Agent Systems for Service Businesses";
const description =
  "Subscription-based AI agent systems that help service businesses improve customer response, reputation, content operations, and recurring workflows.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "dreki-solutions.com";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const baseUrl = `${protocol}://${host}`;

  return {
    title,
    description,
    alternates: {
      canonical: "/",
    },
    icons: {
      icon: "/favicon.png",
      shortcut: "/favicon.png",
      apple: "/favicon.png",
    },
    openGraph: {
      type: "website",
      url: baseUrl,
      siteName: "Dreki Solutions",
      title,
      description,
      images: [
        {
          url: `${baseUrl}/og.png`,
          width: 1536,
          height: 1024,
          alt: "Dreki Solutions custom agent systems",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${baseUrl}/og.png`],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#141414",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${cinzel.variable} ${inter.variable}`}>{children}</body>
    </html>
  );
}
