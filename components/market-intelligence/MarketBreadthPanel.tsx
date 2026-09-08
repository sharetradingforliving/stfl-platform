"use client";

import {
  useEffect,
  useState,
} from "react";

type MarketBreadthResponse = {
  marketDataStatus?:
    | "live"
    | "unavailable";

  universe?: {
    eligibleInstruments: number;
    quotedInstruments: number;
    stocksTraded: number;
    marketSessionDate: string | null;
  };

  breadth?: {
    advances: number;
    declines: number;
    unchanged: number;
    advancePercentage: number;
    declinePercentage: number;
  };

  circuits?: {
    upperCircuit: number;
    lowerCircuit: number;
  };

  source?: string;
  fetchedAt?: string;

  error?: string;
  details?: string;
};

function formatNumber(
  value: number | undefined
): string {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return value.toLocaleString(
    "en-IN"
  );
}

function formatPercent(
  value: number | undefined
): string {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return `${value.toFixed(2)}%`;
}

function getBreadthInterpretation(
  advancePercentage:
    number | undefined
) {
  if (
    typeof advancePercentage !==
      "number" ||
    !Number.isFinite(
      advancePercentage
    )
  ) {
    return {
      label:
        "INSUFFICIENT DATA",
      colour:
        "text-slate-400",
      description:
        "Market participation could not be evaluated.",
    };
  }

  if (
    advancePercentage >= 65
  ) {
    return {
      label:
        "BROADLY POSITIVE",
      colour:
        "text-emerald-400",
      description:
        "Buying participation is widespread across the traded NSE universe.",
    };
  }

  if (
    advancePercentage >= 55
  ) {
    return {
      label: "POSITIVE",
      colour:
        "text-emerald-400",
      description:
        "Advancing stocks have a meaningful advantage over declining stocks.",
    };
  }

  if (
    advancePercentage >= 45
  ) {
    return {
      label: "MIXED",
      colour:
        "text-amber-300",
      description:
        "Market participation is relatively balanced between advances and declines.",
    };
  }

  if (
    advancePercentage >= 35
  ) {
    return {
      label: "WEAK",
      colour:
        "text-red-400",
      description:
        "Declining stocks outnumber advances, indicating weak market participation.",
    };
  }

  return {
    label:
      "BROADLY NEGATIVE",
    colour:
      "text-red-400",
    description:
      "Selling participation is widespread across the traded NSE universe.",
  };
}

function BreadthCard({
  label,
  value,
  valueClass,
  description,
}: {
  label: string;
  value: string;
  valueClass: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p
        className={`mt-3 text-2xl font-bold ${valueClass}`}
      >
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </article>
  );
}

export default function MarketBreadthPanel() {
  const [
    data,
    setData,
  ] =
    useState<MarketBreadthResponse | null>(
      null
    );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    let requestIsActive = true;

    async function loadBreadth() {
      try {
        const response =
          await fetch(
            "/api/market/all-stocks",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const result =
          (await response.json()) as
            MarketBreadthResponse;

        if (
          !response.ok ||
          !result.breadth
        ) {
          throw new Error(
            result.error ??
              result.details ??
              "Market breadth is unavailable"
          );
        }

        if (requestIsActive) {
          setData(result);
          setError("");
        }
      } catch (requestError) {
        console.error(
          "Market breadth error:",
          requestError
        );

        if (requestIsActive) {
          setError(
            "Live market breadth is temporarily unavailable."
          );
        }
      } finally {
        if (requestIsActive) {
          setIsLoading(false);
        }
      }
    }

    loadBreadth();

    const refreshTimer =
      window.setInterval(
        loadBreadth,
        60_000
      );

    return () => {
      requestIsActive = false;

      window.clearInterval(
        refreshTimer
      );
    };
  }, []);

  const breadth =
    data?.breadth;

  const circuits =
    data?.circuits;

  const interpretation =
    getBreadthInterpretation(
      breadth
        ?.advancePercentage
    );

  const advanceDeclineRatio =
    breadth &&
    breadth.declines > 0
      ? breadth.advances /
        breadth.declines
      : null;

  const advanceWidth =
    Math.max(
      0,
      Math.min(
        100,
        breadth
          ?.advancePercentage ??
          0
      )
    );

  const declineWidth =
    Math.max(
      0,
      Math.min(
        100,
        breadth
          ?.declinePercentage ??
          0
      )
    );

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
            NSE participation
          </p>

          <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">
            Detailed Market Breadth
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
            Measure how broadly buying
            or selling is distributed
            across actively traded NSE
            equities.
          </p>
        </div>

        <div className="text-right">
          <p
            className={`text-sm font-bold ${interpretation.colour}`}
          >
            {interpretation.label}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {formatNumber(
              data?.universe
                ?.stocksTraded
            )}{" "}
            traded stocks
          </p>
        </div>
      </div>

      {isLoading &&
      !data ? (
        <div className="mt-8 h-72 animate-pulse rounded-2xl bg-slate-900" />
      ) : error &&
        !data ? (
        <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-200">
          {error}
        </div>
      ) : (
        <>
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-emerald-400">
                Advances{" "}
                {formatPercent(
                  breadth
                    ?.advancePercentage
                )}
              </span>

              <span className="text-sm font-semibold text-red-400">
                Declines{" "}
                {formatPercent(
                  breadth
                    ?.declinePercentage
                )}
              </span>
            </div>

            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-800">
              <div
                className="bg-emerald-500 transition-all duration-500"
                style={{
                  width:
                    `${advanceWidth}%`,
                }}
              />

              <div
                className="bg-red-500 transition-all duration-500"
                style={{
                  width:
                    `${declineWidth}%`,
                }}
              />
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-400">
              {interpretation.description}
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <BreadthCard
              label="Advances"
              value={formatNumber(
                breadth?.advances
              )}
              valueClass="text-emerald-400"
              description="Stocks trading above their previous close."
            />

            <BreadthCard
              label="Declines"
              value={formatNumber(
                breadth?.declines
              )}
              valueClass="text-red-400"
              description="Stocks trading below their previous close."
            />

            <BreadthCard
              label="Unchanged"
              value={formatNumber(
                breadth?.unchanged
              )}
              valueClass="text-slate-200"
              description="Stocks showing no net price movement."
            />

            <BreadthCard
              label="Advance / Decline"
              value={
                advanceDeclineRatio !==
                null
                  ? advanceDeclineRatio.toFixed(
                      2
                    )
                  : "—"
              }
              valueClass={
                advanceDeclineRatio !==
                  null &&
                advanceDeclineRatio >=
                  1
                  ? "text-emerald-400"
                  : "text-red-400"
              }
              description="Advancing stocks divided by declining stocks."
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <BreadthCard
              label="Upper Circuit"
              value={formatNumber(
                circuits
                  ?.upperCircuit
              )}
              valueClass="text-emerald-400"
              description="Traded stocks at their reported upper-circuit limit."
            />

            <BreadthCard
              label="Lower Circuit"
              value={formatNumber(
                circuits
                  ?.lowerCircuit
              )}
              valueClass="text-red-400"
              description="Traded stocks at their reported lower-circuit limit."
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-5 text-xs text-slate-500">
            <span>
              Session:{" "}
              {data?.universe
                ?.marketSessionDate ??
                "Unavailable"}
            </span>

            <span>
              Source:{" "}
              {data?.source ??
                "Upstox"}
            </span>

            <span>
              Auto refresh: 60 seconds
            </span>
          </div>
        </>
      )}
    </section>
  );
}