"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import FundamentalResearchNavigation from
  "./FundamentalResearchNavigation";


type NullableNumber =
  | number
  | null;


type ScreenerResult = {
  symbol: string;
  companyName: string;
  exchange: string;

  sector: string | null;
  industry: string | null;
  subIndustry?: string | null;

  marketCapCr: NullableNumber;
  marketCapCategory: string | null;

  investmentStyle?: string;

  styleScore: NullableNumber;
  styleRating?: string | null;

  fundamentalScore: NullableNumber;
  fundamentalRating?: string | null;

  valuationScore: NullableNumber;
  valuationRating?: string | null;

  compositeScore: NullableNumber;
  compositeRating?: string | null;

  dataQualityScore: NullableNumber;
  dataQualityRating?: string | null;

  latestAnnualPeriod: string | null;

  metrics: {
    revenueCagrPercent:
      NullableNumber;

    patCagrPercent:
      NullableNumber;

    roePercent:
      NullableNumber;

    rocePercent:
      NullableNumber;

    debtToEquity:
      NullableNumber;

    operatingCashFlowToPat:
      NullableNumber;

    priceToEarnings:
      NullableNumber;

    priceToBook:
      NullableNumber;
  };

  valuation: {
    method: string;
    currentPrice: NullableNumber;
    fairValue: NullableNumber;
    upsidePercent: NullableNumber;
    classification: string | null;
  } | null;

  reasons: string[];
  warnings: string[];
};


type ScreenerApiResponse = {
  results?: ScreenerResult[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  investmentStyle?: string;
  valuationMethod?: string;
  generatedAt?: string;
  error?: string;
  detail?: string;
};


type ValuationMethod =
  | "composite"
  | "dcf"
  | "relative"
  | "peer"
  | "graham";


const PAGE_SIZE = 10;


const sectorIndustries: Record<
  string,
  string[]
> = {
  "All Sectors": [
    "All Industries",
  ],

  "Information Technology": [
    "All Industries",
    "IT Services",
    "Software Products",
    "Digital Engineering",
    "Business Process Services",
  ],

  "Financial Services": [
    "All Industries",
    "Banking",
    "NBFC",
    "Insurance",
    "Asset Management",
    "Capital Markets",
  ],

  Healthcare: [
    "All Industries",
    "Pharmaceuticals",
    "Hospitals",
    "Diagnostics",
    "Healthcare Services",
  ],

  Industrials: [
    "All Industries",
    "Capital Goods",
    "Electrical Equipment",
    "Engineering",
    "Defence",
    "Construction",
  ],

  "Consumer Staples": [
    "All Industries",
    "FMCG",
    "Food Products",
    "Beverages",
  ],

  "Consumer Discretionary": [
    "All Industries",
    "Consumer Durables",
    "Retail",
    "Hotels",
    "Aviation",
  ],

  Automobile: [
    "All Industries",
    "Automobiles",
    "Auto Components",
  ],

  Energy: [
    "All Industries",
    "Oil and Gas",
    "Coal",
  ],

  Utilities: [
    "All Industries",
    "Power",
    "Renewable Energy",
  ],

  Materials: [
    "All Industries",
    "Metals",
    "Mining",
    "Cement",
    "Chemicals",
    "Fertilizers",
  ],

  "Real Estate": [
    "All Industries",
    "Residential",
    "Commercial",
    "Real Estate Services",
  ],

  "Communication Services": [
    "All Industries",
    "Telecom Services",
    "Telecom Equipment",
  ],
};


const valuationMethods: Array<{
  id: ValuationMethod;
  label: string;
  description: string;
}> = [
  {
    id: "composite",
    label: "STFL Composite",
    description:
      "Uses the valuation methods suitable for each company and industry.",
  },
  {
    id: "dcf",
    label: "DCF",
    description:
      "Uses discounted-cash-flow valuation where verified inputs are available.",
  },
  {
    id: "relative",
    label: "Relative",
    description:
      "Uses published market multiples and suitable historical benchmarks.",
  },
  {
    id: "peer",
    label: "Peer",
    description:
      "Uses valuation evidence from comparable listed businesses.",
  },
  {
    id: "graham",
    label: "Graham",
    description:
      "Uses Graham valuation where the company and industry are suitable.",
  },
];


const styleDescriptions:
  Record<string, string> = {
    Quality:
      "Prioritises profitability, capital efficiency, cash conversion and manageable debt.",

    Value:
      "Prioritises valuation upside, moderate P/E and P/B ratios, supported by business quality.",

    Growth:
      "Prioritises revenue growth, profit growth, ROE and ROCE.",

    GARP:
      "Balances growth, business quality and valuation so growth is not purchased at any price.",

    Dividend:
      "Prioritises dividend yield, sustainable payout and payment consistency. Results require verified dividend evidence.",

    Turnaround:
      "Prioritises improving revenue, profit, ROE and ROCE as indicators of potential recovery.",
  };


function getMarketCapQueryValue(
  value: string
): string {
  const values:
    Record<string, string> = {
      "Large Cap": "LARGE_CAP",
      "Mid Cap": "MID_CAP",
      "Small Cap": "SMALL_CAP",
      "Micro Cap": "MICRO_CAP",
    };

  return values[value] ?? value;
}


function getVisiblePages(
  currentPage: number,
  totalPages: number
): number[] {
  if (totalPages <= 0) {
    return [];
  }

  const maximumVisiblePages = 5;

  let firstPage = Math.max(
    1,
    currentPage - 2
  );

  let lastPage = Math.min(
    totalPages,
    firstPage +
      maximumVisiblePages -
      1
  );

  firstPage = Math.max(
    1,
    lastPage -
      maximumVisiblePages +
      1
  );

  lastPage = Math.min(
    totalPages,
    firstPage +
      maximumVisiblePages -
      1
  );

  return Array.from(
    {
      length:
        lastPage -
        firstPage +
        1,
    },
    (_, index) =>
      firstPage + index
  );
}


export default function StockDiscoveryTerminal() {
  const [
    selectedSector,
    setSelectedSector,
  ] = useState("All Sectors");

  const [
    selectedIndustry,
    setSelectedIndustry,
  ] = useState("All Industries");

  const [
    selectedMarketCap,
    setSelectedMarketCap,
  ] = useState("All");

  const [
    selectedInvestmentStyle,
    setSelectedInvestmentStyle,
  ] = useState("Quality");

  const [
    selectedValuationMethod,
    setSelectedValuationMethod,
  ] = useState<ValuationMethod>(
    "composite"
  );

  const [
    screenerResults,
    setScreenerResults,
  ] = useState<ScreenerResult[]>([]);

  const [
    isScreening,
    setIsScreening,
  ] = useState(false);

  const [
    hasRunScreener,
    setHasRunScreener,
  ] = useState(false);

  const [
    screenerError,
    setScreenerError,
  ] = useState("");

  const [
    screenerGeneratedAt,
    setScreenerGeneratedAt,
  ] = useState<string | null>(
    null
  );

  const [
    totalResults,
    setTotalResults,
  ] = useState(0);

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    totalPages,
    setTotalPages,
  ] = useState(0);

  const industries = useMemo(
    () =>
      sectorIndustries[
        selectedSector
      ] ?? ["All Industries"],
    [selectedSector]
  );

  const selectedMethod =
    valuationMethods.find(
      (method) =>
        method.id ===
        selectedValuationMethod
    );

  const visiblePages = useMemo(
    () =>
      getVisiblePages(
        currentPage,
        totalPages
      ),
    [
      currentPage,
      totalPages,
    ]
  );

  useEffect(() => {
    setSelectedIndustry(
      "All Industries"
    );
  }, [selectedSector]);

  useEffect(() => {
    setHasRunScreener(false);
    setScreenerResults([]);
    setScreenerError("");
    setScreenerGeneratedAt(null);
    setTotalResults(0);
    setCurrentPage(1);
    setTotalPages(0);
  }, [
    selectedSector,
    selectedIndustry,
    selectedMarketCap,
    selectedInvestmentStyle,
    selectedValuationMethod,
  ]);

  async function runScreener(
    requestedPage = 1
  ) {
    if (isScreening) {
      return;
    }

    try {
      setIsScreening(true);
      setHasRunScreener(true);
      setScreenerError("");

      const query =
        new URLSearchParams({
          sector: selectedSector,

          industry:
            selectedIndustry,

          marketCap:
            getMarketCapQueryValue(
              selectedMarketCap
            ),

          investmentStyle:
            selectedInvestmentStyle,

          valuationMethod:
            selectedValuationMethod,

          page:
            String(requestedPage),

          pageSize:
            String(PAGE_SIZE),
        });

      const response = await fetch(
        `/api/fundamental/screener?${query.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data =
        (await response.json()) as
          ScreenerApiResponse;

      if (!response.ok) {
        throw new Error(
          data.error ??
          data.detail ??
          "Unable to run the stock screener."
        );
      }

      setScreenerResults(
        Array.isArray(data.results)
          ? data.results
          : []
      );

      setTotalResults(
        data.total ?? 0
      );

      setCurrentPage(
        data.page ??
        requestedPage
      );

      setTotalPages(
        data.totalPages ?? 0
      );

      setScreenerGeneratedAt(
        data.generatedAt ?? null
      );
    } catch (error) {
      console.error(
        "Fundamental screener error:",
        error
      );

      setScreenerResults([]);
      setTotalResults(0);
      setTotalPages(0);

      setScreenerError(
        error instanceof Error
          ? error.message
          : "The stock screener is temporarily unavailable."
      );
    } finally {
      setIsScreening(false);
    }
  }

  function changePage(
    pageNumber: number
  ) {
    if (
      pageNumber < 1 ||
      pageNumber > totalPages ||
      pageNumber === currentPage ||
      isScreening
    ) {
      return;
    }

    void runScreener(
      pageNumber
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-slate-800 px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-400">
                STFL Stock Discovery
              </p>

              <h1 className="mt-4 text-4xl font-bold md:text-6xl">
                Find fundamentally
                <span className="block text-emerald-400">
                  strong companies
                </span>
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400">
                Screen and rank listed
                companies using published
                financial data, verified
                classifications and
                explainable scoring.
              </p>
            </div>

            <Link
              href="/"
              className="w-fit rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-emerald-500 hover:text-emerald-300"
            >
              ← Back to Home
            </Link>
          </div>

          <div className="mt-8">
            <FundamentalResearchNavigation />
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
                  Research Universe
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  Define your screening criteria
                </h2>
              </div>

              <p className="text-sm text-slate-500">
                Uses synchronized verified
                financial snapshots
              </p>
            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <FilterSelect
                label="Sector"
                value={selectedSector}
                options={Object.keys(
                  sectorIndustries
                )}
                onChange={
                  setSelectedSector
                }
              />

              <FilterSelect
                label="Industry"
                value={selectedIndustry}
                options={industries}
                onChange={
                  setSelectedIndustry
                }
              />

              <FilterSelect
                label="Market Cap"
                value={selectedMarketCap}
                options={[
                  "All",
                  "Large Cap",
                  "Mid Cap",
                  "Small Cap",
                  "Micro Cap",
                ]}
                onChange={
                  setSelectedMarketCap
                }
              />

              <FilterSelect
                label="Investment Style"
                value={
                  selectedInvestmentStyle
                }
                options={[
                  "Quality",
                  "Value",
                  "Growth",
                  "GARP",
                  "Dividend",
                  "Turnaround",
                ]}
                onChange={
                  setSelectedInvestmentStyle
                }
              />
            </div>

            <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-sm font-semibold text-emerald-300">
                {selectedInvestmentStyle}
                {" "}investment style
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-400">
                {
                  styleDescriptions[
                    selectedInvestmentStyle
                  ]
                }
              </p>
            </div>

            <div className="mt-8 border-t border-slate-800 pt-7">
              <p className="text-sm font-semibold text-white">
                Ranking valuation method
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                {valuationMethods.map(
                  (method) => {
                    const isSelected =
                      method.id ===
                      selectedValuationMethod;

                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() =>
                          setSelectedValuationMethod(
                            method.id
                          )
                        }
                        className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                            : "border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-600 hover:text-white"
                        }`}
                      >
                        {method.label}
                      </button>
                    );
                  }
                )}
              </div>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
                {
                  selectedMethod
                    ?.description
                }
              </p>
            </div>

            <div className="mt-8 flex flex-col justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950 p-5 md:flex-row md:items-center">
              <div>
                <p className="font-semibold text-white">
                  Selected research universe
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  {selectedSector} ·{" "}
                  {selectedIndustry} ·{" "}
                  {selectedMarketCap} ·{" "}
                  {
                    selectedInvestmentStyle
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void runScreener(1)
                }
                disabled={isScreening}
                className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-wait disabled:bg-slate-800 disabled:text-slate-500"
              >
                {isScreening
                  ? "Screening companies…"
                  : "Run Stock Discovery"}
              </button>
            </div>

            {screenerError && (
              <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                {screenerError}
              </div>
            )}

            {hasRunScreener &&
              !isScreening &&
              !screenerError &&
              screenerResults.length ===
                0 && (
                <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-6 text-center">
                  <p className="font-semibold text-white">
                    No companies matched
                    the selected criteria.
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    {selectedInvestmentStyle ===
                    "Dividend"
                      ? "Verified dividend metrics are not yet available in the synchronized screener snapshots."
                      : "Try a broader sector, market-cap category or investment style."}
                  </p>
                </div>
              )}

            {screenerResults.length >
              0 && (
              <ScreenerResultsTable
                results={
                  screenerResults
                }
                investmentStyle={
                  selectedInvestmentStyle
                }
                valuationMethod={
                  selectedValuationMethod
                }
                generatedAt={
                  screenerGeneratedAt
                }
                totalResults={
                  totalResults
                }
                currentPage={
                  currentPage
                }
                totalPages={
                  totalPages
                }
                visiblePages={
                  visiblePages
                }
                isLoading={
                  isScreening
                }
                onPageChange={
                  changePage
                }
              />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}


function ScreenerResultsTable({
  results,
  investmentStyle,
  valuationMethod,
  generatedAt,
  totalResults,
  currentPage,
  totalPages,
  visiblePages,
  isLoading,
  onPageChange,
}: {
  results: ScreenerResult[];
  investmentStyle: string;
  valuationMethod:
    ValuationMethod;
  generatedAt: string | null;
  totalResults: number;
  currentPage: number;
  totalPages: number;
  visiblePages: number[];
  isLoading: boolean;
  onPageChange:
    (page: number) => void;
}) {
  const firstResult =
    (currentPage - 1) *
      PAGE_SIZE +
    1;

  const lastResult =
    firstResult +
    results.length -
    1;

  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-800 p-5 md:flex-row md:items-center">
        <div>
          <p className="font-semibold text-white">
            Ranked discovery results
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Showing {firstResult}–
            {lastResult} of{" "}
            {totalResults.toLocaleString(
              "en-IN"
            )} companies
            {generatedAt
              ? ` · Updated ${formatDateTime(
                  generatedAt
                )}`
              : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">
            {investmentStyle}
          </span>

          <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {valuationMethod}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1480px] border-collapse text-sm">
          <thead className="bg-slate-900 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-4">
                Rank
              </th>

              <th className="px-4 py-4">
                Company
              </th>

              <th className="px-4 py-4">
                Market cap
              </th>

              <th className="px-4 py-4">
                Selected style
              </th>

              <th className="px-4 py-4">
                Business strength
              </th>

              <th className="px-4 py-4">
                Valuation attractiveness
              </th>

              <th className="px-4 py-4">
                STFL overall
              </th>

              <th className="px-4 py-4">
                Data confidence
              </th>

              <th className="px-4 py-4">
                Valuation view
              </th>

              <th className="px-4 py-4">
                Why selected
              </th>

              <th className="px-4 py-4">
                Research
              </th>
            </tr>
          </thead>

          <tbody>
            {results.map(
              (company, index) => {
                const researchUrl =
                  `/fundamental-research/${encodeURIComponent(
                    company.symbol
                  )}?exchange=${encodeURIComponent(
                    company.exchange ||
                      "NSE"
                  )}&method=${valuationMethod}`;

                return (
                  <tr
                    key={`${company.exchange}:${company.symbol}`}
                    className="border-t border-slate-800 align-top transition hover:bg-slate-900/50"
                  >
                    <td className="px-4 py-5 font-bold text-emerald-400">
                      {(currentPage - 1) *
                        PAGE_SIZE +
                        index +
                        1}
                    </td>

                    <td className="px-4 py-5">
                      <Link
                        href={researchUrl}
                        className="font-bold text-white transition hover:text-emerald-300"
                      >
                        {company.symbol}
                      </Link>

                      <p className="mt-1 max-w-56 text-xs leading-5 text-slate-500">
                        {
                          company.companyName
                        }
                      </p>

                      <p className="mt-2 text-xs text-slate-600">
                        {company.subIndustry ??
                          company.industry ??
                          company.sector ??
                          "Industry unavailable"}
                      </p>
                    </td>

                    <td className="px-4 py-5 text-slate-300">
                      {formatCrores(
                        company.marketCapCr
                      )}

                      <p className="mt-1 text-xs text-slate-500">
                        {formatMarketCapCategory(
                          company.marketCapCategory
                        )}
                      </p>
                    </td>

                    <ScoreCell
                      value={
                        company.styleScore
                      }
                      rating={
                        company.styleRating
                      }
                      highlight
                    />

                    <ScoreCell
                      value={
                        company.fundamentalScore
                      }
                      rating={
                        company.fundamentalRating
                      }
                    />

                    <ScoreCell
                      value={
                        company.valuationScore
                      }
                      rating={
                        company.valuationRating
                      }
                    />

                    <ScoreCell
                      value={
                        company.compositeScore
                      }
                      rating={
                        company.compositeRating
                      }
                    />

                    <ScoreCell
                      value={
                        company.dataQualityScore
                      }
                      rating={
                        company.dataQualityRating
                      }
                    />

                    <td className="px-4 py-5">
                      <p className="font-semibold text-white">
                        {company.valuation
                          ?.classification ??
                          "Insufficient data"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatPercent(
                          company.valuation
                            ?.upsidePercent ??
                            null
                        )} upside
                      </p>
                    </td>

                    <td className="px-4 py-5">
                      {company.reasons.length >
                      0 ? (
                        <ul className="max-w-72 space-y-1 text-xs leading-5 text-slate-400">
                          {company.reasons
                            .slice(0, 3)
                            .map(
                              (reason) => (
                                <li
                                  key={
                                    reason
                                  }
                                >
                                  • {reason}
                                </li>
                              )
                            )}
                        </ul>
                      ) : (
                        <span className="text-xs text-slate-600">
                          No explanation
                          available
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-5">
                      <div className="flex min-w-36 flex-col gap-2">
                        <Link
                          href={researchUrl}
                          className="rounded-lg bg-emerald-500 px-3 py-2 text-center text-xs font-bold text-slate-950 transition hover:bg-emerald-400"
                        >
                          View Research
                        </Link>

                        <Link
                          href={researchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-slate-700 px-3 py-2 text-center text-xs font-semibold text-slate-300 transition hover:border-emerald-500 hover:text-emerald-300"
                        >
                          Open New Tab
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col justify-between gap-4 border-t border-slate-800 p-5 md:flex-row md:items-center">
        <p className="text-sm text-slate-500">
          Page {currentPage} of{" "}
          {totalPages}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <PaginationButton
            label="Previous"
            disabled={
              currentPage <= 1 ||
              isLoading
            }
            onClick={() =>
              onPageChange(
                currentPage - 1
              )
            }
          />

          {visiblePages.map(
            (pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() =>
                  onPageChange(
                    pageNumber
                  )
                }
                disabled={isLoading}
                className={`h-9 min-w-9 rounded-lg border px-3 text-sm font-semibold transition ${
                  pageNumber ===
                  currentPage
                    ? "border-emerald-500 bg-emerald-500 text-slate-950"
                    : "border-slate-700 text-slate-400 hover:border-emerald-500 hover:text-emerald-300"
                }`}
              >
                {pageNumber}
              </button>
            )
          )}

          <PaginationButton
            label="Next"
            disabled={
              currentPage >=
                totalPages ||
              isLoading
            }
            onClick={() =>
              onPageChange(
                currentPage + 1
              )
            }
          />
        </div>
      </div>

      <ScoreExplanation
        investmentStyle={
          investmentStyle
        }
      />
    </div>
  );
}


function ScoreCell({
  value,
  rating,
  highlight = false,
}: {
  value: NullableNumber;
  rating?: string | null;
  highlight?: boolean;
}) {
  return (
    <td className="px-4 py-5">
      {value === null ? (
        <span className="text-xs text-slate-600">
          Not available
        </span>
      ) : (
        <div>
          <span
            className={`text-base font-bold ${
              highlight
                ? "text-emerald-300"
                : "text-white"
            }`}
          >
            {value.toFixed(1)}
          </span>

          <p className="mt-1 text-xs text-slate-500">
            {rating ??
              getScoreRating(value)}
          </p>
        </div>
      )}
    </td>
  );
}


function PaginationButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-400 transition hover:border-emerald-500 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}


function ScoreExplanation({
  investmentStyle,
}: {
  investmentStyle: string;
}) {
  return (
    <div className="border-t border-slate-800 bg-slate-900/50 p-5">
      <h3 className="font-semibold text-white">
        Understanding the scores
      </h3>

      <div className="mt-4 grid gap-4 text-sm leading-6 text-slate-400 md:grid-cols-2 xl:grid-cols-3">
        <ScoreDefinition
          title="Selected Style Score"
          description={`Ranks companies specifically for the ${investmentStyle} strategy. This determines the order shown in the table.`}
        />

        <ScoreDefinition
          title="Business Strength"
          description="Measures underlying quality using profitability, capital efficiency, cash conversion and balance-sheet strength."
        />

        <ScoreDefinition
          title="Valuation Attractiveness"
          description="Measures valuation upside together with available P/E and P/B evidence. Higher means more attractive."
        />

        <ScoreDefinition
          title="STFL Overall Score"
          description="A balanced view combining business quality, growth and valuation, adjusted for data confidence."
        />

        <ScoreDefinition
          title="Data Confidence"
          description="Indicates how complete and reliable the available financial inputs are. It is not an investment-return score."
        />

        <ScoreDefinition
          title="Score Guide"
          description="90–100 Exceptional · 75–89 Strong · 60–74 Good · 40–59 Mixed · Below 40 Weak."
        />
      </div>

      <p className="mt-5 text-xs leading-5 text-slate-600">
        Screener rankings are research
        aids, not investment
        recommendations. Review company
        filings, risks and valuation
        assumptions before making any
        decision.
      </p>
    </div>
  );
}


function ScoreDefinition({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <p className="font-semibold text-slate-200">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}


function getScoreRating(
  value: number
): string {
  if (value >= 90) {
    return "Exceptional";
  }

  if (value >= 75) {
    return "Strong";
  }

  if (value >= 60) {
    return "Good";
  }

  if (value >= 40) {
    return "Mixed";
  }

  return "Weak";
}


function formatMarketCapCategory(
  value: string | null
): string {
  if (!value) {
    return "Unclassified";
  }

  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}


function formatCrores(
  value: NullableNumber
): string {
  if (value === null) {
    return "Not available";
  }

  return `₹${value.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  )} Cr`;
}


function formatPercent(
  value: NullableNumber
): string {
  if (value === null) {
    return "Not available";
  }

  return `${
    value >= 0 ? "+" : ""
  }${value.toFixed(1)}%`;
}


function formatDateTime(
  value: string
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}


function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange:
    (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm text-slate-400">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
      >
        {options.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          )
        )}
      </select>
    </label>
  );
}