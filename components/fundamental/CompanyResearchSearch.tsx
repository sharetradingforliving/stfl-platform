"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import FundamentalResearchNavigation from
  "./FundamentalResearchNavigation";

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

export default function CompanyResearchSearch() {
  const router = useRouter();

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    searchResults,
    setSearchResults,
  ] = useState<StockSearchResult[]>([]);

  const [
    isSearching,
    setIsSearching,
  ] = useState(false);

  const [
    searchError,
    setSearchError,
  ] = useState("");

  const [
    highlightedResultIndex,
    setHighlightedResultIndex,
  ] = useState(-1);

  const [
    isOpeningCompany,
    setIsOpeningCompany,
  ] = useState(false);

  useEffect(() => {
    const query =
      searchQuery.trim();

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
              signal:
                controller.signal,
            }
          );

          const data =
            (await response.json()) as
              SearchApiResponse;

          if (!response.ok) {
            throw new Error(
              data.error ??
                "Unable to search companies."
            );
          }

          setSearchResults(
            Array.isArray(data.results)
              ? data.results.slice(
                  0,
                  8
                )
              : []
          );
        } catch (error) {
          if (
            error instanceof Error &&
            error.name ===
              "AbortError"
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

    const symbol =
      encodeURIComponent(
        company.symbol
      );

    const exchange =
      encodeURIComponent(
        company.exchange || "NSE"
      );

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
      <section className="border-b border-slate-800 px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-400">
                STFL Company Research
              </p>

              <h1 className="mt-4 text-4xl font-bold md:text-6xl">
                Research and value
                <span className="block text-emerald-400">
                  a listed company
                </span>
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400">
                Review financial quality,
                growth, cash flow and
                industry-appropriate
                valuation using verified
                published information.
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
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
                Company Search
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
                  searchResults.length >
                  0
                }
                placeholder="Search RELIANCE, HDFCBANK, INFY..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-5 py-4 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500 disabled:cursor-wait disabled:opacity-70"
              />

              {isSearching && (
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                  Searching...
                </span>
              )}

              {searchResults.length >
                0 && (
                <div className="absolute z-30 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 shadow-2xl">
                  {searchResults.map(
                    (
                      company,
                      index
                    ) => (
                      <button
                        key={`${company.exchange}:${company.instrumentKey}:${company.symbol}`}
                        type="button"
                        onClick={() =>
                          openCompany(
                            company
                          )
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
                            {
                              company.symbol
                            }
                          </p>

                          <p className="mt-1 truncate text-sm text-slate-400">
                            {
                              company.companyName
                            }
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full border border-slate-700 px-3 py-1 text-xs text-emerald-400">
                          {
                            company.exchange
                          }
                        </span>
                      </button>
                    )
                  )}
                </div>
              )}

              {isOpeningCompany && (
                <p className="mt-3 text-sm text-emerald-400">
                  Opening company
                  research…
                </p>
              )}

              {searchError && (
                <p className="mt-3 text-sm text-red-400">
                  {searchError}
                </p>
              )}

              {!isSearching &&
                searchQuery.trim()
                  .length >= 2 &&
                searchResults.length ===
                  0 &&
                !searchError &&
                !isOpeningCompany && (
                  <p className="mt-3 text-sm text-slate-500">
                    No matching listed
                    companies found.
                  </p>
                )}
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <ResearchFeature
              number="01"
              title="Financial Quality"
              description="Growth, profitability, capital efficiency, balance-sheet strength and cash-flow quality."
            />

            <ResearchFeature
              number="02"
              title="Appropriate Valuation"
              description="DCF, relative, peer or Graham valuation selected according to the company and industry."
            />

            <ResearchFeature
              number="03"
              title="Explainable Analysis"
              description="Every rating and observation references published data or an explicitly stated assumption."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function ResearchFeature({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
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
