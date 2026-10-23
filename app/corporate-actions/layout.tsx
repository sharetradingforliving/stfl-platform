import type {
  Metadata,
} from "next";

export const metadata: Metadata = {
  title:
    "Corporate Actions India: Dividends, Bonus & Splits",

  description:
    "Track Indian corporate actions including dividends, bonus shares, stock splits, buybacks, rights issues, board meetings, record dates and ex-dates.",

  keywords: [
    "corporate actions India", "dividend stocks India", "bonus shares", "stock split India", "share buyback", "dividend ex date", "record date"
  ],

  alternates: {
    canonical:
      "/corporate-actions",
  },

  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url:
      "/corporate-actions",
    title:
      "Corporate Actions India: Dividends, Bonus & Splits | STFL",
    description:
      "Track Indian corporate actions including dividends, bonus shares, stock splits, buybacks, rights issues, board meetings, record dates and ex-dates.",
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
      "Corporate Actions India: Dividends, Bonus & Splits | STFL",
    description:
      "Track Indian corporate actions including dividends, bonus shares, stock splits, buybacks, rights issues, board meetings, record dates and ex-dates.",
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
