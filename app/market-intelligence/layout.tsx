import type {
  Metadata,
} from "next";

export const metadata: Metadata = {
  title:
    "Indian Stock Market Today: Nifty, FII DII & Breadth",

  description:
    "Track the Indian stock market today with Nifty trends, FII and DII activity, India VIX, market breadth, sector performance and AI-assisted market insights.",

  keywords: [
    "Indian stock market today", "Nifty today", "Bank Nifty today", "FII DII data today", "India VIX", "market breadth India", "AI market intelligence"
  ],

  alternates: {
    canonical:
      "/market-intelligence",
  },

  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url:
      "/market-intelligence",
    title:
      "Indian Stock Market Today: Nifty, FII DII & Breadth | STFL",
    description:
      "Track the Indian stock market today with Nifty trends, FII and DII activity, India VIX, market breadth, sector performance and AI-assisted market insights.",
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
      "Indian Stock Market Today: Nifty, FII DII & Breadth | STFL",
    description:
      "Track the Indian stock market today with Nifty trends, FII and DII activity, India VIX, market breadth, sector performance and AI-assisted market insights.",
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
