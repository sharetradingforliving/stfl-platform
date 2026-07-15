import ModulePlaceholder from "@/components/modules/ModulePlaceholder";

export default function Page() {
  return (
    <ModulePlaceholder
      eyebrow="STFL FUNDAMENTAL RESEARCH"
      title="Fundamental Research"
      description="Evaluate business quality, financial performance, valuation and long-term growth potential using structured research tools."
      features={["Financial Statements", "Financial Ratios", "Growth Analysis", "Profitability Analysis", "DCF Valuation", "WACC Analysis", "Graham Valuation", "Relative Valuation", "Peer Comparison"]}
    />
  );
}
