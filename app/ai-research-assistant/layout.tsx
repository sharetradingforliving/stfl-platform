import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Stock Research Assistant India",
  description:
    "Use the STFL AI research assistant to study Indian stocks, market data, fundamentals, technical indicators and investment risks with AI-assisted insights.",
  keywords: [
    "AI stock research assistant India",
    "AI stock analysis India",
    "AI share market research",
    "Indian stock market AI",
    "AI investment research",
    "stock analysis assistant",
  ],
  alternates: {
    canonical: "/ai-research-assistant",
  },
  openGraph: {
    title: "AI Stock Research Assistant India | STFL",
    description:
      "Explore Indian stocks using AI-assisted fundamental, technical and market insights.",
    url: "/ai-research-assistant",
    type: "website",
  },
};

export default function AIResearchAssistantLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
