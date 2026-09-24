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

  fundamentalScore: NullableNumber;
  valuationScore: NullableNumber;
  compositeScore: NullableNumber;
  dataQualityScore: NullableNumber;

  latestAnnualPeriod: string | null;

  metrics: {
    revenueCagrPercent:
      NullableNumber;
    patCagrPercent:
      NullableNumber;
    roePercent: NullableNumber;
    rocePercent: NullableNumber;
    debtToEquity: NullableNumber;
    operatingCashFlowToPat:
      NullableNumber;
    priceToEarnings:
      NullableNumber;
    priceToBook: NullableNumber;
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
  generatedAt?: string;
  error?: string;
};

type ValuationMethod =
  | "composite"
  | "dcf"
  | "relative"
  | "peer"
  | "graham";

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
      "Ranks companies using only the valuation methods suitable for each company and industry.",
  },
  {
    id: "dcf",
    label: "DCF",
    description:
      "Ranks companies using verified discounted-cash-flow valuation where the method is applicable.",
  },
  {
    id: "relative",
    label: "Relative",
    description:
      "Ranks companies using appropriate published market multiples and verified benchmarks.",
  },
  {
    id: "peer",
    label: "Peer",
    description:
      "Ranks companies using valuation evidence from comparable listed businesses.",
  },
  {
    id: "graham",
    label: "Graham",
    description:
      "Ranks companies using Graham valuation only where the company and industry are suitable.",
  },
];

function getMarketCapQueryValue(
  value: string
): string {
  const values: Record<
    string,
    string
  > = {
    "Large Cap": "LARGE_CAP",
    "Mid Cap": "MID_CAP",
    "Small Cap": "SMALL_CAP",
    "Micro Cap": "MICRO_CAP",
  };

  return values[value] ?? value;
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
  ] = useState<string | null>(null);

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
  }, [
    selectedSector,
    selectedIndustry,
    selectedMarketCap,
    selectedInvestmentStyle,
    selectedValuationMethod,
  ]);

  async function runScreener() {
    if (isScreening) {
      return;
    }

    try {
      setIsScreening(true);
      setHasRunScreener(true);
      setScreenerError("");
      setScreenerResults([]);
      setScreenerGeneratedAt(null);

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
          limit: "50",
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
            "Unable to run the stock screener."
        );
      }

      setScreenerResults(
        Array.isArray(data.results)
          ? data.results
          : []
      );

      setScreenerGeneratedAt(
        data.generatedAt ?? null
      );
    } catch (error) {
      console.error(
        "Fundamental screener error:",
        error
      );

      setScreenerError(
        error instanceof Error
          ? error.message
          : "The stock screener is temporarily unavailable."
      );
    } finally {
      setIsScreening(false);
    }
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
                  Define your screening
                  criteria
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
                  Selected research
                  universe
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
                onClick={runScreener}
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
                    Try a broader sector,
                    market-cap category or
                    investment style.
                  </p>
                </div>
              )}

            {screenerResults.length >
              0 && (
              <ScreenerResultsTable
                results={
                  screenerResults
                }
                valuationMethod={
                  selectedValuationMethod
                }
                generatedAt={
                  screenerGeneratedAt
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
  valuationMethod,
  generatedAt,
}: {
  results: ScreenerResult[];
  valuationMethod:
    ValuationMethod;
  generatedAt: string | null;
}) {
  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-800 p-5 md:flex-row md:items-center">
        <div>
          <p className="font-semibold text-white">
            Ranked discovery results
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {results.length} verified
            {results.length === 1
              ? " company"
              : " companies"}
            {generatedAt
              ? ` · Updated ${formatDateTime(
                  generatedAt
                )}`
              : ""}
          </p>
        </div>

        <span className="w-fit rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">
          {valuationMethod}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1260px] border-collapse text-sm">
          <thead className="bg-slate-900 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-4">
                Rank
              </th>
              <th className="px-5 py-4">
                Company
              </th>
              <th className="px-5 py-4">
                Market cap
              </th>
              <th className="px-5 py-4">
                Fundamental
              </th>
              <th className="px-5 py-4">
                Valuation
              </th>
              <th className="px-5 py-4">
                Composite
              </th>
              <th className="px-5 py-4">
                Data quality
              </th>
              <th className="px-5 py-4">
                Valuation view
              </th>
              <th className="px-5 py-4">
                Why selected
              </th>
              <th className="px-5 py-4">
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
                    className="border-t border-slate-800 align-top"
                  >
                    <td className="px-5 py-5 font-bold text-emerald-400">
                      {index + 1}
                    </td>

                    <td className="px-5 py-5">
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

                    <td className="px-5 py-5 text-slate-300">
                      {formatCrores(
                        company.marketCapCr
                      )}

                      <p className="mt-1 text-xs text-slate-500">
                        {company.marketCapCategory ??
                          "Unclassified"}
                      </p>
                    </td>

                    <ScoreCell
                      value={
                        company.fundamentalScore
                      }
                    />

                    <ScoreCell
                      value={
                        company.valuationScore
                      }
                    />

                    <ScoreCell
                      value={
                        company.compositeScore
                      }
                      highlight
                    />

                    <ScoreCell
                      value={
                        company.dataQualityScore
                      }
                    />

                    <td className="px-5 py-5">
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

                    <td className="px-5 py-5">
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

                    <td className="px-5 py-5">
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
    </div>
  );
}

function ScoreCell({
  value,
  highlight = false,
}: {
  value: NullableNumber;
  highlight?: boolean;
}) {
  return (
    <td className="px-5 py-5">
      {value === null ? (
        <span className="text-slate-600">
          Not available
        </span>
      ) : (
        <span
          className={`font-bold ${
            highlight
              ? "text-emerald-300"
              : "text-white"
          }`}
        >
          {value.toFixed(1)}
        </span>
      )}
    </td>
  );
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
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm text-slate-400">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
