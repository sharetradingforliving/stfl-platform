"use client";

import Link from "next/link";
import PeerValuationPanel from "./PeerValuationPanel";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type ValuationMethod =
  | "composite"
  | "dcf"
  | "relative"
  | "peer"
  | "graham";

type FundamentalCompanyResearchProps = {
  symbol: string;
  exchange: "NSE" | "BSE";
  initialMethod?: string;
};

type MarketSnapshot = {
  currentPrice: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  marketCapitalization: number | null;
  enterpriseValue: number | null;
  sharesOutstanding: number | null;
  lastUpdated: string | null;
  source: string | null;
};

type FinancialPeriod = {
  period: string;
  periodType: string;
  endDate: string | null;
  revenue: number | null;
  ebitda: number | null;
  netProfit: number | null;
  epsDiluted: number | null;
  totalAssets: number | null;
  totalEquity: number | null;
  totalDebt: number | null;
  operatingCashFlow: number | null;
  freeCashFlow: number | null;
};

type Metrics = {
  growth?: {
    revenueGrowth1Y?: number | null;
    revenueCagr3Y?: number | null;
    ebitdaGrowth1Y?: number | null;
    patGrowth1Y?: number | null;
  };

  profitability?: {
    ebitdaMargin?: number | null;
    patMargin?: number | null;
    returnOnAssets?: number | null;
    returnOnEquity?: number | null;
    returnOnCapitalEmployed?:
      number | null;
    returnOnInvestedCapital?:
      number | null;
  };

  balanceSheet?: {
    debtToEquity?: number | null;
    netDebt?: number | null;
    netDebtToEbitda?: number | null;
    interestCoverage?: number | null;
    currentRatio?: number | null;
    quickRatio?: number | null;
  };

  cashFlow?: {
    operatingCashFlowToPat?:
      number | null;
    freeCashFlowToPat?:
      number | null;
    freeCashFlowMargin?:
      number | null;
    cashConversionLabel?:
      string | null;
  };

  valuation?: {
    earningsPerShare?: number | null;
    bookValuePerShare?: number | null;
    freeCashFlowPerShare?:
      number | null;
    priceToEarnings?: number | null;
    priceToBook?: number | null;
    priceToSales?: number | null;
    enterpriseValueToEbitda?:
      number | null;
    enterpriseValueToSales?:
      number | null;
  };

  industrySpecific?: {
    bank?: {
      netInterestMargin?:
        number | null;

      grossNpa?:
        number | null;

      netNpa?:
        number | null;

      returnOnAssets?:
        number | null;

      provisionCoverageRatio?:
        number | null;

      capitalAdequacyRatio?:
        number | null;

      casaRatio?:
        number | null;

      creditGrowth?:
        number | null;

      depositGrowth?:
        number | null;

      costToIncomeRatio?:
        number | null;

      creditCost?:
        number | null;
    };

    additionalMetrics?: Record<
      string,
      number | null
    >;
  };
};

type GrahamValuation = {
  applicable: boolean;
  suitabilityReason: string;
  fairValuePerShare: number | null;
  upsideDownsidePercent: number | null;
  valuationLabel?: string | null;
};

type DcfScenario = {
  name: "BEAR" | "BASE" | "BULL";
  fairValuePerShare: number | null;
  upsideDownsidePercent: number | null;
};

type DcfValuation = {
  applicable: boolean;
  suitabilityReason: string;
  scenarios: DcfScenario[];
  selectedFairValue: number | null;
  marginOfSafety: number | null;
  valuationLabel?: string | null;
};

type RelativeMultiple = {
  name: string;
  companyMultiple: number | null;
  historicalMedian: number | null;
  industryMedian: number | null;
  impliedFairValue: number | null;
  weight: number;
};

type RelativeValuation = {
  applicable: boolean;
  suitabilityReason: string;
  multiples: RelativeMultiple[];
  weightedFairValue: number | null;
  upsideDownsidePercent: number | null;
  valuationLabel?: string | null;
};

type WaccValuation = {
  applicable: boolean;
  suitabilityReason: string;
  wacc?: number | null;
  warnings?: string[];
};

type AnalyticsResponse = {
  status:
    | "success"
    | "partial"
    | "unavailable"
    | "error";

  symbol: string;
  companyName: string | null;
  market: MarketSnapshot | null;
  annualFinancials: FinancialPeriod[];
  quarterlyFinancials?: FinancialPeriod[];
  metrics: Metrics | null;

  valuation?: {
    graham?: GrahamValuation | null;
    dcf?: DcfValuation | null;
    relative?: RelativeValuation | null;
    wacc?: WaccValuation | null;
  };

  coverage?: {
    annualPeriods?: number;
    officialAnnualPeriods?: number;
    derivedAnnualPeriods?: number;
    newestPeriod?: string | null;
    oldestPeriod?: string | null;
  };

  warnings?: string[];
  diagnostics?: string[];
  generatedAt?: string;
  error?: string;
  details?: string;
};

const valuationMethods: Array<{
  id: ValuationMethod;
  label: string;
}> = [
  {
    id: "composite",
    label: "STFL Composite",
  },
  {
    id: "dcf",
    label: "DCF",
  },
  {
    id: "relative",
    label: "Relative",
  },
  {
    id: "peer",
    label: "Peer",
  },
  {
    id: "graham",
    label: "Graham",
  },
];

function normalizeMethod(
  method?: string
): ValuationMethod {
  const normalized =
    method?.trim().toLowerCase();

  return valuationMethods.some(
    (item) => item.id === normalized
  )
    ? (normalized as ValuationMethod)
    : "composite";
}

function formatNumber(
  value: number | null | undefined,
  maximumFractionDigits = 2
): string {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return "Not available";
  }

  return value.toLocaleString("en-IN", {
    maximumFractionDigits,
  });
}

function formatCurrency(
  value: number | null | undefined
): string {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return "Not available";
  }

  return `₹${value.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatPercent(
  value: number | null | undefined
): string {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return "Not available";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(
    2
  )}%`;
}

function formatLabel(
  value: string | null | undefined
): string {
  if (!value) {
    return "Insufficient data";
  }

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function getValueColour(
  value: number | null | undefined
): string {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return "text-slate-400";
  }

  return value >= 0
    ? "text-emerald-400"
    : "text-red-400";
}

function ResearchNavigation() {
  return (
    <nav
      aria-label="Fundamental research navigation"
      className="mb-6 flex flex-wrap gap-3"
    >
      <Link
        href="/fundamental-research"
        className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
      >
        ← Back to company search
      </Link>

      <Link
        href="/"
        className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
      >
        Home
      </Link>
    </nav>
  );
}

export default function FundamentalCompanyResearch({
  symbol,
  exchange,
  initialMethod,
}: FundamentalCompanyResearchProps) {
  const [
    selectedMethod,
    setSelectedMethod,
  ] = useState<ValuationMethod>(
    normalizeMethod(initialMethod)
  );

  const [analytics, setAnalytics] =
    useState<AnalyticsResponse | null>(
      null
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

    useEffect(() => {
  setSelectedMethod(
    normalizeMethod(initialMethod)
  );
}, [
  initialMethod,
  symbol,
]);

  useEffect(() => {
  const controller =
    new AbortController();

  let requestIsActive = true;

  async function loadAnalytics() {
    try {
      setIsLoading(true);
      setError("");
      setAnalytics(null);

      const assumptions =
        new URLSearchParams({
          forecastYears: "5",
          riskFreeRate: "6.8",
          beta: "1.05",
          equityRiskPremium: "6",
          freeCashFlowGrowthRate:
            "8",
          terminalGrowthRate: "5",
        });

      const response = await fetch(
        `/api/fundamental/analytics/${encodeURIComponent(
          symbol
        )}?${assumptions.toString()}`,
        {
          method: "GET",
          cache: "no-store",
          signal:
            controller.signal,
        }
      );

      const data =
        (await response.json()) as
          AnalyticsResponse;

      if (!response.ok) {
        throw new Error(
          data.details ??
            data.error ??
            "Unable to load fundamental research."
        );
      }

      if (requestIsActive) {
        setAnalytics(data);
      }
    } catch (requestError) {
      if (
        requestError instanceof Error &&
        requestError.name ===
          "AbortError"
      ) {
        return;
      }

      console.error(
        "Fundamental research error:",
        requestError
      );

      if (requestIsActive) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load fundamental research."
        );
      }
    } finally {
      /*
       * An aborted older request must
       * not change the loading state of
       * the new company request.
       */
      if (
        requestIsActive &&
        !controller.signal.aborted
      ) {
        setIsLoading(false);
      }
    }
  }

  loadAnalytics();

  return () => {
    requestIsActive = false;
    controller.abort();
  };
}, [symbol, exchange]);
          

  const latestAnnual = useMemo(
    () =>
      analytics?.annualFinancials
        ?.slice()
        .sort((first, second) =>
          (
            second.endDate ??
            second.period
          ).localeCompare(
            first.endDate ??
              first.period
          )
        )[0] ?? null,
    [analytics]
  );

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
            <ResearchNavigation />
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
              STFL Fundamental Research
            </p>

            <h1 className="mt-4 text-3xl font-bold">
              Loading {symbol} research…
            </h1>

            <p className="mt-3 text-slate-400">
              Reading published financial
              statements and calculating
              fundamental metrics.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !analytics) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
            <ResearchNavigation />
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-400">
              Research unavailable
            </p>

            <h1 className="mt-4 text-3xl font-bold">
              Unable to analyse {symbol}
            </h1>

            <p className="mt-3 text-red-200">
              {error}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const market = analytics.market;
  const metrics = analytics.metrics;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-slate-800 px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
                <ResearchNavigation />
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
                STFL Fundamental Research
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-bold md:text-5xl">
                  {analytics.companyName ??
                    symbol}
                </h1>

                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  {symbol}
                </span>

                <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
                  {exchange}
                </span>
              </div>

              <p className="mt-4 text-slate-400">
                Financial quality, valuation
                and explainable research
                based on published company
                filings.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-5">
              <p className="text-sm text-slate-400">
                Current market price
              </p>

              <p className="mt-1 text-3xl font-bold">
                {formatCurrency(
                  market?.currentPrice
                )}
              </p>

              <p
                className={`mt-1 text-sm font-semibold ${getValueColour(
                  market?.changePercent
                )}`}
              >
                {formatPercent(
                  market?.changePercent
                )}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Source:{" "}
                {market?.source ??
                  "Not available"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Revenue"
              value={
                latestAnnual?.revenue !==
                null &&
              latestAnnual?.revenue !==
                undefined
                  ? `₹${formatNumber(
                      latestAnnual.revenue
                    )} Cr`
                  : "Not available"
              }
              detail={
                latestAnnual?.period ??
                "Latest annual period"
              }
            />

            <MetricCard
              label="Net Profit"
              value={
                latestAnnual?.netProfit !==
                  null &&
                latestAnnual?.netProfit !==
                  undefined
                  ? `₹${formatNumber(
                      latestAnnual.netProfit
                    )} Cr`
                  : "Not available"
              }
              detail="Published annual result"
            />

            <MetricCard
              label="ROE"
              value={formatPercent(
                metrics?.profitability
                  ?.returnOnEquity
              )}
              detail="Return on equity"
            />

            <MetricCard
              label="ROCE"
              value={formatPercent(
                metrics?.profitability
                  ?.returnOnCapitalEmployed
              )}
              detail="Capital efficiency"
            />
          </div>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8">
  <h2 className="text-2xl font-bold">
    Financial quality
  </h2>

  <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
    {metrics?.industrySpecific?.bank ? (
      <>
        <MetricCard
          label="Return on Assets"
          value={formatPercent(
            metrics.industrySpecific.bank
              .returnOnAssets
          )}
          detail="Bank profitability"
        />

        <MetricCard
          label="Return on Equity"
          value={formatPercent(
            metrics.profitability
              ?.returnOnEquity
          )}
          detail="Shareholder profitability"
        />

        <MetricCard
          label="Gross NPA"
          value={formatPercent(
            metrics.industrySpecific.bank
              .grossNpa
          )}
          detail="Gross asset-quality ratio"
        />

        <MetricCard
          label="Net NPA"
          value={formatPercent(
            metrics.industrySpecific.bank
              .netNpa
          )}
          detail="Net asset-quality ratio"
        />

        <MetricCard
          label="Credit Growth"
          value={formatPercent(
            metrics.industrySpecific.bank
              .creditGrowth
          )}
          detail="Latest comparable growth"
        />

        <MetricCard
          label="Deposit Growth"
          value={formatPercent(
            metrics.industrySpecific.bank
              .depositGrowth
          )}
          detail="Latest comparable growth"
        />
      </>
    ) : (
      <>
        <MetricCard
          label="Revenue Growth"
          value={formatPercent(
            metrics?.growth
              ?.revenueGrowth1Y
          )}
          detail="Latest annual growth"
        />

        <MetricCard
          label="EBITDA Growth"
          value={formatPercent(
            metrics?.growth
              ?.ebitdaGrowth1Y
          )}
          detail="Latest annual growth"
        />

        <MetricCard
          label="PAT Growth"
          value={formatPercent(
            metrics?.growth
              ?.patGrowth1Y
          )}
          detail="Latest annual growth"
        />

        <MetricCard
          label="EBITDA Margin"
          value={formatPercent(
            metrics?.profitability
              ?.ebitdaMargin
          )}
          detail="Operating profitability"
        />

        <MetricCard
          label="Debt to Equity"
          value={formatNumber(
            metrics?.balanceSheet
              ?.debtToEquity
          )}
          detail="Balance-sheet leverage"
        />

        <MetricCard
          label="Cash Conversion"
          value={formatLabel(
            metrics?.cashFlow
              ?.cashConversionLabel
          )}
          detail="Operating cash flow quality"
        />
      </>
    )}
  </div>
</div>

          <AnnualFinancialTable
            periods={
              analytics.annualFinancials
            }
          />

          {(analytics.warnings?.length ??
            0) > 0 && (
            <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
              <h2 className="font-bold text-amber-300">
                Data warnings
              </h2>

              <ul className="mt-4 space-y-2 text-sm text-amber-100/80">
                {analytics.warnings?.map(
                  (warning) => (
                    <li key={warning}>
                      • {warning}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-white">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function ValuationPanel({
  method,
  analytics,
}: {
  method: ValuationMethod;
  analytics: AnalyticsResponse;
}) {
  const valuation =
    analytics.valuation;

  if (method === "graham") {
    const result = valuation?.graham;

    return (
      <ValuationResult
        title="Graham Valuation"
        applicable={
          result?.applicable ?? false
        }
        fairValue={
          result?.fairValuePerShare
        }
        upside={
          result?.upsideDownsidePercent
        }
        label={result?.valuationLabel}
        reason={
          result?.suitabilityReason ??
          "Graham valuation is unavailable."
        }
      />
    );
  }

  if (method === "dcf") {
    const result = valuation?.dcf;

    return (
      <div>
        <ValuationResult
          title="DCF Valuation"
          applicable={
            result?.applicable ?? false
          }
          fairValue={
            result?.selectedFairValue
          }
          upside={
            result?.marginOfSafety
          }
          label={result?.valuationLabel}
          reason={
            result?.suitabilityReason ??
            "DCF valuation is unavailable."
          }
        />

        {result?.scenarios &&
          result.scenarios.length > 0 && (
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {result.scenarios.map(
                (scenario) => (
                  <MetricCard
                    key={scenario.name}
                    label={`${scenario.name} Scenario`}
                    value={formatCurrency(
                      scenario.fairValuePerShare
                    )}
                    detail={formatPercent(
                      scenario.upsideDownsidePercent
                    )}
                  />
                )
              )}
            </div>
          )}
      </div>
    );
  }

  if (method === "relative") {
    const result =
      valuation?.relative;

    return (
      <ValuationResult
        title="Relative Valuation"
        applicable={
          result?.applicable ?? false
        }
        fairValue={
          result?.weightedFairValue
        }
        upside={
          result?.upsideDownsidePercent
        }
        label={result?.valuationLabel}
        reason={
          result?.suitabilityReason ??
          "Relative valuation requires verified benchmark inputs."
        }
      />
    );
  }

  if (method === "peer") {
  return (
    <PeerValuationPanel
      symbol={analytics.symbol}
    />
  );
}

  return (
    <ValuationResult
      title="STFL Composite Valuation"
      applicable={false}
      fairValue={null}
      upside={null}
      label={null}
      reason="Composite valuation becomes available after the applicable DCF, relative, peer and Graham methods are connected with their verified inputs."
    />
  );
}

function ValuationResult({
  title,
  applicable,
  fairValue,
  upside,
  label,
  reason,
}: {
  title: string;
  applicable: boolean;
  fairValue:
    | number
    | null
    | undefined;
  upside:
    | number
    | null
    | undefined;
  label:
    | string
    | null
    | undefined;
  reason: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-bold">
          {title}
        </h3>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            applicable
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-amber-500/40 bg-amber-500/10 text-amber-300"
          }`}
        >
          {applicable
            ? "AVAILABLE"
            : "INPUT REQUIRED"}
        </span>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <MetricCard
          label="Fair Value"
          value={formatCurrency(
            fairValue
          )}
          detail="Per share"
        />

        <MetricCard
          label="Upside / Downside"
          value={formatPercent(upside)}
          detail="Compared with market price"
        />

        <MetricCard
          label="Valuation View"
          value={formatLabel(label)}
          detail="Rule-based classification"
        />
      </div>

      <p className="mt-5 text-sm leading-6 text-slate-400">
        {reason}
      </p>
    </div>
  );
}

function getFiscalYearLabel(
  period: FinancialPeriod
): string {
  const existingLabel =
    period.period
      ?.trim()
      .toUpperCase();

  if (
    /^FY\d{2}$/.test(
      existingLabel
    )
  ) {
    return existingLabel;
  }

  const dateValue =
    period.endDate ??
    period.period;

  const yearMatch =
    dateValue?.match(
      /^(\d{4})/
    );

  if (!yearMatch) {
    return (
      period.period ||
      "Unknown period"
    );
  }

  return `FY${yearMatch[1].slice(
    -2
  )}`;
}

function isUsableNumber(
  value:
    | number
    | null
    | undefined
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function calculateChangePercent(
  current:
    | number
    | null
    | undefined,

  previous:
    | number
    | null
    | undefined
): number | null {
  if (
    !isUsableNumber(current) ||
    !isUsableNumber(previous) ||
    previous === 0
  ) {
    return null;
  }

  return (
    ((current - previous) /
      Math.abs(previous)) *
    100
  );
}

function describeChange(
  label: string,
  change: number | null
): string | null {
  if (change === null) {
    return null;
  }

  const absoluteChange =
    Math.abs(change).toFixed(1);

  if (change >= 15) {
    return `${label} increased strongly by ${absoluteChange}%`;
  }

  if (change >= 5) {
    return `${label} grew by ${absoluteChange}%`;
  }

  if (change > -5) {
    return `${label} remained broadly stable`;
  }

  if (change > -15) {
    return `${label} declined by ${absoluteChange}%`;
  }

  return `${label} declined sharply by ${absoluteChange}%`;
}

function buildAnnualInterpretation(
  period: FinancialPeriod,
  previousPeriod:
    | FinancialPeriod
    | null
): string {
  if (!previousPeriod) {
    const availableValues = [
      period.revenue,
      period.ebitda,
      period.netProfit,
      period.epsDiluted,
      period.totalDebt,
      period.freeCashFlow,
    ].filter(isUsableNumber).length;

    if (availableValues === 0) {
      return "Insufficient verified data is available for an automated interpretation.";
    }

    return "This is the earliest available annual period and forms the baseline for subsequent trend analysis.";
  }

  const observations: string[] =
    [];

  const revenueObservation =
    describeChange(
      "Revenue",
      calculateChangePercent(
        period.revenue,
        previousPeriod.revenue
      )
    );

  if (revenueObservation) {
    observations.push(
      revenueObservation
    );
  }

  const profitObservation =
    describeChange(
      "net profit",
      calculateChangePercent(
        period.netProfit,
        previousPeriod.netProfit
      )
    );

  if (profitObservation) {
    observations.push(
      profitObservation
    );
  }

  const epsObservation =
    describeChange(
      "diluted EPS",
      calculateChangePercent(
        period.epsDiluted,
        previousPeriod.epsDiluted
      )
    );

  if (epsObservation) {
    observations.push(
      epsObservation
    );
  }

  const cashFlowObservation =
    describeChange(
      "free cash flow",
      calculateChangePercent(
        period.freeCashFlow,
        previousPeriod.freeCashFlow
      )
    );

  if (cashFlowObservation) {
    observations.push(
      cashFlowObservation
    );
  }

  const debtChange =
    calculateChangePercent(
      period.totalDebt,
      previousPeriod.totalDebt
    );

  if (debtChange !== null) {
    if (debtChange <= -5) {
      observations.push(
        `debt reduced by ${Math.abs(
          debtChange
        ).toFixed(1)}%`
      );
    } else if (debtChange >= 5) {
      observations.push(
        `debt increased by ${debtChange.toFixed(
          1
        )}%`
      );
    }
  }

  if (observations.length === 0) {
    return "Comparable verified information is insufficient for an automated year-on-year interpretation.";
  }

  const selectedObservations =
    observations.slice(0, 3);

  return `${selectedObservations.join(
    ". "
  )}.`;
}

function AnnualFinancialTable({
  periods,
}: {
  periods: FinancialPeriod[];
}) {
  const sortedPeriods =
    periods
      .slice()
      .sort(
        (first, second) =>
          (
            first.endDate ??
            first.period
          ).localeCompare(
            second.endDate ??
              second.period
          )
      );

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <div className="p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">
              Annual financial
              statements
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Values shown in ₹ crore
              unless stated otherwise.
            </p>
          </div>

          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            Automated STFL AI
            Interpretation
          </span>
        </div>

        <p className="mt-4 text-xs leading-5 text-slate-500">
          Interpretations are generated
          automatically from verified
          annual values and year-on-year
          changes. Missing data is not
          estimated.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1250px] border-collapse text-sm">
          <thead className="bg-slate-950 text-left text-slate-400">
            <tr>
              <th className="px-5 py-4">
                Period
              </th>

              <th className="px-5 py-4">
                Revenue
              </th>

              <th className="px-5 py-4">
                EBITDA
              </th>

              <th className="px-5 py-4">
                Net Profit
              </th>

              <th className="px-5 py-4">
                EPS
              </th>

              <th className="px-5 py-4">
                Debt
              </th>

              <th className="px-5 py-4">
                Free Cash Flow
              </th>

              <th className="min-w-80 px-5 py-4">
                STFL AI Interpretation
              </th>
            </tr>
          </thead>

          <tbody>
            {sortedPeriods.map(
              (
                period,
                periodIndex
              ) => {
                const previousPeriod =
                  periodIndex > 0
                    ? sortedPeriods[
                        periodIndex - 1
                      ]
                    : null;

                return (
                  <tr
                    key={`${period.period}-${period.endDate}`}
                    className="border-t border-slate-800 align-top"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-emerald-300">
                      {getFiscalYearLabel(
                        period
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      {formatNumber(
                        period.revenue
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      {formatNumber(
                        period.ebitda
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      {formatNumber(
                        period.netProfit
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      {formatNumber(
                        period.epsDiluted
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      {formatNumber(
                        period.totalDebt
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      {formatNumber(
                        period.freeCashFlow
                      )}
                    </td>

                    <td className="max-w-md px-5 py-4 leading-6 text-slate-300">
                      {
                        buildAnnualInterpretation(
                          period,
                          previousPeriod
                        )
                      }
                    </td>
                  </tr>
                );
              }
            )}

            {sortedPeriods.length ===
              0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-10 text-center text-slate-500"
                >
                  No verified annual
                  financial periods are
                  available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}