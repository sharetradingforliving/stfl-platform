import AccountPlaceholder from "@/components/account/AccountPlaceholder";

export default function Page() {
  return (
    <AccountPlaceholder
      eyebrow="STFL MEMBER WORKSPACE"
      title="Saved Research"
      description="Keep your important company reports, valuation analysis, research notes and comparisons organized in one place."
      icon="📚"
      features={["Saved Company Reports", "Saved Valuation Analysis", "Research Notes", "Stock Comparisons", "Saved Charts", "Research Collections", "Recent Research History", "Download Reports", "Search Saved Research"]}
    />
  );
}
