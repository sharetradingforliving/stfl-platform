import ModulePlaceholder from "@/components/modules/ModulePlaceholder";

export default function Page() {
  return (
    <ModulePlaceholder
      eyebrow="STFL MARKET INTELLIGENCE"
      title="Market Intelligence"
      description="Track market direction, institutional activity, volatility, sector movement and important events through one integrated market dashboard."
      features={["Market Overview", "Indian Indices", "Global Markets", "FII and DII Activity", "India VIX", "Market Breadth", "Sector Performance", "Stocks on the Move", "Corporate Actions"]}
    />
  );
}
