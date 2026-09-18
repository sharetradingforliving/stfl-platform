import type {
  Metadata,
} from "next";

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

export const metadata: Metadata = {
  title: {
    default:
      "Share Trading For Living",
    template:
      "%s | Share Trading For Living",
  },
  description:
    "STFL provides structured market research, analytics and investor education.",
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
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="flex min-h-full flex-col">
          <MainNavigation />

          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}