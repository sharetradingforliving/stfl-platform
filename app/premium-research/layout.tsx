import type {
  Metadata,
} from "next";

export const metadata: Metadata = {
  title:
    "Premium AI Stock & Investment Research India",

  description:
    "Access premium AI-assisted research for Indian stocks, valuations, technical trends, market intelligence, risk assessment and investment opportunities.",

  keywords: [
    "premium stock research India", "AI investment research India", "AI stock analysis India", "advanced stock analysis", "premium market research"
  ],

  alternates: {
    canonical:
      "/premium-research",
  },

  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url:
      "/premium-research",
    title:
      "Premium AI Stock & Investment Research India | STFL",
    description:
      "Access premium AI-assisted research for Indian stocks, valuations, technical trends, market intelligence, risk assessment and investment opportunities.",
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
      "Premium AI Stock & Investment Research India | STFL",
    description:
      "Access premium AI-assisted research for Indian stocks, valuations, technical trends, market intelligence, risk assessment and investment opportunities.",
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
