import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Indian Company Research & Stock Analysis",
  description:
    "Research NSE and BSE companies using live market data, financial statements, fundamental ratios, valuation, peer comparison, technical analysis and AI-assisted insights.",
  keywords: [
    "Indian company research",
    "stock analysis India",
    "NSE company research",
    "BSE company research",
    "company fundamental analysis",
    "Indian stock valuation",
    "stock peer comparison India",
    "AI stock research India",
  ],
  alternates: {
    canonical: "/company-research",
  },
  openGraph: {
    title: "Indian Company Research & Stock Analysis | STFL",
    description:
      "Research Indian listed companies using financial, valuation, technical and AI-assisted insights.",
    url: "/company-research",
    type: "website",
  },
};

export default function CompanyResearchLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
