import ModulePlaceholder from "@/components/modules/ModulePlaceholder";

export default function Page() {
  return (
    <ModulePlaceholder
      eyebrow="STFL NEWS INTELLIGENCE"
      title="News & Sentiment"
      description="Follow important market, company, sector and global news with AI-assisted summaries and sentiment analysis."
      features={["Latest Market News", "Company News", "Sector News", "Global Market News", "AI News Summary", "Positive Sentiment", "Negative Sentiment", "Neutral Sentiment", "News Impact Score"]}
    />
  );
}
