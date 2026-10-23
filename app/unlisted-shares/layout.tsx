import type {
  Metadata,
} from "next";

export const metadata: Metadata = {
  title:
    "Unlisted Share Prices & Pre-IPO Research India",

  description:
    "Explore indicative unlisted share prices, pre-IPO companies, price history, company profiles and research insights for the Indian unlisted-share market.",

  keywords: [
    "unlisted share price India", "pre IPO shares India", "unlisted companies list", "unlisted stock research", "unlisted share price history"
  ],

  alternates: {
    canonical:
      "/unlisted-shares",
  },

  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url:
      "/unlisted-shares",
    title:
      "Unlisted Share Prices & Pre-IPO Research India | STFL",
    description:
      "Explore indicative unlisted share prices, pre-IPO companies, price history, company profiles and research insights for the Indian unlisted-share market.",
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
      "Unlisted Share Prices & Pre-IPO Research India | STFL",
    description:
      "Explore indicative unlisted share prices, pre-IPO companies, price history, company profiles and research insights for the Indian unlisted-share market.",
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
