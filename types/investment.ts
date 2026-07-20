export type SummaryStatus = "positive" | "warning" | "negative";

export interface InvestmentMetric {
  label: string;
  value: string;
  status: SummaryStatus;
}

export interface InvestmentSummaryData {
  overallAssessment: string;
  confidence: number;
  metrics: InvestmentMetric[];
  reasons: string[];
}