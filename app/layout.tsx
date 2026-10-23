import type {
  Metadata,
  Viewport,
} from "next";

import {
  GoogleAnalytics,
} from "@next/third-parties/google";

import {
  ClerkProvider,
} from "@clerk/nextjs";

import {
  Geist,
  Geist_Mono,
} from "next/font/google";

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

const siteUrl =
  "https://sharetradingforliving.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  applicationName:
    "Share Trading For Living",

  title: {
    default:
      "Indian Stock Market Research & Analysis | STFL",
    template:
      "%s | Share Trading For Living",
  },

  description:
    "Research Indian stocks, IPOs, unlisted shares, corporate actions and market trends with fundamental analysis, technical insights and investor education from STFL.",

  keywords: [
    "Indian stock market research",
    "stock analysis India",
    "fundamental analysis",
    "technical analysis",
    "IPO research India",
    "unlisted shares India",
    "corporate actions India",
    "share market research",
    "stock screener India",
    "market intelligence India",
    "Share Trading For Living",
    "STFL",
  ],

  authors: [
    {
      name: "Share Trading For Living",
      url: siteUrl,
    },
  ],

  creator:
    "Share Trading For Living",

  publisher:
    "Share Trading For Living",

  category:
    "Finance",

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
    siteName:
      "Share Trading For Living",
    title:
      "Indian Stock Market Research & Analysis | STFL",
    description:
      "Research Indian stocks, IPOs, unlisted shares, corporate actions and market trends with fundamental and technical insights.",
    images: [
      {
        url: "/sharetradingforlivingwithoutbg.png",
        alt: "Share Trading For Living",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title:
      "Indian Stock Market Research & Analysis | STFL",
    description:
      "Research Indian stocks, IPOs, unlisted shares and market trends with fundamental and technical insights.",
    images: [
      "/sharetradingforlivingwithoutbg.png",
    ],
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
      media:
        "(prefers-color-scheme: dark)",
      color: "#020817",
    },
    {
      media:
        "(prefers-color-scheme: light)",
      color: "#ffffff",
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
        lang="en-IN"
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      >
        <body className="flex min-h-full flex-col">
          <MainNavigation />

          {children}
        </body>

        <GoogleAnalytics
          gaId="G-5MST6VRL1J"
        />
      </html>
    </ClerkProvider>
  );
}