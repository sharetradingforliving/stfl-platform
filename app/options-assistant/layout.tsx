import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Options Trading Research Assistant India",
  description:
    "Study Indian options markets, option strategies, risk, volatility, open interest and trade structures using the STFL Options Research Assistant.",
  keywords: [
    "options trading assistant India",
    "options research India",
    "Nifty options analysis",
    "Bank Nifty options analysis",
    "option strategy analysis",
    "options risk calculator India",
  ],
  alternates: {
    canonical: "/options-assistant",
  },
  openGraph: {
    title: "Options Trading Research Assistant India | STFL",
    description:
      "Research Nifty, Bank Nifty and Indian stock options using structured analytical tools.",
    url: "/options-assistant",
    type: "website",
  },
};

export default function OptionsAssistantLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
