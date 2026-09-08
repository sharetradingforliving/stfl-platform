"use client";

import { useEffect, useState } from "react";

type AllNseMarketResponse = {
  status?: string;

  marketDataStatus?: string;

  cacheStatus?: string;

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
};

type DataStatus =
  | "loading"
  | "live"
  | "stale"
  | "unavailable";

const REFRESH_INTERVAL = 60_000;

function formatNumber(
  value: number | undefined
): string {
  if (
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return value.toLocaleString(
    "en-IN"
  );
}

function formatSessionDate(
  value: string | null | undefined
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(
    `${value}T00:00:00+05:30`
  );

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }
  ).format(date);
}

export default function AllNseMarketStats() {
  const [marketStats, setMarketStats] =
    useState<AllNseMarketResponse | null>(
      null
    );

  const [status, setStatus] =
    useState<DataStatus>("loading");

  useEffect(() => {
    let isMounted = true;
    let requestInProgress = false;

    const loadMarketStats =
      async () => {
        if (requestInProgress) {
          return;
        }

        requestInProgress = true;

        try {
          const response = await fetch(
            "/api/market/all-stocks",
            {
              method: "GET",
              cache: "no-store",
            }
          );

          const result =
            (await response.json()) as AllNseMarketResponse;

          if (
            !response.ok ||
            result.status !== "success" ||
            !result.universe ||
            !result.breadth ||
            !result.circuits
          ) {
            throw new Error(
              result.error ??
                "All-NSE statistics are unavailable"
            );
          }

          if (!isMounted) {
            return;
          }

          setMarketStats(result);

          setStatus(
            result.cacheStatus === "stale"
              ? "stale"
              : "live"
          );
        } catch (error) {
          console.error(
            "All NSE market statistics error:",
            error
          );

          if (!isMounted) {
            return;
          }

          setStatus(
            (currentStatus) => {
              if (
                currentStatus === "live" ||
                currentStatus === "stale"
              ) {
                return "stale";
              }

              return "unavailable";
            }
          );
        } finally {
          requestInProgress = false;
        }
      };

    void loadMarketStats();

    const intervalId =
      window.setInterval(() => {
        void loadMarketStats();
      }, REFRESH_INTERVAL);

    return () => {
      isMounted = false;

      window.clearInterval(
        intervalId
      );
    };
  }, []);

  const statusText =
    status === "live"
      ? "LIVE DATA"
      : status === "stale"
        ? "UPDATE DELAYED"
        : status === "unavailable"
          ? "DATA UNAVAILABLE"
          : "CONNECTING";

  const statusStyle =
    status === "live"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
      : status === "stale"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
        : status === "unavailable"
          ? "border-red-500/40 bg-red-500/10 text-red-300"
          : "border-slate-600 bg-slate-800 text-slate-300";

  const universe =
    marketStats?.universe;

  const breadth =
    marketStats?.breadth;

  const circuits =
    marketStats?.circuits;

  return (
    <section className="border-t border-slate-800 bg-slate-950 px-6 py-14">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
              All NSE Cash Market
            </p>

            <h2 className="mt-3 text-2xl font-bold md:text-3xl">
              Market Statistics
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Exchange-wide participation based
              on securities traded in the latest
              market session.
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 md:items-end">
            <span
              className={`w-fit rounded-full border px-4 py-2 text-xs font-semibold ${statusStyle}`}
            >
              {statusText}
            </span>

            <p className="text-xs text-slate-500">
              Session:{" "}
              {formatSessionDate(
                universe?.marketSessionDate
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <StatCard
            title="Stocks Traded"
            value={formatNumber(
              universe?.stocksTraded
            )}
            colour="text-violet-300"
          />

          <StatCard
            title="Advances"
            value={formatNumber(
              breadth?.advances
            )}
            colour="text-emerald-400"
          />

          <StatCard
            title="Declines"
            value={formatNumber(
              breadth?.declines
            )}
            colour="text-red-400"
          />

          <StatCard
            title="Unchanged"
            value={formatNumber(
              breadth?.unchanged
            )}
            colour="text-amber-300"
          />

          <StatCard
            title="Upper Circuit"
            value={formatNumber(
              circuits?.upperCircuit
            )}
            colour="text-emerald-400"
          />

          <StatCard
            title="Lower Circuit"
            value={formatNumber(
              circuits?.lowerCircuit
            )}
            colour="text-red-400"
          />
        </div>

        <div className="mt-5 flex flex-col justify-between gap-2 text-xs text-slate-500 sm:flex-row">
          <p>
            Eligible cash instruments:{" "}
            {formatNumber(
              universe?.eligibleInstruments
            )}
          </p>

          <p>
            Quoted instruments:{" "}
            {formatNumber(
              universe?.quotedInstruments
            )}{" "}
            • Source:{" "}
            {marketStats?.source ??
              "Upstox"}
          </p>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  title,
  value,
  colour,
}: {
  title: string;
  value: string;
  colour: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition duration-300 hover:-translate-y-1 hover:border-emerald-500/60">
      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p
        className={`mt-3 text-2xl font-bold md:text-3xl ${colour}`}
      >
        {value}
      </p>
    </div>
  );
}