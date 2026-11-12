"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

type NullableNumber =
  | number
  | null;

type FinancialRecord = {
  fiscalYear: number;
  fiscalYearLabel: string;
  periodStart: string | null;
  periodEnd: string;
  filingDate: string | null;
  periodType: string;
  consolidated: boolean | null;
  audited: boolean | null;
  currency: string;
  unitScale: string;

  source: {
    name: string;
    url: string | null;
    priority: number;
    isDerived: boolean;
  };

  dataQualityStatus: string;

    banking?: {
    deposits: NullableNumber;
    advances: NullableNumber;
    operatingProfitBeforeProvisions: NullableNumber;
    grossNpaPercent: NullableNumber;
    netNpaPercent: NullableNumber;
    reportedReturnOnAssetsPercent: NullableNumber;
  } | null;

  incomeStatement: {
    revenue: NullableNumber;
    totalIncome: NullableNumber;
    ebitda: NullableNumber;
    depreciation: NullableNumber;
    ebit: NullableNumber;
    financeCost: NullableNumber;
    profitBeforeTax: NullableNumber;
    taxExpense: NullableNumber;
    profitAfterTax: NullableNumber;
    epsBasic: NullableNumber;
    epsDiluted: NullableNumber;
  };

  balanceSheet: {
    totalAssets: NullableNumber;
    currentAssets: NullableNumber;
    cashAndEquivalents: NullableNumber;
    inventory: NullableNumber;
    tradeReceivables: NullableNumber;
    totalEquity: NullableNumber;
    shareCapital: NullableNumber;
    totalLiabilities: NullableNumber;
    currentLiabilities: NullableNumber;
    totalDebt: NullableNumber;
    sharesOutstanding: NullableNumber;
  };

  cashFlow: {
    operatingCashFlow: NullableNumber;
    investingCashFlow: NullableNumber;
    financingCashFlow: NullableNumber;
    capitalExpenditure: NullableNumber;
    freeCashFlow: NullableNumber;
    dividendsPaid: NullableNumber;
  };

  ratios: {
    calculationVersion: string;
    revenueGrowth: NullableNumber;
    ebitdaGrowth: NullableNumber;
    profitGrowth: NullableNumber;
    epsGrowth: NullableNumber;
    ebitdaMargin: NullableNumber;
    operatingMargin: NullableNumber;
    netProfitMargin: NullableNumber;
    returnOnEquity: NullableNumber;
    returnOnAssets: NullableNumber;
    returnOnCapitalEmployed: NullableNumber;
    currentRatio: NullableNumber;
    quickRatio: NullableNumber;
    debtToEquity: NullableNumber;
    debtToEbitda: NullableNumber;
    interestCoverage: NullableNumber;
    assetTurnover: NullableNumber;
    cashConversion: NullableNumber;
    freeCashFlowMargin: NullableNumber;
    dataQualityStatus: string;
  } | null;
};

type FinancialHistoryResponse = {
  status: string;

  company: {
    exchange: string;
    symbol: string;
    companyName: string | null;
    isin: string | null;
    sector: string | null;
    industry: string | null;
    companyType: string;
  };

  coverage: {
    requestedYears: number;
    availableAnnualPeriods: number;
    availableFiscalYears: number[];
    expectedFiscalYears: number[];
    missingFiscalYears: number[];
    oldestFiscalYear: number | null;
    newestFiscalYear: number | null;
    meetsFiveYearRequirement: boolean;
    coverageStatus: string;
  };

  records: FinancialRecord[];

  access?: {
    available: boolean;
    entitlement: string;
    reason: string;
  };
};

type ErrorResponse = {
  status?: string;
  error?: string;
  detail?: string;

  access?: {
    available?: boolean;
    entitlement?: string;
    reason?: string;
  };
};

type FinancialHistoryCardProps = {
  symbol: string;
  exchange: string;
};

type TabId =
  | "income"
  | "balance"
  | "cashflow"
  | "ratios";

type MetricDefinition = {
  label: string;
  getValue: (
    record: FinancialRecord
  ) => NullableNumber;
  format:
    | "amount"
    | "number"
    | "percent";
};

const tabs: Array<{
  id: TabId;
  label: string;
}> = [
  {
    id: "income",
    label: "Income Statement",
  },
  {
    id: "balance",
    label: "Balance Sheet",
  },
  {
    id: "cashflow",
    label: "Cash Flow",
  },
  {
    id: "ratios",
    label: "Financial Ratios",
  },
];

const incomeMetrics: MetricDefinition[] = [
  {
    label: "Revenue",
    getValue: (record) =>
      record.incomeStatement.revenue,
    format: "amount",
  },
  {
    label: "Total Income",
    getValue: (record) =>
      record.incomeStatement.totalIncome,
    format: "amount",
  },
  {
    label: "EBITDA",
    getValue: (record) =>
      record.incomeStatement.ebitda,
    format: "amount",
  },
  {
    label: "Depreciation",
    getValue: (record) =>
      record.incomeStatement.depreciation,
    format: "amount",
  },
  {
    label: "EBIT",
    getValue: (record) =>
      record.incomeStatement.ebit,
    format: "amount",
  },
  {
    label: "Finance Cost",
    getValue: (record) =>
      record.incomeStatement.financeCost,
    format: "amount",
  },
  {
    label: "Profit Before Tax",
    getValue: (record) =>
      record.incomeStatement.profitBeforeTax,
    format: "amount",
  },
  {
    label: "Tax Expense",
    getValue: (record) =>
      record.incomeStatement.taxExpense,
    format: "amount",
  },
  {
    label: "Profit After Tax",
    getValue: (record) =>
      record.incomeStatement.profitAfterTax,
    format: "amount",
  },
  {
    label: "Basic EPS",
    getValue: (record) =>
      record.incomeStatement.epsBasic,
    format: "number",
  },
  {
    label: "Diluted EPS",
    getValue: (record) =>
      record.incomeStatement.epsDiluted,
    format: "number",
  },
];

const balanceMetrics: MetricDefinition[] = [
  {
    label: "Total Assets",
    getValue: (record) =>
      record.balanceSheet.totalAssets,
    format: "amount",
  },
  {
    label: "Current Assets",
    getValue: (record) =>
      record.balanceSheet.currentAssets,
    format: "amount",
  },
  {
    label: "Cash and Equivalents",
    getValue: (record) =>
      record.balanceSheet.cashAndEquivalents,
    format: "amount",
  },
  {
    label: "Inventory",
    getValue: (record) =>
      record.balanceSheet.inventory,
    format: "amount",
  },
  {
    label: "Trade Receivables",
    getValue: (record) =>
      record.balanceSheet.tradeReceivables,
    format: "amount",
  },
  {
    label: "Total Equity",
    getValue: (record) =>
      record.balanceSheet.totalEquity,
    format: "amount",
  },
  {
    label: "Share Capital",
    getValue: (record) =>
      record.balanceSheet.shareCapital,
    format: "amount",
  },
  {
    label: "Total Liabilities",
    getValue: (record) =>
      record.balanceSheet.totalLiabilities,
    format: "amount",
  },
  {
    label: "Current Liabilities",
    getValue: (record) =>
      record.balanceSheet.currentLiabilities,
    format: "amount",
  },
  {
    label: "Total Debt",
    getValue: (record) =>
      record.balanceSheet.totalDebt,
    format: "amount",
  },
];

const cashFlowMetrics: MetricDefinition[] = [
  {
    label: "Operating Cash Flow",
    getValue: (record) =>
      record.cashFlow.operatingCashFlow,
    format: "amount",
  },
  {
    label: "Investing Cash Flow",
    getValue: (record) =>
      record.cashFlow.investingCashFlow,
    format: "amount",
  },
  {
    label: "Financing Cash Flow",
    getValue: (record) =>
      record.cashFlow.financingCashFlow,
    format: "amount",
  },
  {
    label: "Capital Expenditure",
    getValue: (record) =>
      record.cashFlow.capitalExpenditure,
    format: "amount",
  },
  {
    label: "Free Cash Flow",
    getValue: (record) =>
      record.cashFlow.freeCashFlow,
    format: "amount",
  },
  {
    label: "Dividends Paid",
    getValue: (record) =>
      record.cashFlow.dividendsPaid,
    format: "amount",
  },
];

const ratioMetrics: MetricDefinition[] = [
  {
    label: "Revenue Growth",
    getValue: (record) =>
      record.ratios?.revenueGrowth ??
      null,
    format: "percent",
  },
  {
    label: "EBITDA Growth",
    getValue: (record) =>
      record.ratios?.ebitdaGrowth ??
      null,
    format: "percent",
  },
  {
    label: "Profit Growth",
    getValue: (record) =>
      record.ratios?.profitGrowth ??
      null,
    format: "percent",
  },
  {
    label: "EPS Growth",
    getValue: (record) =>
      record.ratios?.epsGrowth ??
      null,
    format: "percent",
  },
  {
    label: "EBITDA Margin",
    getValue: (record) =>
      record.ratios?.ebitdaMargin ??
      null,
    format: "percent",
  },
  {
    label: "Operating Margin",
    getValue: (record) =>
      record.ratios?.operatingMargin ??
      null,
    format: "percent",
  },
  {
    label: "Net Profit Margin",
    getValue: (record) =>
      record.ratios?.netProfitMargin ??
      null,
    format: "percent",
  },
  {
    label: "Return on Equity",
    getValue: (record) =>
      record.ratios?.returnOnEquity ??
      null,
    format: "percent",
  },
  {
    label: "Return on Assets",
    getValue: (record) =>
      record.ratios?.returnOnAssets ??
      null,
    format: "percent",
  },
  {
    label: "Return on Capital Employed",
    getValue: (record) =>
      record.ratios
        ?.returnOnCapitalEmployed ??
      null,
    format: "percent",
  },
  {
    label: "Current Ratio",
    getValue: (record) =>
      record.ratios?.currentRatio ??
      null,
    format: "number",
  },
  {
    label: "Quick Ratio",
    getValue: (record) =>
      record.ratios?.quickRatio ??
      null,
    format: "number",
  },
  {
    label: "Debt to Equity",
    getValue: (record) =>
      record.ratios?.debtToEquity ??
      null,
    format: "number",
  },
  {
    label: "Debt to EBITDA",
    getValue: (record) =>
      record.ratios?.debtToEbitda ??
      null,
    format: "number",
  },
  {
    label: "Interest Coverage",
    getValue: (record) =>
      record.ratios?.interestCoverage ??
      null,
    format: "number",
  },
  {
    label: "Asset Turnover",
    getValue: (record) =>
      record.ratios?.assetTurnover ??
      null,
    format: "number",
  },
  {
    label: "Cash Conversion",
    getValue: (record) =>
      record.ratios?.cashConversion ??
      null,
    format: "percent",
  },
  {
    label: "Free Cash Flow Margin",
    getValue: (record) =>
      record.ratios
        ?.freeCashFlowMargin ??
      null,
    format: "percent",
  },
];

function formatAmount(
  value: NullableNumber
): string {
  if (
    value === null ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  ).format(value);
}

function formatNumber(
  value: NullableNumber
): string {
  if (
    value === null ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  ).format(value);
}

function formatPercent(
  value: NullableNumber
): string {
  if (
    value === null ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return `${new Intl.NumberFormat(
    "en-IN",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  ).format(value)}%`;
}

function formatMetricValue(
  value: NullableNumber,
  format: MetricDefinition["format"]
): string {
  if (format === "percent") {
    return formatPercent(value);
  }

  if (format === "number") {
    return formatNumber(value);
  }

  return formatAmount(value);
}

function getMetrics(
  activeTab: TabId,
  isBankingCompany: boolean
): MetricDefinition[] {
  if (!isBankingCompany) {
    if (activeTab === "balance") {
      return balanceMetrics;
    }

    if (activeTab === "cashflow") {
      return cashFlowMetrics;
    }

    if (activeTab === "ratios") {
      return ratioMetrics;
    }

    return incomeMetrics;
  }

  if (activeTab === "balance") {
    return [
      {
        label: "Deposits",
        getValue: (record) =>
          record.banking?.deposits ?? null,
        format: "amount",
      },
      {
        label: "Advances",
        getValue: (record) =>
          record.banking?.advances ?? null,
        format: "amount",
      },
      ...balanceMetrics.filter((metric) =>
        [
          "Total Assets",
          "Cash and Equivalents",
          "Total Equity",
          "Share Capital",
          "Total Liabilities",
        ].includes(metric.label)
      ),
    ];
  }

  if (activeTab === "cashflow") {
    return cashFlowMetrics.filter((metric) =>
      [
        "Operating Cash Flow",
        "Investing Cash Flow",
        "Financing Cash Flow",
        "Dividends Paid",
      ].includes(metric.label)
    );
  }

  if (activeTab === "ratios") {
    return [
      ...ratioMetrics
        .filter((metric) =>
          [
            "Revenue Growth",
            "Profit Growth",
            "Net Profit Margin",
            "Return on Equity",
            "Return on Assets",
          ].includes(metric.label)
        )
        .map((metric) => ({
          ...metric,
          label:
            metric.label === "Revenue Growth"
              ? "Total Income Growth"
              : metric.label === "Return on Assets"
                ? "ROA (PAT / Closing Assets)"
                : metric.label === "Return on Equity"
                  ? "ROE (PAT / Closing Equity)"
                  : metric.label,
        })),
      {
        label: "Gross NPA",
        getValue: (record) =>
          record.banking?.grossNpaPercent ?? null,
        format: "percent",
      },
      {
        label: "Net NPA",
        getValue: (record) =>
          record.banking?.netNpaPercent ?? null,
        format: "percent",
      },
      {
        label: "ROA (Reported)",
        getValue: (record) =>
          record.banking
            ?.reportedReturnOnAssetsPercent ?? null,
        format: "percent",
      },
    ];
  }

  return [
    ...incomeMetrics.filter(
      (metric) => metric.label === "Total Income"
    ),
    {
      label: "Operating Profit Before Provisions (PPOP)",
      getValue: (record) =>
        record.banking
          ?.operatingProfitBeforeProvisions ?? null,
      format: "amount",
    },
    ...incomeMetrics
      .filter((metric) =>
        [
          "Finance Cost",
          "Profit Before Tax",
          "Tax Expense",
          "Profit After Tax",
          "Basic EPS",
          "Diluted EPS",
        ].includes(metric.label)
      )
      .map((metric) => ({
        ...metric,
        label:
          metric.label === "Finance Cost"
            ? "Interest Expended"
            : metric.label,
      })),
  ];
}

function statusClass(
  status: string
): string {
  const normalized =
    status.trim().toUpperCase();

  if (
    normalized === "VERIFIED" ||
    normalized === "COMPLETE"
  ) {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (
    normalized === "INCOMPLETE" ||
    normalized.includes("WARNING")
  ) {
    return "border-amber-400/30 bg-amber-400/10 text-amber-300";
  }

  return "border-slate-600 bg-slate-800 text-slate-300";
}

export default function FinancialHistoryCard({
  symbol,
  exchange,
}: FinancialHistoryCardProps) {
  const [history, setHistory] =
    useState<FinancialHistoryResponse | null>(
      null
    );

  const [activeTab, setActiveTab] =
    useState<TabId>("income");

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [statusCode, setStatusCode] =
    useState<number | null>(null);

  useEffect(() => {
    const controller =
      new AbortController();

    let requestIsActive = true;

    async function loadHistory() {
      try {
        setIsLoading(true);
        setError("");
        setStatusCode(null);
        setHistory(null);

        const query =
          new URLSearchParams({
            exchange,
            years: "5",
          });

        const response = await fetch(
          `/api/fundamental/history/${encodeURIComponent(
            symbol
          )}?${query.toString()}`,
          {
            method: "GET",
            headers: {
              Accept:
                "application/json",
            },
            credentials: "same-origin",
            cache: "no-store",
            signal:
              controller.signal,
          }
        );

        const payload =
          (await response.json()) as
            | FinancialHistoryResponse
            | ErrorResponse;

        if (!response.ok) {
          const errorPayload =
            payload as ErrorResponse;

          throw Object.assign(
            new Error(
              errorPayload.error ??
                errorPayload.detail ??
                "Unable to load financial history."
            ),
            {
              status:
                response.status,
            }
          );
        }

        if (requestIsActive) {
          setHistory(
            payload as FinancialHistoryResponse
          );
        }
      } catch (requestError) {
        if (
          requestError instanceof
            DOMException &&
          requestError.name ===
            "AbortError"
        ) {
          return;
        }

        if (requestIsActive) {
          const possibleStatus =
            requestError &&
            typeof requestError ===
              "object" &&
            "status" in requestError &&
            typeof requestError.status ===
              "number"
              ? requestError.status
              : null;

          setStatusCode(
            possibleStatus
          );

          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load financial history."
          );
        }
      } finally {
        if (requestIsActive) {
          setIsLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      requestIsActive = false;
      controller.abort();
    };
  }, [
    symbol,
    exchange,
  ]);

  const records = useMemo(
    () =>
      [...(history?.records ?? [])]
        .sort(
          (first, second) =>
            second.fiscalYear -
            first.fiscalYear
        ),
    [history]
  );

    const companyType =
    history?.company.companyType
      ?.trim()
      .toUpperCase();

  const hasBankingValues = records.some(
    (record) =>
      [
        record.banking?.deposits,
        record.banking?.advances,
        record.banking?.grossNpaPercent,
        record.banking?.netNpaPercent,
      ].some(
        (value) =>
          typeof value === "number" &&
          Number.isFinite(value)
      )
  );

  const isBankingCompany =
    ["BANK", "BANKING"].includes(
      companyType ?? ""
    ) ||
    /\bbanks?\b/i.test(
      history?.company.industry ?? ""
    ) ||
    /\bbank\b/i.test(
      history?.company.companyName ?? ""
    ) ||
    hasBankingValues;

  const metrics = useMemo(
    () =>
      getMetrics(
        activeTab,
        isBankingCompany
      ),
    [activeTab, isBankingCompany]
  );

  if (isLoading) {
    return (
      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8">
        <div className="animate-pulse">
          <div className="h-7 w-72 rounded bg-slate-800" />

          <div className="mt-4 h-4 w-full max-w-2xl rounded bg-slate-800" />

          <div className="mt-8 h-72 rounded-xl bg-slate-950" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 md:p-8">
        <h2 className="text-xl font-bold text-red-300">
          Financial history unavailable
        </h2>

        <p className="mt-3 text-sm leading-6 text-red-100/80">
          {error}
        </p>

        {statusCode === 401 && (
          <Link
            href="/login"
            className="mt-5 inline-flex rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            Sign in
          </Link>
        )}

        {statusCode === 403 && (
          <Link
            href="/premium"
            className="mt-5 inline-flex rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
          >
            View Premium plans
          </Link>
        )}
      </section>
    );
  }

  if (
    !history ||
    records.length === 0
  ) {
    return (
      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8">
        <h2 className="text-xl font-bold">
          Historical Financials
        </h2>

        <p className="mt-3 text-sm text-slate-400">
          No stored annual financial
          history is currently available
          for {exchange}:{symbol}.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-white">
              Premium Financial History
            </h2>

            <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300">
              STFL PREMIUM
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Annual financial statements,
            available cash flows and
            calculated ratios for{" "}
            {history.company.companyName ??
              history.company.symbol}.
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Monetary values are shown in{" "}
            {records[0]?.unitScale ??
              "CRORES"}.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
              history.coverage
                .coverageStatus
            )}`}
          >
            {
              history.coverage
                .availableAnnualPeriods
            }
            /
            {
              history.coverage
                .requestedYears
            }{" "}
            years available
          </span>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
              records[0]
                ?.dataQualityStatus ??
                "UNKNOWN"
            )}`}
          >
            {records[0]
              ?.dataQualityStatus ??
              "UNKNOWN"}
          </span>
        </div>
      </div>

      {!history.coverage
        .meetsFiveYearRequirement && (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
  <h3 className="font-semibold text-amber-900 dark:text-amber-300">
    Historical coverage is incomplete
  </h3>

  <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-100/80">
    Verified records are available for{" "}
    {history.coverage.availableFiscalYears
      .map(
        (year) =>
          `FY${String(year).slice(-2)}`
      )
      .join(", ")}
    . Missing periods:{" "}
    {history.coverage.missingFiscalYears
      .map(
        (year) =>
          `FY${String(year).slice(-2)}`
      )
      .join(", ") || "none"}
    . STFL does not estimate or manufacture
    missing financial statements.
  </p>
</div>
      )}

      <div className="mt-7 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() =>
              setActiveTab(tab.id)
            }
            aria-pressed={
              activeTab === tab.id
            }
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

            {isBankingCompany && (
        <p className="mt-4 text-xs leading-5 text-slate-500">
          Banking metrics are shown where available.
          Missing disclosures remain a dash.
          Reported ROA is shown separately from
          PAT divided by closing assets.
        </p>
      )}

      <div className="mt-5 overflow-x-auto rounded-xl border border-slate-800">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-950">
            <tr>
              <th className="sticky left-0 z-10 min-w-56 border-b border-r border-slate-800 bg-slate-950 px-4 py-4 text-left font-semibold text-slate-300">
                Financial metric
              </th>

              {records.map(
                (record) => (
                  <th
                    key={
                      record.fiscalYear
                    }
                    className="min-w-36 border-b border-slate-800 px-4 py-4 text-right"
                  >
                    <div className="font-bold text-white">
                      {
                        record.fiscalYearLabel
                      }
                    </div>

                    <div className="mt-1 text-xs font-normal text-slate-500">
                      {
                        record.periodEnd
                      }
                    </div>
                    {record.source.isDerived && (
  <div className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-300">
    Derived from quarters
  </div>
)}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {metrics.map(
              (metric, index) => (
                <tr
                  key={metric.label}
                  className={
                    index % 2 === 0
                      ? "bg-slate-900"
                      : "bg-slate-950/50"
                  }
                >
                  <th className="sticky left-0 z-10 border-r border-t border-slate-800 bg-inherit px-4 py-3 text-left font-medium text-slate-300">
                    {metric.label}
                  </th>

                  {records.map(
                    (record) => {
                      const value =
                        metric.getValue(
                          record
                        );

                      return (
                        <td
                          key={`${record.fiscalYear}-${metric.label}`}
                          className={`border-t border-slate-800 px-4 py-3 text-right font-medium ${
                            value !== null &&
                            value < 0
                              ? "text-red-300"
                              : "text-slate-200"
                          }`}
                        >
                          {formatMetricValue(
                            value,
                            metric.format
                          )}
                        </td>
                      );
                    }
                  )}
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

            <details className="group mt-6 overflow-hidden rounded-xl border border-slate-800">
        <summary className="cursor-pointer px-4 py-4 text-sm font-semibold text-slate-300 transition hover:text-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500">
          Sources &amp; data quality
          <span className="ml-2 text-xs font-normal text-slate-500">
            ({records.length} annual periods)
          </span>
        </summary>

        <div className="overflow-x-auto border-t border-slate-800">
          <table className="min-w-full border-collapse text-left text-sm">
            <caption className="sr-only">
              Financial statement sources and data quality
            </caption>

            <thead className="bg-slate-950 text-xs text-slate-400">
              <tr>
                {[
                  "Period",
                  "Source",
                  "Reporting basis",
                  "Statement status",
                  "Data completeness",
                  "Filing",
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 font-semibold"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {records.map((record) => (
                <tr
                  key={`source-${record.fiscalYear}`}
                  className="border-t border-slate-800"
                >
                  <th
                    scope="row"
                    className="whitespace-nowrap px-4 py-3 font-semibold text-slate-300"
                  >
                    {record.fiscalYearLabel}
                  </th>

                  <td className="px-4 py-3 text-slate-400">
                    {record.source.name === "NSE_INTEGRATED"
                      ? "NSE integrated filing"
                      : record.source.name === "NSE_LEGACY"
                        ? "NSE legacy filing"
                        : record.source.isDerived
                          ? "NSE quarterly filings"
                          : record.source.name}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                    {record.consolidated === true
                      ? "Consolidated"
                      : record.consolidated === false
                        ? "Standalone"
                        : "Unavailable"}
                  </td>

                  <td className="px-4 py-3 text-slate-400">
                    {record.source.isDerived ? (
                      <span className="text-amber-600 dark:text-amber-300">
                        Derived from quarters;
                        not an audited annual filing
                      </span>
                    ) : record.audited === true ? (
                      "Audited annual filing"
                    ) : record.audited === false ? (
                      "Unaudited"
                    ) : (
                      "Audit status unavailable"
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClass(
                        record.dataQualityStatus
                      )}`}
                    >
                      {record.dataQualityStatus}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    {record.source.url ? (
                      <a
                        href={record.source.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={`View source filing for ${record.fiscalYearLabel}`}
                        className="font-semibold text-emerald-400 underline-offset-4 hover:underline"
                      >
                        {record.source.isDerived
                          ? "View linked filing"
                          : "View filing"}
                      </a>
                    ) : (
                      <span className="text-slate-500">
                        Unavailable
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="border-t border-slate-800 px-4 py-3 text-xs leading-5 text-slate-500">
          Data completeness reflects the fields available
          in stored records. Missing values appear as
          a dash in the financial tables. For derived
          periods, the linked document may represent
          only one contributing quarter.
        </p>
      </details>

      <p className="mt-6 text-xs leading-5 text-slate-500">
        Financial information is provided
        for research and educational
        purposes. Ratios are calculated
        from stored financial statements
        and should be read together with
        the original exchange filing.
      </p>
    </section>
  );
}