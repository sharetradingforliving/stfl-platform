import AccountPlaceholder from "@/components/account/AccountPlaceholder";

export default function Page() {
  return (
    <AccountPlaceholder
      eyebrow="STFL MEMBER WORKSPACE"
      title="My Watchlist"
      description="Track selected stocks, monitor price movements and organize companies you want to research."
      icon="⭐"
      features={["Create Multiple Watchlists", "Add and Remove Stocks", "Live Price Tracking", "Daily Price Change", "Watchlist Performance", "Research Updates", "Corporate Action Alerts", "Custom Notes", "Stock Comparison"]}
    />
  );
}
