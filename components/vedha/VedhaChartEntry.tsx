"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ENTRY_TIMEFRAMES, vedhaCompanyHref } from "@/lib/vedha/entry";
type CompanyMatch = {
  symbol: string;
  companyName: string;
  exchange: string;
  instrumentKey: string;
};
export default function VedhaChartEntry() {
  const [symbol, setSymbol] = useState("");
  const [exchange, setExchange] = useState("NSE");
  const [timeframe, setTimeframe] = useState("D");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<CompanyMatch | null>(null);
  const [matches, setMatches] = useState<CompanyMatch[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [searched, setSearched] = useState(false);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    if (active >= 0)
      optionRefs.current[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);
  useEffect(() => {
    if (selected || symbol.trim().length < 2) {
      setSearching(false);
      setMatches([]);
      setSearched(false);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    setSearchError("");
    setSearched(false);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/upstox/instruments/search?q=${encodeURIComponent(symbol.trim())}`,
          { signal: controller.signal },
        );
        if (!response.ok)
          throw new Error(
            "Company search is temporarily unavailable. Please try again.",
          );
        const data = await response.json();
        if (controller.signal.aborted) return;
        setMatches(
          (Array.isArray(data.results) ? data.results : []).filter(
            (item: CompanyMatch) =>
              item.exchange === exchange &&
              typeof item.symbol === "string" &&
              Boolean(item.instrumentKey),
          ),
        );
        setSearched(true);
      } catch (value) {
        if (!controller.signal.aborted)
          setSearchError((value as Error).message);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [symbol, exchange, selected]);
  function choose(company: CompanyMatch) {
    setSelected(company);
    setSymbol(`${company.companyName || company.symbol} · ${company.symbol}`);
    setMatches([]);
    setOpen(false);
    setActive(-1);
    setError("");
    setSearchError("");
  }
  function openAnalysis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!selected || selected.exchange !== exchange) {
      setError(
        "Select a company from the search results before opening its chart.",
      );
      setOpen(true);
      return;
    }
    try {
      window.location.assign(
        vedhaCompanyHref(selected.symbol, selected.exchange, timeframe),
      );
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Check your symbol and try again.",
      );
    }
  }
  return (
    <main className="min-h-[70vh] bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="max-w-3xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
            STFL Research
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ask Vedha
          </h1>
          <p className="text-lg leading-8 text-slate-600">
            Chart analysis · Understand the evidence behind a stock’s chart.
          </p>
          <p className="text-sm leading-6 text-slate-600">
            Choose a stock and timeframe to open Vedha alongside its chart.
            Review market structure, candle patterns, participation, indicators,
            price zones and a conditional outlook.
          </p>
        </header>
        <section
          aria-labelledby="open-vedha"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <h2 id="open-vedha" className="text-xl font-bold">
            Open a stock analysis
          </h2>
          <form onSubmit={openAnalysis} className="mt-5 space-y-5">
            <div className="grid gap-4 sm:grid-cols-[1fr_2fr_1fr]">
              <div>
                <label
                  htmlFor="vedha-exchange"
                  className="mb-2 block text-sm font-semibold"
                >
                  Exchange
                </label>
                <select
                  id="vedha-exchange"
                  value={exchange}
                  onChange={(event) => {
                    setExchange(event.target.value);
                    setSelected(null);
                    setSymbol("");
                    setMatches([]);
                    setOpen(false);
                    setActive(-1);
                    setSearchError("");
                    setError("");
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3"
                >
                  <option value="NSE">NSE</option>
                  <option value="BSE">BSE</option>
                </select>
              </div>
              <div className="relative">
                <label
                  htmlFor="vedha-symbol"
                  className="mb-2 block text-sm font-semibold"
                >
                  Company name or symbol
                </label>
                <input
                  id="vedha-symbol"
                  name="symbol"
                  value={symbol}
                  onChange={(event) => {
                    setSymbol(event.target.value);
                    setSelected(null);
                    setMatches([]);
                    setActive(-1);
                    setOpen(true);
                    setSearched(false);
                    setSearchError("");
                    setError("");
                  }}
                  placeholder="Search e.g. Bajaj Finance or Reliance"
                  maxLength={160}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={open && matches.length > 0}
                  aria-controls="vedha-chart-company-options"
                  aria-activedescendant={
                    open && active >= 0 && matches[active]
                      ? `vedha-chart-company-${active}`
                      : undefined
                  }
                  onFocus={() => setOpen(true)}
                  onBlur={(event) => {
                    if (
                      !event.relatedTarget?.closest(
                        "[data-chart-company-options]",
                      )
                    )
                      setOpen(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setOpen(false);
                      setActive(-1);
                      return;
                    }
                    if (!matches.length) return;
                    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                      event.preventDefault();
                      setOpen(true);
                      setActive((index) =>
                        event.key === "ArrowDown"
                          ? (index + 1) % matches.length
                          : index <= 0
                            ? matches.length - 1
                            : index - 1,
                      );
                    } else if (event.key === "Enter" && open && active >= 0) {
                      event.preventDefault();
                      choose(matches[active]);
                    }
                  }}
                  required
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby="vedha-symbol-help"
                  aria-invalid={Boolean(error)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3"
                />
                {open && matches.length > 0 && (
                  <ul
                    id="vedha-chart-company-options"
                    role="listbox"
                    aria-label="Matching companies"
                    data-chart-company-options
                    className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
                  >
                    {matches.map((company, index) => (
                      <li key={company.instrumentKey} role="presentation">
                        <button
                          type="button"
                          id={`vedha-chart-company-${index}`}
                          role="option"
                          aria-selected={active === index}
                          ref={(node) => {
                            optionRefs.current[index] = node;
                          }}
                          onMouseEnter={() => setActive(index)}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => choose(company)}
                          className={`block w-full rounded-lg px-3 py-3 text-left ${active === index ? "bg-emerald-100 text-emerald-950" : "text-slate-900 hover:bg-slate-50"}`}
                        >
                          <strong className="block text-sm">
                            {company.companyName || company.symbol}
                          </strong>
                          <span className="mt-1 block text-xs text-slate-600">
                            {company.exchange}: {company.symbol}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p role="status" className="mt-2 text-xs text-slate-600">
                  {searching
                    ? "Searching companies…"
                    : searchError ||
                      (selected
                        ? `Selected ${selected.exchange}: ${selected.symbol}`
                        : searched && !matches.length
                          ? "No matching company. Try part of the company name or its exchange symbol."
                          : "")}
                </p>
                <p
                  id="vedha-symbol-help"
                  className="mt-2 text-xs leading-5 text-slate-500"
                >
                  Type at least two characters, then select a company. Use ↑/↓
                  and Enter, or click a result.
                </p>
              </div>
              <div>
                <label
                  htmlFor="vedha-timeframe"
                  className="mb-2 block text-sm font-semibold"
                >
                  Chart timeframe
                </label>
                <select
                  id="vedha-timeframe"
                  value={timeframe}
                  onChange={(event) => setTimeframe(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3"
                >
                  {ENTRY_TIMEFRAMES.map((frame) => (
                    <option key={frame.value} value={frame.value}>
                      {frame.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              Open analysis →
            </button>
            <p className="text-xs leading-5 text-slate-500">
              Sign in on the company page to use Vedha. Free accounts receive
              one successfully saved preview; Premium accounts use their
              configured report allowance. Saved reports remain available
              subject to your account access.
            </p>
          </form>
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
            <span className="mr-1 text-xs text-slate-500">
              Try an NSE stock:
            </span>
            {["RELIANCE", "BAJFINANCE", "TCS"].map((example) => (
              <Link
                key={example}
                href={vedhaCompanyHref(example, "NSE", timeframe)}
                className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
              >
                {example}
              </Link>
            ))}
          </div>
        </section>
        <section
          aria-labelledby="vedha-coverage"
          className="grid gap-5 sm:grid-cols-2"
        >
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 id="vedha-coverage" className="font-bold">
              One chart, wider context
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The selected timeframe anchors the report. Available hourly,
              daily, weekly and monthly evidence helps distinguish short-term
              momentum from broader structure. Missing history is identified in
              the report.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold">Research you can inspect</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Expand any layer to read its explanation and supporting evidence.
              Check the completed-candle date before interpreting the analysis.
              Reports use historical candles and are not live quotes.
            </p>
          </div>
        </section>
        <p className="text-xs leading-5 text-slate-500">
          This chart-report workflow provides technical research. For
          conversational technical follow-up, select the Ask Vedha tab above.
          News and fundamental analysis are not connected in this release.
          Research is educational, not personalized investment advice.
        </p>
        <Link
          href="/company-research"
          className="inline-block text-sm font-semibold text-emerald-700"
        >
          Browse company research →
        </Link>
      </div>
    </main>
  );
}
