import type {
  Metadata,
} from "next";

export const metadata: Metadata = {
  title:
    "Top Gainers & Losers Today: NSE Market Movers",

  description:
    "Track NSE top gainers and losers today, volume leaders, active stocks and market movers with live or latest-session data from STFL.",

  keywords: [
    "top gainers and losers today",
    "NSE top gainers today",
    "NSE top losers today",
    "NSE market movers",
    "stocks on the move today",
    "most active stocks today",
    "volume gainers India",
    "active shares by value",
  ],

  alternates: {
    canonical:
      "/market-movers",
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    type: "website",
    url:
      "/market-movers",
    title:
      "Top Gainers & Losers Today: NSE Market Movers | STFL",
    description:
      "Track NSE top gainers, losers, volume leaders and active stocks with live or latest-session market data.",
    images: [
      {
        url:
          "/sharetradingforlivingwithoutbg.png",
        alt:
          "STFL NSE Market Movers",
      },
    ],
  },

  twitter: {
    card:
      "summary_large_image",
    title:
      "Top Gainers & Losers Today | STFL",
    description:
      "Track NSE market movers, top gainers, losers and active stocks.",
    images: [
      "/sharetradingforlivingwithoutbg.png",
    ],
  },
};

export default function MarketMoversLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
