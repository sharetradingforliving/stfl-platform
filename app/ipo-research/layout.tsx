import type {
  Metadata,
} from "next";

export const metadata: Metadata = {
  title:
    "IPO Research India: GMP, Financials & Analysis",

  description:
    "Research upcoming and open IPOs in India with GMP, subscription details, company financials, valuation metrics, prospectus insights and AI-assisted IPO analysis.",

  keywords: [
    "IPO research India", "upcoming IPO India", "IPO GMP today", "IPO subscription status", "IPO financial analysis", "AI IPO analysis"
  ],

  alternates: {
    canonical:
      "/ipo-research",
  },

  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url:
      "/ipo-research",
    title:
      "IPO Research India: GMP, Financials & Analysis | STFL",
    description:
      "Research upcoming and open IPOs in India with GMP, subscription details, company financials, valuation metrics, prospectus insights and AI-assisted IPO analysis.",
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
      "IPO Research India: GMP, Financials & Analysis | STFL",
    description:
      "Research upcoming and open IPOs in India with GMP, subscription details, company financials, valuation metrics, prospectus insights and AI-assisted IPO analysis.",
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
