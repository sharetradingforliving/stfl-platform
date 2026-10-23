import type {
  Metadata,
} from "next";

export const metadata: Metadata = {
  title:
    "Fundamental Stock Analysis & Valuation India",

  description:
    "Analyse Indian stocks using financial statements, ratios, growth, profitability, cash flow, peer comparison, valuation and AI-assisted fundamental insights.",

  keywords: [
    "fundamental analysis of Indian stocks", "stock valuation India", "financial analysis", "company research India", "AI stock analysis India", "Indian stock research"
  ],

  alternates: {
    canonical:
      "/fundamental-research",
  },

  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url:
      "/fundamental-research",
    title:
      "Fundamental Stock Analysis & Valuation India | STFL",
    description:
      "Analyse Indian stocks using financial statements, ratios, growth, profitability, cash flow, peer comparison, valuation and AI-assisted fundamental insights.",
    images: [
      {
        url:
          "/sharetradingforlivingwithoutbg.png",
        alt:
          "Share Trading For Living",
      },
    ],
  },

  twitter: {
    card:
      "summary_large_image",
    title:
      "Fundamental Stock Analysis & Valuation India | STFL",
    description:
      "Analyse Indian stocks using financial statements, ratios, growth, profitability, cash flow, peer comparison, valuation and AI-assisted fundamental insights.",
    images: [
      "/sharetradingforlivingwithoutbg.png",
    ],
  },
};

export default function PageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
