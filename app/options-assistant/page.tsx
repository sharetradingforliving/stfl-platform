import ModulePlaceholder from "@/components/modules/ModulePlaceholder";

export default function Page() {
  return (
    <ModulePlaceholder
      eyebrow="STFL OPTIONS INTELLIGENCE"
      title="Options Assistant"
      description="Analyse option-chain activity, open interest, volatility and strategy opportunities through one professional options workspace."
      features={["Option Chain", "Open Interest Analysis", "Put Call Ratio", "Max Pain", "Implied Volatility", "Option Greeks", "Strategy Builder", "Payoff Analysis", "AI Strategy Assistant"]}
    />
  );
}
