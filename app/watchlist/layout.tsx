import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stock Watchlist",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function WatchlistLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
