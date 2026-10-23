import type {
  Metadata,
} from "next";

export const metadata: Metadata = {
  title:
    "Indian Stock Market News & AI Sentiment Today",

  description:
    "Follow Indian stock market news, company developments, sector updates and AI-assisted sentiment analysis focused on risks, opportunities and investor impact.",

  keywords: [
    "Indian stock market news today", "stock news India", "market sentiment India", "company news", "sector news", "AI news sentiment analysis"
  ],

  alternates: {
    canonical:
      "/news-sentiment",
  },

  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url:
      "/news-sentiment",
    title:
      "Indian Stock Market News & AI Sentiment Today | STFL",
    description:
      "Follow Indian stock market news, company developments, sector updates and AI-assisted sentiment analysis focused on risks, opportunities and investor impact.",
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
      "Indian Stock Market News & AI Sentiment Today | STFL",
    description:
      "Follow Indian stock market news, company developments, sector updates and AI-assisted sentiment analysis focused on risks, opportunities and investor impact.",
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
