import "server-only";

import {
  getNseFinancialSeries,
} from "@/lib/fundamental/services/nseFinancialSeries";

import {
  deriveAnnualFinancials,
} from "@/lib/fundamental/services/deriveAnnualFinancials";

export async function synchronizeNseAnnualArchive(
  symbol: string,
  exchange: string,
  backendUrl: string
): Promise<boolean> {
  const syncToken =
    process.env.FINANCIAL_HISTORY_SYNC_TOKEN;

  if (!syncToken) {
    return false;
  }

  const series = await getNseFinancialSeries(
    symbol,
    {
      quarterlyLimit: 24,
      annualLimit: 10,
    }
  );

  const derived = deriveAnnualFinancials(
    series.quarterly,
    series.annual
  );

  const officialRecords = series.annual.map(
    (annual) => ({
      fiscalYear:
        `FY${annual.periodEnded.slice(2, 4)}`,

      periodEnded: annual.periodEnded,

      sourceType: annual.sourceType,

      consolidated: annual.consolidated,

      audited: annual.audited,

      financialPeriod: annual.financialPeriod,

      warnings: annual.warnings,
    })
  );

  const derivedRecords = derived.annual
    .filter((annual) => {
      const year = Number(
        annual.periodEnded.slice(0, 4)
      );

      const expectedDates = [
        `${year - 1}-06-30`,
        `${year - 1}-09-30`,
        `${year - 1}-12-31`,
        `${year}-03-31`,
      ];

      /*
       * Require four exact quarters with a
       * consistent consolidated reporting basis.
       */
      return (
        annual.contributingQuarters.length === 4 &&
        expectedDates.every((date) => {
          const contribution =
            annual.contributingQuarters.find(
              (quarter) =>
                quarter.periodEnded === date
            );

          const quarter = series.quarterly.find(
            (item) =>
              item.periodEnded === date
          );

          if (
            !contribution ||
            contribution.consolidated !== true ||
            !quarter ||
            quarter.consolidated !== true
          ) {
            return false;
          }

          const end = new Date(
            `${date}T00:00:00Z`
          );

          const expectedStart = new Date(
            Date.UTC(
              end.getUTCFullYear(),
              end.getUTCMonth() - 2,
              1
            )
          )
            .toISOString()
            .slice(0, 10);

          return (
            quarter.financialPeriod.startDate ===
              expectedStart &&
            quarter.financialPeriod.endDate ===
              date &&
            quarter.financialPeriod.currency ===
              annual.financialPeriod.currency &&
            quarter.financialPeriod.unit ===
              annual.financialPeriod.unit &&
            quarter.durationDays >= 70 &&
            quarter.durationDays <= 110
          );
        })
      );
    })
    .map((annual) => ({
      fiscalYear: annual.fiscalYear,

      periodEnded: annual.periodEnded,

      sourceType: "NSE_DERIVED",

      consolidated: true,

      audited: false,

      /*
       * Preserve original normalized values before
       * corporate-action restatement.
       */
      financialPeriod: {
        ...annual.financialPeriod,

        source: {
          ...annual.financialPeriod.source,

          // The current backend uses this as filingDate.
          fetchedAt: null,

          contributingQuarters:
            annual.contributingQuarters,
        },
      },

      warnings: [
        ...annual.warnings,
        "Derived from four validated NSE quarters; not an audited annual filing.",
      ],
    }));

  const records = [
    ...officialRecords,
    ...derivedRecords,
  ].filter((annual) => {
    const period = annual.financialPeriod;

    const start = period.startDate
      ? Date.parse(period.startDate)
      : NaN;

    const end = period.endDate
      ? Date.parse(period.endDate)
      : NaN;

    const days =
      (end - start) / 86_400_000;

    return (
      annual.consolidated === true &&
      period.periodType === "ANNUAL" &&
      period.endDate === annual.periodEnded &&
      Number.isFinite(days) &&
      days >= 300 &&
      days <= 380 &&
      period.currency === "INR" &&
      period.unit === "CRORES" &&
      [
        period.revenue,
        period.profitBeforeTax,
        period.netProfit,
      ].every(
        (value) =>
          typeof value === "number" &&
          Number.isFinite(value)
      )
    );
  });

  if (records.length === 0) {
    return false;
  }

  const syncUrl = new URL(
    `${backendUrl.replace(/\/$/, "")}/api/fundamental/history/sync`
  );

  syncUrl.searchParams.set(
    "exchange",
    exchange
  );

  const response = await fetch(syncUrl, {
    method: "POST",

    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-STFL-Sync-Token": syncToken,
    },

    cache: "no-store",

    body: JSON.stringify({
      symbol,
      exchange,
      companyName: series.companyName,
      annual: records,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Financial-history sync returned HTTP ${response.status}.`
    );
  }

  const result = await response.json();

  if (Number(result.rejected ?? 0) > 0) {
    console.warn(
      "Some financial-history records were rejected:",
      symbol,
      result.warnings
    );
  }

  return (
    Number(result.inserted ?? 0) +
      Number(result.updated ?? 0) >
    0
  );
}