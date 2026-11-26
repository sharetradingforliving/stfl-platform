"use client";

import { useEffect, useRef, useState } from "react";

type TradingViewChartProps = {
  symbol: string;
  exchange: "NSE" | "BSE";
};

export default function TradingViewChart({
  symbol,
  exchange,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [loadError, setLoadError] = useState(false);

  const chartSymbol =
    `${exchange}:${symbol.trim().toUpperCase()}`;

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    let active = true;
    setLoadError(false);

    // Each effect owns its host, including during rapid navigation.
    const host = document.createElement("div");
    host.className = "tradingview-widget-container";
    host.style.height = "100%";
    host.style.width = "100%";

    const chart = document.createElement("div");
    chart.className = "tradingview-widget-container__widget";
    chart.style.height = "calc(100% - 32px)";
    chart.style.width = "100%";

    const attribution = document.createElement("div");
    attribution.className = "tradingview-widget-copyright";

    const link = document.createElement("a");
    link.href = "https://www.tradingview.com/";
    link.target = "_blank";
    link.rel = "noopener nofollow";
    link.textContent = "Charts by TradingView";
    attribution.appendChild(link);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/" +
      "embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    script.textContent = JSON.stringify({
      autosize: true,
      symbol: chartSymbol,
      interval: "D",
      timezone: "Asia/Kolkata",
      theme,
      style: "1",
      locale: "en",
      allow_symbol_change: false,
      hide_top_toolbar: false,
      hide_side_toolbar: false,
      hide_legend: false,
      hide_volume: false,
      withdateranges: true,
      save_image: true,
      calendar: false,
      details: false,
      hotlist: false,
      backgroundColor:
        theme === "light" ? "#ffffff" : "#0f172a",
      gridColor:
        theme === "light"
          ? "rgba(15, 23, 42, 0.06)"
          : "rgba(255, 255, 255, 0.06)",
    });

    script.onerror = () => {
      if (active) setLoadError(true);
    };

    host.append(chart, attribution, script);
    container.appendChild(host);

    return () => {
      active = false;
      script.onerror = null;
      host.remove();
    };
  }, [chartSymbol, theme]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">
            {symbol} technical chart
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {exchange} · Indicators and drawing tools
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setTheme((current) =>
              current === "light" ? "dark" : "light"
            )
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          Use {theme === "light" ? "dark" : "light"} chart
        </button>
      </div>

      {loadError ? (
        <p role="alert" className="p-6 text-sm text-red-700 dark:text-red-300">
          The chart could not load. Please refresh the page.
        </p>
      ) : null}

      <div
        ref={containerRef}
        aria-label={`${chartSymbol} price chart`}
        className="h-[560px] w-full sm:h-[700px]"
      />
    </section>
  );
}