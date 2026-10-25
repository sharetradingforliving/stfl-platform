import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio Analysis & Investment Intelligence",
  description:
    "Analyse portfolio allocation, diversification, concentration, performance and investment risk using STFL Portfolio Intelligence tools for Indian investors.",
  keywords: [
    "portfolio analysis India",
    "investment portfolio tracker India",
    "portfolio risk analysis",
    "stock portfolio diversification",
    "portfolio intelligence",
    "AI portfolio analysis India",
  ],
  alternates: {
    canonical: "/portfolio-intelligence",
  },
  openGraph: {
    title: "Portfolio Analysis & Investment Intelligence | STFL",
    description:
      "Study portfolio performance, diversification, concentration and investment risk.",
    url: "/portfolio-intelligence",
    type: "website",
  },
};

export default function PortfolioIntelligenceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
