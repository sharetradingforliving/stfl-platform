import type { Metadata, Viewport } from "next";

import { GoogleAnalytics } from "@next/third-parties/google";

import { ClerkProvider } from "@clerk/nextjs";

import { Geist, Geist_Mono } from "next/font/google";

import MainNavigation from "@/components/navigation/MainNavigation";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://sharetradingforliving.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  applicationName: "Share Trading For Living",

  title: {
    default: "Indian Stock Market Research & Trading Tools | STFL",
    template: "%s | Share Trading For Living",
  },

  description:
    "Research Indian stocks, mutual funds, ETFs, IPOs and unlisted shares with AI-assisted insights, market intelligence and analytical tools.",

  alternates: {
    canonical: "/",
  },

  keywords: [
    "Indian stock market research",
    "share trading India",
    "stock analysis India",
    "investment research India",
    "NSE stock research",
    "BSE stock research",
    "fundamental analysis India",
    "technical analysis India",
    "mutual fund research India",
    "ETF research India",
    "debt fund research India",
    "IPO research India",
    "unlisted shares India",
    "market intelligence India",
    "AI stock analysis India",
    "AI investment research",
    "Share Trading For Living",
    "STFL",
  ],

  authors: [
    {
      name: "Share Trading For Living",
      url: siteUrl,
    },
  ],

  creator: "Share Trading For Living",

  publisher: "Share Trading For Living",

  category: "Finance",

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "Share Trading For Living",
    title: "Indian Stock Market Research & Trading Tools | STFL",
    description:
      "Research Indian stocks, mutual funds, ETFs, IPOs and unlisted shares with AI-assisted insights and market intelligence.",
    images: [
      {
        url: "/sharetradingforlivingwithoutbg.png",
        width: 1200,
        height: 630,
        alt: "Share Trading For Living - Indian market research platform",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Indian Stock Market Research & Trading Tools | STFL",
    description:
      "AI-assisted research for Indian stocks, mutual funds, ETFs, IPOs, unlisted shares and market intelligence.",
    images: ["/sharetradingforlivingwithoutbg.png"],
  },

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark light",

  themeColor: [
    {
      media: "(prefers-color-scheme: dark)",
      color: "#020817",
    },
    {
      media: "(prefers-color-scheme: light)",
      color: "#ffffff",
    },
  ],
};

const structuredData = {
  "@context": "https://schema.org",

  "@graph": [
    {
      "@type": "Organization",

      "@id": `${siteUrl}/#organization`,

      name: "Share Trading For Living",

      alternateName: "STFL",

      url: siteUrl,

      logo: {
        "@type": "ImageObject",

        url: `${siteUrl}/sharetradingforlivingwithoutbg.png`,
      },

      description:
        "Share Trading For Living is an Indian-market research, investment education and analytical-tools platform.",

      email: "sharetradingforliving@gmail.com",

      contactPoint: {
        "@type": "ContactPoint",

        telephone: "+91-79056-35297",

        contactType: "customer support",

        areaServed: "IN",

        availableLanguage: ["English", "Hindi"],
      },

      sameAs: [
        "https://www.youtube.com/@sharetrading4living",
        "https://www.instagram.com/sharetradingforliving/",
        "https://www.facebook.com/sharetradingforliving",
      ],
    },

    {
      "@type": "WebSite",

      "@id": `${siteUrl}/#website`,

      url: siteUrl,

      name: "Share Trading For Living",

      alternateName: "STFL",

      description:
        "Indian stock-market research, investment education and AI-assisted analytical tools.",

      publisher: {
        "@id": `${siteUrl}/#organization`,
      },

      inLanguage: "en-IN",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="flex min-h-full flex-col">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
            }}
          />

          <MainNavigation />

          {children}

          <GoogleAnalytics gaId="G-5MST6VRL1J" />
        </body>
      </html>
    </ClerkProvider>
  );
}
