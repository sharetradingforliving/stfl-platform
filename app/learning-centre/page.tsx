import ModulePlaceholder from "@/components/modules/ModulePlaceholder";

export default function Page() {
  return (
    <ModulePlaceholder
      eyebrow="STFL LEARNING"
      title="Learning Centre"
      description="Build practical market knowledge through structured lessons, articles, videos and trading education."
      features={["Stock Market Basics", "Fundamental Analysis", "Technical Analysis", "Candlestick Patterns", "Technical Indicators", "Options Trading", "Risk Management", "Trading Psychology", "Video Courses"]}
    />
  );
}
