"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

type StockSearchResult = {
  symbol: string;
  companyName: string;
  exchange: string;
  instrumentKey: string;
  isin?: string;
};

type SearchApiResponse = {
  results?: StockSearchResult[];
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
  "All Sectors": ["All Industries"],

  "Information Technology": [
    "All Industries",
    "IT Services",
    "Software Products",
    "Digital Engineering",
    "Business Process Services",
  ],

  "Financial Services": [
    "All Industries",
    "Private Sector Banks",
    "Public Sector Banks",
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

  Consumer: [
    "All Industries",
    "FMCG",
    "Consumer Durables",
    "Retail",
    "Automobiles",
    "Auto Components",
  ],

  Energy: [
    "All Industries",
    "Oil and Gas",
    "Power",
    "Renewable Energy",
    "Coal",
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

  Telecommunications: [
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
      "Combines only the valuation methods suitable for the selected industry.",
  },
  {
    id: "dcf",
    label: "DCF",
    description:
      "Values future cash flows using growth, WACC and terminal assumptions.",
  },
  {
    id: "relative",
    label: "Relative",
    description:
      "Uses appropriate market multiples and the company’s historical range.",
  },
  {
    id: "peer",
    label: "Peer",
    description:
      "Compares the company with similar listed businesses and peer medians.",
  },
  {
    id: "graham",
    label: "Graham",
    description:
      "Used only where the company and industry are suitable for the method.",
  },
];

export default function FundamentalResearchTerminal() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] =
    useState("");

  const [searchResults, setSearchResults] =
    useState<StockSearchResult[]>([]);

  const [isSearching, setIsSearching] =
    useState(false);

  const [searchError, setSearchError] =
    useState("");

    const [
  highlightedResultIndex,
  setHighlightedResultIndex,
] = useState(-1);

const [
  isOpeningCompany,
  setIsOpeningCompany,
] = useState(false);

  const [selectedSector, setSelectedSector] =
    useState("All Sectors");

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

  const industries = useMemo(
    () =>
      sectorIndustries[selectedSector] ?? [
        "All Industries",
      ],
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
    const query = searchQuery.trim();

    if (query.length < 2) {
      setSearchResults([]);
      setSearchError("");
      setIsSearching(false);
      setHighlightedResultIndex(-1);
      return;
    }

    const controller =
      new AbortController();

    const timer = window.setTimeout(
      async () => {
        try {
          setIsSearching(true);
          setSearchError("");

          const response = await fetch(
            `/api/upstox/instruments/search?q=${encodeURIComponent(
              query
            )}`,
            {
              method: "GET",
              cache: "no-store",
              signal: controller.signal,
            }
          );

          const data =
            (await response.json()) as SearchApiResponse;

          if (!response.ok) {
            throw new Error(
              data.error ??
                "Unable to search companies"
            );
          }

          setSearchResults(
            Array.isArray(data.results)
              ? data.results.slice(0, 8)
              : []
          );
        } catch (error) {
          if (
            error instanceof Error &&
            error.name === "AbortError"
          ) {
            return;
          }

          console.error(
            "Fundamental company search error:",
            error
          );

          setSearchResults([]);
          setSearchError(
            "Company search is temporarily unavailable."
          );
        } finally {
          setIsSearching(false);
        }
      },
      350
    );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  function openCompany(
  company: StockSearchResult
) {
  if (isOpeningCompany) {
    return;
  }

  setIsOpeningCompany(true);
  setSearchResults([]);
  setHighlightedResultIndex(-1);

  const symbol = encodeURIComponent(
    company.symbol
  );

  const exchange = encodeURIComponent(
    company.exchange || "NSE"
  );

  /*
   * Every newly searched company opens
   * on the STFL Composite overview.
   * This prevents a previously selected
   * Peer/DCF/Graham tab from carrying
   * into the next company.
   */
  router.push(
    `/fundamental-research/${symbol}?exchange=${exchange}&method=composite`
  );
}

function handleSearchKeyDown(
  event:
    React.KeyboardEvent<HTMLInputElement>
) {
  if (
    searchResults.length === 0
  ) {
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();

    setHighlightedResultIndex(
      (currentIndex) =>
        currentIndex <
        searchResults.length - 1
          ? currentIndex + 1
          : 0
    );

    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();

    setHighlightedResultIndex(
      (currentIndex) =>
        currentIndex > 0
          ? currentIndex - 1
          : searchResults.length - 1
    );

    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();

    const selectedCompany =
      highlightedResultIndex >= 0
        ? searchResults[
            highlightedResultIndex
          ]
        : searchResults[0];

    if (selectedCompany) {
      openCompany(
        selectedCompany
      );
    }

    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    setSearchResults([]);
    setHighlightedResultIndex(-1);
  }
}

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-slate-800 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap gap-3">
  <Link
    href="/"
    className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-emerald-500 hover:text-emerald-300"
  >
    ← Back to Home
  </Link>
</div>
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-400">
                STFL Fundamental Research
              </p>

              <h1 className="mt-4 text-4xl font-bold md:text-6xl">
                Fundamental Research
                <span className="block text-emerald-400">
                  & Valuation Terminal
                </span>
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400">
                Study financial quality,
                growth, cash flow and
                valuation using
                industry-appropriate methods
                and explainable analysis.
              </p>
            </div>

            <div className="w-fit rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300">
              TERMINAL FOUNDATION
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
                Company Research
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Search a listed company
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Search by company name or
                NSE/BSE trading symbol.
              </p>
            </div>

            <div className="relative mt-6">
              <input
  type="search"
  value={searchQuery}
  onChange={(event) => {
    setSearchQuery(
      event.target.value
    );

    setHighlightedResultIndex(
      -1
    );
  }}
  onKeyDown={
    handleSearchKeyDown
  }
  disabled={
    isOpeningCompany
  }
  aria-label="Search a listed company"
  aria-autocomplete="list"
  aria-expanded={
    searchResults.length > 0
  }
  placeholder="Search RELIANCE, HDFCBANK, INFY..."
  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500 disabled:cursor-wait disabled:opacity-70"
/>
{isOpeningCompany && (
  <p className="mt-3 text-sm text-emerald-400">
    Opening company research…
  </p>
)}
              {isSearching && (
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                  Searching...
                </span>
              )}

              {searchResults.length > 0 && (
  <div className="absolute z-30 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 shadow-2xl">
    {searchResults.map(
      (company, index) => (
        <button
          key={
            company.instrumentKey
          }
          type="button"
          onClick={() =>
            openCompany(company)
          }
          onMouseEnter={() =>
            setHighlightedResultIndex(
              index
            )
          }
          className={`flex w-full items-center justify-between gap-4 border-b border-slate-800 px-5 py-4 text-left transition last:border-b-0 ${
            index ===
            highlightedResultIndex
              ? "bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/50"
              : "hover:bg-slate-900"
          }`}
        >
          <div className="min-w-0">
            <p className="font-semibold text-white">
              {company.symbol}
            </p>

            <p className="mt-1 truncate text-sm text-slate-400">
              {company.companyName}
            </p>
          </div>

          <span className="shrink-0 rounded-full border border-slate-700 px-3 py-1 text-xs text-emerald-400">
            {company.exchange}
          </span>
        </button>
      )
    )}
  </div>
)}

              {searchError && (
                <p className="mt-3 text-sm text-red-400">
                  {searchError}
                </p>
              )}

              {!isSearching &&
                searchQuery.trim().length >=
                  2 &&
                searchResults.length === 0 &&
                !searchError && (
                  <p className="mt-3 text-sm text-slate-500">
                    No matching listed
                    companies found.
                  </p>
                )}
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
                  Stock Discovery
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  Find fundamentally strong
                  companies
                </h2>
              </div>

              <p className="text-sm text-slate-500">
                Filter logic will use
                published financial data
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
                Valuation method
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
                  selectedMethod?.description
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
                disabled
                className="cursor-not-allowed rounded-xl bg-slate-800 px-6 py-3 text-sm font-semibold text-slate-500"
              >
                Screener integration next
              </button>
            </div>
          </div>

          <div className="mt-8 border-y border-slate-800 py-8">
            <div className="grid gap-8 md:grid-cols-3">
              <TerminalStep
                number="01"
                title="Financial Quality"
                description="Growth, profitability, capital efficiency, balance-sheet strength and cash-flow quality."
              />

              <TerminalStep
                number="02"
                title="Appropriate Valuation"
                description="DCF, relative, peer or Graham valuation selected according to the company and industry."
              />

              <TerminalStep
                number="03"
                title="Explainable Analysis"
                description="Every rating and AI observation will reference the published number or stated assumption behind it."
              />
            </div>
          </div>
        </div>
      </section>
    </main>
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

function TerminalStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-sm font-bold text-emerald-400">
        {number}
      </p>

      <h3 className="mt-3 text-lg font-bold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        {description}
      </p>
    </div>
  );
}