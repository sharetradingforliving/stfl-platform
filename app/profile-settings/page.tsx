import AccountPlaceholder from "@/components/account/AccountPlaceholder";

export default function Page() {
  return (
    <AccountPlaceholder
      eyebrow="STFL MEMBER WORKSPACE"
      title="Profile & Settings"
      description="Manage your account information, security, research preferences and notification settings."
      icon="⚙️"
      features={["Personal Profile", "Account Information", "Change Password", "Notification Settings", "Market Preferences", "Research Preferences", "Subscription Management", "Privacy Settings", "Account Security"]}
    />
  );
}
