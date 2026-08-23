/**
 * ================================================================
 * STFL Research Engine
 * File: researchEngine.ts
 * Purpose: Central Research Orchestrator
 * ================================================================
 */

import { runTechnicalAnalysis } from "../technical/technicalEngine";

import type {
  TechnicalResearchInput,
} from "../technical/types";

import type {
  CompanyResearch,
} from "@/lib/types/research";

import {
  buildInvestmentSummary,
} from "@/lib/research/investmentSummaryEngine";
/**
 * Runs the complete STFL Technical Research Engine.
 *
 * Future Roadmap:
 * Phase 2 -> Technical Research
 * Phase 3 -> Fundamental Research
 * Phase 4 -> Market Intelligence
 * Phase 5 -> AI Research
 */
export async function runResearchEngine(
  input: TechnicalResearchInput
): Promise<CompanyResearch> {
  const technical = runTechnicalAnalysis(input);
  const investmentSummary = buildInvestmentSummary(
  technical
);

  return {
  technical,

  investmentSummary,

  // Future modules
  fundamental: undefined,
  valuation: undefined,
  marketIntelligence: undefined,
  aiResearch: undefined,
  newsSentiment: undefined,
};
}