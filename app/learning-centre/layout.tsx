import type {
  Metadata,
} from "next";

export const metadata: Metadata = {
  title:
    "Learn Share Trading & Investing in India",

  description:
    "Learn the foundations of share trading, investing, fundamental analysis, technical analysis, mutual funds, ETFs, debt investments and risk management.",

  keywords: [
    "learn share trading India", "share trading for beginners", "learn investing India", "stock market education", "investment education"
  ],

  alternates: {
    canonical:
      "/learning-centre",
  },

  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    type: "website",
    url:
      "/learning-centre",
    title:
      "Learn Share Trading & Investing in India | STFL",
    description:
      "Learn the foundations of share trading, investing, fundamental analysis, technical analysis, mutual funds, ETFs, debt investments and risk management.",
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
      "Learn Share Trading & Investing in India | STFL",
    description:
      "Learn the foundations of share trading, investing, fundamental analysis, technical analysis, mutual funds, ETFs, debt investments and risk management.",
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
