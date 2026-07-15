import ModulePlaceholder from "@/components/modules/ModulePlaceholder";

export default function Page() {
  return (
    <ModulePlaceholder
      eyebrow="STFL FUND RESEARCH"
      title="Mutual Fund Research"
      description="Search, compare and evaluate mutual funds through returns, risk measures, portfolio holdings and category analysis."
      features={["Fund Search", "Fund Comparison", "Return Analysis", "Risk Ratios", "Portfolio Holdings", "Category Rankings", "SIP Calculator", "Fund Screener", "AI Fund Analysis"]}
    />
  );
}
