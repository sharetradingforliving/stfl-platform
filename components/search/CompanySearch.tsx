"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type StockSearchResult = {
  symbol: string;
  companyName: string;
  exchange: string;
  instrumentKey: string;
};

type CompanySearchProps = {
  title?: string;
  description?: string;
  variant?: "full" | "compact";
};

export default function CompanySearch({
  title = "Search a Company",
  description = "Search NSE or BSE companies by company name or stock symbol.",
  variant = "full",
}: CompanySearchProps) {
      const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");

  const [searchResults, setSearchResults] = useState<
    StockSearchResult[]
  >([]);

  const [isSearching, setIsSearching] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(-1);

  const [selectedExchange, setSelectedExchange] =
    useState<"NSE" | "BSE">("NSE");

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const searchTimer = setTimeout(async () => {
      try {
        setIsSearching(true);

        const response = await fetch(
          `/api/upstox/instruments/search?q=${encodeURIComponent(
            trimmedQuery
          )}`
        );

        if (!response.ok) {
          throw new Error(
            "Unable to search the Upstox instrument master"
          );
        }

        const data = await response.json();

        const exchangeResults = (
          data.results ?? []
        ).filter(
          (stock: StockSearchResult) =>
            stock.exchange === selectedExchange
        );

        setSearchResults(exchangeResults);
      } catch (error) {
        console.error(
          "Company search error:",
          error
        );

        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      clearTimeout(searchTimer);
    };
  }, [searchQuery, selectedExchange]);

  function openCompany(
    stock: StockSearchResult
  ) {
    setSearchQuery(stock.symbol);
    setSearchResults([]);

    router.push(
      `/company/${stock.symbol.toLowerCase()}?exchange=${stock.exchange}`
    );
  }

  function handleSearchKeyDown(
  event: React.KeyboardEvent<HTMLInputElement>
) {
  if (searchResults.length === 0) {
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();

    setActiveResultIndex((currentIndex) =>
      currentIndex < searchResults.length - 1
        ? currentIndex + 1
        : 0
    );
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();

    setActiveResultIndex((currentIndex) =>
      currentIndex > 0
        ? currentIndex - 1
        : searchResults.length - 1
    );
  }

  if (event.key === "Enter") {
    event.preventDefault();

    const selectedStock =
      searchResults[
        activeResultIndex >= 0
          ? activeResultIndex
          : 0
      ];

    if (selectedStock) {
      openCompany(selectedStock);
    }
  }

  if (event.key === "Escape") {
    setSearchResults([]);
    setActiveResultIndex(-1);
  }
}
  if (variant === "compact") {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

        <div className="shrink-0">

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Search Another Company
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Open another company dashboard
          </p>

        </div>

        <div className="flex shrink-0 gap-2">

          <button
            type="button"
            onClick={() => setSelectedExchange("NSE")}
            className={`rounded-lg border px-4 py-2 text-xs font-semibold transition ${
              selectedExchange === "NSE"
                ? "border-emerald-500 bg-emerald-500 text-slate-950"
                : "border-slate-700 text-slate-400 hover:border-emerald-500 hover:text-emerald-400"
            }`}
          >
            NSE
          </button>

          <button
            type="button"
            onClick={() => setSelectedExchange("BSE")}
            className={`rounded-lg border px-4 py-2 text-xs font-semibold transition ${
              selectedExchange === "BSE"
                ? "border-emerald-500 bg-emerald-500 text-slate-950"
                : "border-slate-700 text-slate-400 hover:border-emerald-500 hover:text-emerald-400"
            }`}
          >
            BSE
          </button>

        </div>

        <div className="relative min-w-0 flex-1">

          <input
            type="search"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
            onKeyDown={handleSearchKeyDown}
            placeholder={`Search ${selectedExchange} company or symbol`}
            autoComplete="off"
            className="w-full rounded-xl border border-slate-700 bg-[#020817] px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
          />

          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
            🔍
          </span>

          {searchQuery.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-full z-[100] mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 shadow-2xl">

              {isSearching ? (
                <p className="px-5 py-4 text-sm text-slate-400">
                  Searching stocks...
                </p>
              ) : searchResults.length > 0 ? (
                searchResults.map((stock, index) => (
                  <button
                    key={`${stock.exchange}-${stock.instrumentKey}`}
                    type="button"
                    onClick={() => openCompany(stock)}
                    className={`flex w-full items-center justify-between gap-5 border-b border-slate-800 px-5 py-4 text-left transition last:border-b-0 ${
  activeResultIndex === index
    ? "bg-emerald-500/15"
    : "hover:bg-emerald-500/10"
}`}
                  >

                    <div>

                      <p className="font-semibold text-white">
                        {stock.symbol}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {stock.companyName}
                      </p>

                    </div>

                    <span className="text-xs font-semibold text-emerald-400">
                      {stock.exchange}
                    </span>

                  </button>
                ))
              ) : (
                <p className="px-5 py-4 text-sm text-slate-500">
                  No {selectedExchange} companies found.
                </p>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 md:p-8">

      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
          STFL Universal Company Search
        </p>

        <h2 className="mt-3 text-2xl font-bold md:text-3xl">
          {title}
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
          {description}
        </p>
      </div>

      {/* Exchange Selection */}
      <div className="mt-7 flex gap-3">

        <button
          type="button"
          onClick={() =>
            setSelectedExchange("NSE")
          }
          className={`rounded-xl border px-5 py-2.5 text-sm font-semibold transition ${
            selectedExchange === "NSE"
              ? "border-emerald-500 bg-emerald-500 text-slate-950"
              : "border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-400"
          }`}
        >
          NSE
        </button>

        <button
          type="button"
          onClick={() =>
            setSelectedExchange("BSE")
          }
          className={`rounded-xl border px-5 py-2.5 text-sm font-semibold transition ${
            selectedExchange === "BSE"
              ? "border-emerald-500 bg-emerald-500 text-slate-950"
              : "border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-400"
          }`}
        >
          BSE
        </button>

      </div>

      {/* Search Input */}
      <div className="relative mt-5">

        <input
          type="search"
          value={searchQuery}
          onChange={(event) =>
            setSearchQuery(event.target.value)
          }
          onKeyDown={handleSearchKeyDown}
          placeholder={`Search ${selectedExchange} company or symbol`}
          autoComplete="off"
          className="w-full rounded-2xl border border-slate-700 bg-[#020817] px-5 py-4 pr-14 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
        />

        <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-xl">
          🔍
        </div>

        {/* Search Results */}
        {searchQuery.trim().length >= 2 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">

            {isSearching ? (
              <p className="px-5 py-5 text-sm text-slate-400">
                Searching stocks...
              </p>
            ) : searchResults.length > 0 ? (
              searchResults.map((stock, index) => (
                <button
                  key={`${stock.exchange}-${stock.instrumentKey}`}
                  type="button"
                  onClick={() =>
                    openCompany(stock)
                  }
                  className={`flex w-full items-center justify-between gap-5 border-b border-slate-800 px-5 py-4 text-left transition last:border-b-0 ${
  activeResultIndex === index
    ? "bg-emerald-500/15"
    : "hover:bg-emerald-500/10"
}`}
                >

                  <div>

                    <p className="font-semibold text-white">
                      {stock.symbol}
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      {stock.companyName}
                    </p>

                  </div>

                  <span className="rounded-lg border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-400">
                    {stock.exchange}
                  </span>

                </button>
              ))
            ) : (
              <p className="px-5 py-5 text-sm text-slate-500">
                No {selectedExchange} companies found.
              </p>
            )}

          </div>
        )}

      </div>

      <p className="mt-4 text-xs leading-6 text-slate-500">
        Type at least two characters. Select a result to open
        the complete STFL Company Research Dashboard.
      </p>

    </section>
  );
}