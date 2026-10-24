import type {
  Metadata,
} from "next";

export const metadata: Metadata = {
  title:
    "Stock Discovery & Screening India",

  description:
    "Discover and screen Indian stocks using company fundamentals, valuation, market data and research filters on STFL.",

  alternates: {
    canonical:
      "/fundamental-research/discovery",
  },
};

export default function StockDiscoveryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}