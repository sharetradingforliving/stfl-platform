    import type {
  TechnicalResearchResult,
} from "@/lib/technical/types";
import type {
  InvestmentSummaryResult,
} from "@/lib/research/investmentSummaryEngine";

    export interface CompanyResearch {
  technical: TechnicalResearchResult;

  investmentSummary: InvestmentSummaryResult;

  // Coming Soon
  fundamental?: unknown;

  valuation?: unknown;

  marketIntelligence?: unknown;

  aiResearch?: unknown;

  newsSentiment?: unknown;
}