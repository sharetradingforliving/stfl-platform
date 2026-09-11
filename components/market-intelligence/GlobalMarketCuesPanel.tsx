"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type Cue = "positive" | "negative" | "neutral";

type HistoryPoint = {
  date: string;
  value: number | null;
};

type MarketItem = {
  id: string;
  name: string;
  symbol: string;
  category: string;
  unit: "index" | "currency" | "usd" | "percent";
  price: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  cue: Cue;
  currency: string | null;
  exchange: string | null;
  marketState: string | null;
  lastUpdated: string | null;
  history: HistoryPoint[];
  status: "available" | "unavailable";
  error?: string;
};

type GlobalCuesResponse = {
  status: "success" | "unavailable";
  marketDataStatus: string;
  sentiment: {
    score: number | null;
    key: string;
    label: string;
    colour: string;
    interpretation: string;
    positiveDrivers: string[];
    negativeDrivers: string[];
    methodology: string;
  };
  groups: {
    us: MarketItem[];
    asia: MarketItem[];
    europe: MarketItem[];
    currencies: MarketItem[];
    commodities: MarketItem[];
    rates: MarketItem[];
  };
  coverage: {
    requested: number;
    available: number;
    unavailable: number;
    giftNifty: {
      status: string;
      explanation: string;
    };
  };
  source: string;
  sourceType: string;
  fetchedAt: string;
  disclaimer: string;
  error?: string;
  details?: string;
};

function validNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatPercent(value: number | null | undefined): string {
  if (!validNumber(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatValue(item: MarketItem): string {
  if (!validNumber(item.price)) return "—";

  const value = item.price.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (item.unit === "currency") return `₹${value}`;
  if (item.unit === "usd") return `$${value}`;
  if (item.unit === "percent") return `${value}%`;
  return value;
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "Latest available session";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Latest available session";

  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function cueClasses(cue: Cue): string {
  if (cue === "positive") return "border-emerald-500/25 bg-emerald-500/5";
  if (cue === "negative") return "border-red-500/25 bg-red-500/5";
  return "border-slate-800 bg-slate-950/60";
}

function cueText(cue: Cue): string {
  if (cue === "positive") return "text-emerald-300";
  if (cue === "negative") return "text-red-300";
  return "text-slate-400";
}

function sentimentClasses(key: string | undefined): string {
  if (key === "RISK_ON") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (key === "POSITIVE") return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";
  if (key === "MIXED") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  if (key === "CAUTIOUS") return "border-orange-500/30 bg-orange-500/10 text-orange-300";
  return "border-red-500/30 bg-red-500/10 text-red-300";
}

function Sparkline({ points, cue }: { points: HistoryPoint[]; cue: Cue }) {
  const path = useMemo(() => {
    const values = points
      .filter((point) => validNumber(point.value))
      .map((point) => point.value as number);

    if (values.length < 2) return "";

    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const range = maximum - minimum || 1;

    return values
      .map((value, index) => {
        const x = (index / (values.length - 1)) * 160;
        const y = 36 - ((value - minimum) / range) * 32;
        return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }, [points]);

  if (!path) {
    return <div className="h-10" />;
  }

  const colour = cue === "positive" ? "#34d399" : cue === "negative" ? "#fb7185" : "#94a3b8";

  return (
    <svg viewBox="0 0 160 40" className="h-10 w-full" preserveAspectRatio="none" aria-hidden="true">
      <path d={path} fill="none" stroke={colour} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function MarketCard({ item }: { item: MarketItem }) {
  if (item.status === "unavailable") {
    return (
      <article className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 opacity-70">
        <p className="font-semibold text-slate-300">{item.name}</p>
        <p className="mt-3 text-sm text-slate-500">Temporarily unavailable</p>
      </article>
    );
  }

  return (
    <article className={`rounded-2xl border p-4 ${cueClasses(item.cue)}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{item.name}</p>
          <p className="mt-1 truncate text-[10px] uppercase tracking-wide text-slate-500">
            {item.exchange ?? item.symbol}
          </p>
        </div>
        <span className={`text-xs font-bold ${cueText(item.cue)}`}>
          {item.cue === "positive" ? "SUPPORTIVE" : item.cue === "negative" ? "HEADWIND" : "NEUTRAL"}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <p className="text-xl font-bold text-white">{formatValue(item)}</p>
        <p className={`text-sm font-bold ${(item.changePercent ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"}`}>
          {formatPercent(item.changePercent)}
        </p>
      </div>

      <div className="mt-3"><Sparkline points={item.history} cue={item.cue} /></div>

      <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-slate-500">
        <span>30-day trend</span>
        <span>{formatTimestamp(item.lastUpdated)}</span>
      </div>
    </article>
  );
}

function MarketGroup({ title, description, items }: { title: string; description: string; items: MarketItem[] }) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => <MarketCard key={item.id} item={item} />)}
      </div>
    </div>
  );
}

function DriverList({ title, drivers, positive }: { title: string; drivers: string[]; positive: boolean }) {
  return (
    <div className="rounded-xl bg-slate-950/70 p-4">
      <p className={`text-xs font-semibold uppercase tracking-wide ${positive ? "text-emerald-400" : "text-red-400"}`}>
        {title}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {drivers.length > 0 ? drivers.map((driver) => (
          <span key={driver} className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300">
            {driver}
          </span>
        )) : <span className="text-xs text-slate-500">None currently</span>}
      </div>
    </div>
  );
}

export default function GlobalMarketCuesPanel() {
  const [data, setData] = useState<GlobalCuesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const response = await fetch("/api/market/global-cues", {
          method: "GET",
          cache: "no-store",
        });
        const result = (await response.json()) as GlobalCuesResponse;

        if (!response.ok || result.status !== "success") {
          throw new Error(result.error ?? result.details ?? "Global market data is unavailable");
        }

        if (active) {
          setData(result);
          setError("");
        }
      } catch (requestError) {
        console.error("Global market cues error:", requestError);
        if (active) setError("Global market cues are temporarily unavailable.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadData();
    const timer = window.setInterval(loadData, 300_000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const score = Math.max(0, Math.min(100, data?.sentiment.score ?? 50));

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">International context</p>
          <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">Global Market Cues</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
            Track global equities, currencies, commodities and bond yields that can influence Indian market sentiment.
          </p>
        </div>
        <div className="text-right">
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-300">
            LATEST AVAILABLE · AUTO REFRESH
          </span>
          <p className="mt-3 text-xs text-slate-500">Exchange timestamps vary</p>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="mt-8 h-[560px] animate-pulse rounded-2xl bg-slate-900" />
      ) : error && !data ? (
        <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-200">{error}</div>
      ) : data ? (
        <>
          <div className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <article className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Global cue meter</p>
                  <p className="mt-2 text-3xl font-bold text-white">{score.toFixed(0)}<span className="text-base text-slate-500">/100</span></p>
                </div>
                <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${sentimentClasses(data.sentiment.key)}`}>
                  {data.sentiment.label.toUpperCase()}
                </span>
              </div>

              <div className="relative mt-7">
                <div className="h-4 overflow-hidden rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500" />
                <div className="absolute top-1/2 h-7 w-1 -translate-x-1/2 -translate-y-1/2 rounded bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]" style={{ left: `${score}%` }} />
                <div className="mt-3 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  <span>Risk-off</span><span>Mixed</span><span>Risk-on</span>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-slate-300">{data.sentiment.interpretation}</p>
            </article>

            <article className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-400">STFL automated interpretation</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                The current global cue score is <strong>{score.toFixed(0)} out of 100</strong>, indicating <strong>{data.sentiment.label.toLowerCase()}</strong> conditions. This is a contextual reading of the latest available global sessions; domestic breadth, India VIX and FII/DII activity should be used for confirmation.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <DriverList title="Supportive cues" drivers={data.sentiment.positiveDrivers} positive />
                <DriverList title="Market headwinds" drivers={data.sentiment.negativeDrivers} positive={false} />
              </div>
            </article>
          </div>

          <div className="mt-8 space-y-8">
            <MarketGroup title="United States" description="Previous close or latest available US session." items={data.groups.us} />
            <MarketGroup title="Asian markets" description="Latest available Asian market readings." items={data.groups.asia} />
            <MarketGroup title="Europe" description="Latest available European market reading." items={data.groups.europe} />
            <MarketGroup title="Currencies and India sensitivity" description="A stronger dollar or rising USD/INR is generally treated as a headwind for Indian risk assets." items={data.groups.currencies} />
            <MarketGroup title="Commodities" description="Brent affects India through import costs; gold is shown as contextual risk information." items={data.groups.commodities} />
            <MarketGroup title="Global rates" description="Rising US yields can tighten global financial conditions and pressure emerging-market flows." items={data.groups.rates} />
          </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-5 text-xs text-slate-500">
            <span>Coverage: {data.coverage.available}/{data.coverage.requested} instruments</span>
            <span>Source: {data.source}</span>
            <span>Refresh interval: 5 minutes</span>
          </div>
          <p className="mt-4 text-[11px] leading-5 text-slate-600">{data.disclaimer}</p>
        </>
      ) : null}
    </section>
  );
}
