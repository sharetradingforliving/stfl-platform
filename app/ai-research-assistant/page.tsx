import ModulePlaceholder from "@/components/modules/ModulePlaceholder";

export default function Page() {
  return (
    <ModulePlaceholder
      eyebrow="STFL AI RESEARCH"
      title="STFL AI Research Assistant"
      description="Ask questions about companies, markets, financial results, charts and investment research through an intelligent conversational interface."
      features={["Company Research", "Financial Result Summary", "Earnings Analysis", "Chart Explanation", "Stock Comparison", "Market Explanation", "Research Summary", "Risk Analysis", "AI Insights"]}
    />
  );
}
