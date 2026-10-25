import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stock Conviction Engine & Research Score",
  description:
    "Evaluate Indian stocks using the STFL Conviction Engine, combining business quality, valuation, financial performance, technical signals and investment risks.",
  keywords: [
    "stock conviction score India",
    "Indian stock rating",
    "stock research score",
    "fundamental stock analysis India",
    "stock valuation analysis",
    "AI stock insights India",
  ],
  alternates: {
    canonical: "/conviction-engine",
  },
  openGraph: {
    title: "Stock Conviction Engine & Research Score | STFL",
    description:
      "Assess Indian stocks using structured fundamental, valuation, technical and risk indicators.",
    url: "/conviction-engine",
    type: "website",
  },
};

export default function ConvictionEngineLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
