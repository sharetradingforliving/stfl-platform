import "server-only";

import type { FinancialStatementPeriod } from "../types";
import type { AnalyticsAnnualMetadata } from "./storedFundamentalAnalytics";

type JsonObject = Record<string, unknown>;
export type StoredAnnualRecord = {
  financialPeriod: FinancialStatementPeriod;
  metadata: AnalyticsAnnualMetadata;
};

function object(value: unknown): JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as JsonObject : {};
}
function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
function number(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function date(value: unknown): string | null {
  const result = text(value);
  if (!result || !/^\d{4}-\d{2}-\d{2}$/.test(result)) return null;
  const timestamp = Date.parse(result);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === result
    ? result : null;
}

export async function getStoredFinancialHistory(requestedSymbol: string): Promise<{
  companyName: string | null;
  records: StoredAnnualRecord[];
  warnings: string[];
}> {
  const symbol = requestedSymbol.trim().toUpperCase();
  const base = (process.env.STFL_FINANCIAL_BACKEND_URL || process.env.STFL_BACKEND_URL || "").replace(/\/+$/, "");
  const token = process.env.FINANCIAL_HISTORY_READ_TOKEN;
  if (!base || !token) throw new Error("Stored research reading is not configured.");

  const response = await fetch(
    `${base}/api/fundamental/history/research/${encodeURIComponent(symbol)}?exchange=NSE&years=5`,
    {
      headers: { Accept: "application/json", "X-STFL-Read-Token": token },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    },
  );
  if (response.status === 404) {
    return { companyName: null, records: [], warnings: ["No stored annual financial history is available. A financial-history refresh is required."] };
  }
  if (!response.ok) throw new Error(`Stored financial-history service returned HTTP ${response.status}.`);
  const data = object(await response.json());
  const company = object(data.company);
  if (data.status !== "success" || company.symbol !== symbol || company.exchange !== "NSE" || !Array.isArray(data.records)) {
    throw new Error("Stored financial-history response failed identity validation.");
  }
  const consolidated = data.reportingBasis === "CONSOLIDATED";
  if (!consolidated && data.reportingBasis !== "STANDALONE") throw new Error("Stored reporting basis is unavailable.");
  const warnings: string[] = [
    "Research uses saved annual statements. Quarterly and TTM metrics are unavailable in this stored annual response.",
    "Stored history coverage counts available years; it does not establish that all fields or historical comparisons are complete.",
  ];
  if (!consolidated) warnings.push("Standalone financial statements are used consistently. These are not consolidated results.");
  const records: StoredAnnualRecord[] = [];
  const seen = new Set<string>();

  for (const raw of data.records) {
    const record = object(raw);
    const end = date(record.periodEnd);
    const start = date(record.periodStart);
    const unit = text(record.unitScale)?.toUpperCase();
    if (record.periodType !== "ANNUAL" || record.consolidated !== consolidated || record.currency !== "INR" || !["CRORE", "CRORES"].includes(unit ?? "") || !end || (start !== null && start >= end) || seen.has(end)) {
      throw new Error("Stored annual history contains an invalid, duplicate or mixed-basis record.");
    }
    const quality = text(record.dataQualityStatus)?.toUpperCase();
    if (quality !== "VERIFIED" && quality !== "PARTIAL") {
      warnings.push(`${end}: an unvalidated financial record was excluded.`);
      continue;
    }
    seen.add(end);
    const income = object(record.incomeStatement);
    const balance = object(record.balanceSheet);
    const cash = object(record.cashFlow);
    const banking = object(record.banking);
    const extra = object(record.supplementary);
    const source = object(record.source);
    const name = text(source.name) ?? "Stored financial records";
    const derived = source.isDerived;
    if (typeof derived !== "boolean") throw new Error("Stored financial derivation provenance is missing.");
    const rowWarnings = Array.isArray(record.validationWarnings)
      ? record.validationWarnings.filter((value): value is string => typeof value === "string") : [];
    if (quality === "PARTIAL") rowWarnings.push("This stored annual statement is partial; missing fields have not been estimated.");
    const period = text(record.fiscalYearLabel) ?? end;
    const operatingIncome = number(extra.operatingIncome) ?? number(banking.operatingProfitBeforeProvisions);
    records.push({
      financialPeriod: {
        period, periodType: "ANNUAL", startDate: start, endDate: end,
        currency: "INR", unit: "CRORES",
        revenue: number(income.revenue), operatingIncome,
        ebitda: number(income.ebitda), ebit: number(income.ebit),
        profitBeforeTax: number(income.profitBeforeTax), taxExpense: number(income.taxExpense),
        netProfit: number(income.profitAfterTax), financeCosts: number(income.financeCost),
        epsBasic: number(income.epsBasic), epsDiluted: number(income.epsDiluted),
        totalAssets: number(balance.totalAssets), totalEquity: number(balance.totalEquity),
        totalDebt: number(balance.totalDebt), equityShareCapital: number(balance.shareCapital),
        faceValuePerShare: number(extra.faceValuePerShare), sharesOutstanding: number(balance.sharesOutstanding),
        deposits: number(banking.deposits), advances: number(banking.advances),
        grossNpaPercent: number(banking.grossNpaPercent), netNpaPercent: number(banking.netNpaPercent),
        returnOnAssetsPercent: number(banking.reportedReturnOnAssetsPercent),
        cashAndEquivalents: number(balance.cashAndEquivalents),
        currentAssets: number(balance.currentAssets), currentLiabilities: number(balance.currentLiabilities),
        inventory: number(balance.inventory), tradeReceivables: number(balance.tradeReceivables),
        tradePayables: number(extra.tradePayables),
        operatingCashFlow: number(cash.operatingCashFlow), investingCashFlow: number(cash.investingCashFlow),
        financingCashFlow: number(cash.financingCashFlow), capitalExpenditure: number(cash.capitalExpenditure),
        freeCashFlow: number(cash.freeCashFlow), dividendPerShare: number(extra.dividendPerShare),
        source: { name, documentType: derived ? "DERIVED_ANNUAL" : "ANNUAL", reportingDate: end, sourceUrl: text(source.url) ?? undefined },
      },
      metadata: {
        fiscalYear: period, periodEnded: end, sourceType: "STORED_ANNUAL",
        official: !derived && ["NSE_INTEGRATED", "NSE_LEGACY"].includes(name),
        derived, consolidated, audited: typeof record.audited === "boolean" ? record.audited : null,
        contributingQuarterCount: 0,
        warnings: derived
          ? [...rowWarnings, "Saved derived annual record; contributing-quarter provenance is not exposed by this response."]
          : rowWarnings,
      },
    });
  }
  records.sort((a, b) => a.metadata.periodEnded.localeCompare(b.metadata.periodEnded));
  return { companyName: text(company.companyName), records, warnings };
}
