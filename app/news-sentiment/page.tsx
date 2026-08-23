import ModuleLayout from "@/components/modules/ModuleLayout";
import NewsDashboard from "@/components/news/NewsDashboard";

export default function Page() {
  return (
    <ModuleLayout
      eyebrow="STFL NEWS INTELLIGENCE"
      title="News & Sentiment"
      description="Follow important market, company, sector and global news with AI-assisted summaries and sentiment analysis."
      status="In Development"
    >
      <NewsDashboard />
    </ModuleLayout>
  );
}