import AccountPlaceholder from "@/components/account/AccountPlaceholder";

export default function Page() {
  return (
    <AccountPlaceholder
      eyebrow="STFL MEMBER WORKSPACE"
      title="Market Alerts"
      description="Create and manage personalized notifications for prices, corporate actions, market events and research updates."
      icon="🔔"
      features={["Price Alerts", "Percentage Movement Alerts", "Volume Alerts", "Corporate Action Alerts", "Dividend Notifications", "Results Announcements", "Technical Indicator Alerts", "Market Event Alerts", "Notification Preferences"]}
    />
  );
}
