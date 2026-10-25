import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FII DII Data Today & Historical Institutional Flows India",
  description:
    "Track daily, monthly and yearly FII/FPI and DII cash-market activity in India, including gross purchases, gross sales and net institutional flows.",
  keywords: [
    "FII DII data today",
    "FII data India",
    "DII data India",
    "FII DII historical data",
    "FII DII monthly data",
    "FII DII yearly data",
    "institutional activity Indian stock market",
    "foreign institutional investor data",
    "domestic institutional investor data",
  ],
  alternates: {
    canonical: "/fii-dii-data",
  },
  openGraph: {
    title: "FII DII Data Today & Historical Flows | STFL",
    description:
      "Explore daily, monthly and annual FII/FPI and DII cash-market activity in India.",
    url: "/fii-dii-data",
    type: "website",
  },
};

export default function FiiDiiDataLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
