import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mutual Fund Research & Analysis India",
  description:
    "Research Indian mutual funds, compare categories, study returns, risk, portfolio composition and investment suitability with STFL analytical tools.",
  keywords: [
    "mutual fund research India",
    "mutual fund analysis India",
    "best mutual funds India",
    "mutual fund comparison",
    "SIP research India",
    "AI mutual fund analysis",
    "debt fund research India",
  ],
  alternates: {
    canonical: "/mutual-fund-research",
  },
  openGraph: {
    title: "Mutual Fund Research & Analysis India | STFL",
    description:
      "Compare Indian mutual funds using performance, risk, category and portfolio insights.",
    url: "/mutual-fund-research",
    type: "website",
  },
};

export default function MutualFundResearchLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
