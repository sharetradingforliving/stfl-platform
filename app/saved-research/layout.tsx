import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Research",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function SavedResearchLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
