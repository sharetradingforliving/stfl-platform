"use client";

import InstitutionalFlowChart from "./InstitutionalFlowChart";

import {
  useEffect,
  useState,
} from "react";

type FlowValues = {
  gross_buy: number;
  gross_sell: number;
  net: number;
};

type FiiDiiSummary = {
  latest_day: {
    date: string;
    fii_fpi: FlowValues;
    dii: FlowValues;
    is_provisional: boolean;
  };

  month_to_date: {
    month: string;
    through_date: string;
    trading_days: number;
    fii_fpi_net: number;
    dii_net: number;
  };

  source: string;
  updated_at: string | null;
};

type FiiDiiApiResponse = {
  status:
    | "success"
    | "error";

  marketDataStatus:
    | "live"
    | "unavailable";

  data?: FiiDiiSummary;

  error?: string;
  details?: string;
};

function isValidNumber(
  value: number | null | undefined
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function formatCrore(
  value: number | null | undefined
): string {
  if (!isValidNumber(value)) {
    return "—";
  }

  const prefix =
    value > 0
      ? "+"
      : value < 0
        ? "−"
        : "";

  return `${prefix}₹${Math.abs(
    value
  ).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )} Cr`;
}

function formatUnsignedCrore(
  value: number | null | undefined
): string {
  if (!isValidNumber(value)) {
    return "—";
  }

  return `₹${Math.abs(
    value
  ).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )} Cr`;
}

function getValueColour(
  value: number | null | undefined
): string {
  if (!isValidNumber(value)) {
    return "text-slate-400";
  }

  if (value > 0) {
    return "text-emerald-400";
  }

  if (value < 0) {
    return "text-red-400";
  }

  return "text-slate-300";
}

function formatDate(
  value: string | null | undefined
): string {
  if (!value) {
    return "Unavailable";
  }

  const parsedDate =
    new Date(
      `${value}T00:00:00+05:30`
    );

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return value;
  }

  return parsedDate.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function formatMonth(
  value: string | undefined
): string {
  if (!value) {
    return "Current month";
  }

  const match =
    value.match(
      /^(\d{4})-(\d{2})$/
    );

  if (!match) {
    return value;
  }

  const parsedDate =
    new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      1
    );

  return parsedDate.toLocaleDateString(
    "en-IN",
    {
      month: "long",
      year: "numeric",
    }
  );
}

function getFlowInterpretation(
  fiiNet: number | undefined,
  diiNet: number | undefined
) {
  if (
    !isValidNumber(fiiNet) ||
    !isValidNumber(diiNet)
  ) {
    return {
      label:
        "INSUFFICIENT DATA",
      colour:
        "text-slate-400",
      description:
        "Institutional-flow direction could not be evaluated.",
    };
  }

  if (
    fiiNet > 0 &&
    diiNet > 0
  ) {
    return {
      label:
        "BROAD INSTITUTIONAL BUYING",
      colour:
        "text-emerald-400",
      description:
        "Both foreign and domestic institutions are net buyers for the measured period.",
    };
  }

  if (
    fiiNet < 0 &&
    diiNet < 0
  ) {
    return {
      label:
        "BROAD INSTITUTIONAL SELLING",
      colour:
        "text-red-400",
      description:
        "Both foreign and domestic institutions are net sellers for the measured period.",
    };
  }

  if (
    fiiNet < 0 &&
    diiNet > 0
  ) {
    return {
      label:
        "DII SUPPORT",
      colour:
        "text-amber-300",
      description:
        "Domestic institutional buying is providing support while foreign institutions remain net sellers.",
    };
  }

  if (
    fiiNet > 0 &&
    diiNet < 0
  ) {
    return {
      label:
        "FII-LED BUYING",
      colour:
        "text-cyan-400",
      description:
        "Foreign institutions are net buyers while domestic institutions remain net sellers.",
    };
  }

  return {
    label: "MIXED",
    colour:
      "text-amber-300",
    description:
      "Institutional participation is mixed or relatively neutral.",
  };
}

function DailyFlowCard({
  title,
  values,
}: {
  title: string;
  values: FlowValues;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
      <h3 className="text-lg font-bold text-white">
        {title}
      </h3>

      <div className="mt-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-slate-500">
            Gross buy
          </span>

          <span className="font-semibold text-slate-200">
            {formatUnsignedCrore(
              values.gross_buy
            )}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-slate-500">
            Gross sell
          </span>

          <span className="font-semibold text-slate-200">
            {formatUnsignedCrore(
              values.gross_sell
            )}
          </span>
        </div>

        <div className="border-t border-slate-800 pt-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-slate-400">
              Net activity
            </span>

            <span
              className={`text-lg font-bold ${getValueColour(
                values.net
              )}`}
            >
              {formatCrore(
                values.net
              )}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function MonthToDateCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>

      <p
        className={`mt-3 text-2xl font-bold ${getValueColour(
          value
        )}`}
      >
        {formatCrore(
          value
        )}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        Cumulative net activity
      </p>
    </article>
  );
}

export default function InstitutionalFlowPanel() {
  const [
    data,
    setData,
  ] =
    useState<FiiDiiSummary | null>(
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

    async function loadFlows() {
      try {
        const response =
          await fetch(
            "/api/market/fii-dii",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const result =
          (await response.json()) as
            FiiDiiApiResponse;

        if (
          !response.ok ||
          !result.data
        ) {
          throw new Error(
            result.error ??
              result.details ??
              "Institutional-flow data is unavailable"
          );
        }

        if (requestIsActive) {
          setData(result.data);
          setError("");
        }
      } catch (requestError) {
        console.error(
          "Institutional-flow panel error:",
          requestError
        );

        if (requestIsActive) {
          setError(
            "FII/DII activity is temporarily unavailable."
          );
        }
      } finally {
        if (requestIsActive) {
          setIsLoading(false);
        }
      }
    }

    loadFlows();

    /*
     * FII/DII data is published daily,
     * so a 15-minute refresh is
     * sufficient.
     */
    const refreshTimer =
      window.setInterval(
        loadFlows,
        15 * 60 * 1000
      );

    return () => {
      requestIsActive = false;

      window.clearInterval(
        refreshTimer
      );
    };
  }, []);

  const interpretation =
    getFlowInterpretation(
      data?.month_to_date
        .fii_fpi_net,
      data?.month_to_date
        .dii_net
    );

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Institutional participation
          </p>

          <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">
            Institutional Flow Analysis
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
            Track the latest and
            month-to-date net activity
            of foreign and domestic
            institutional investors.
          </p>
        </div>

        <div className="text-right">
          <p
            className={`text-sm font-bold ${interpretation.colour}`}
          >
            {interpretation.label}
          </p>

          {data?.latest_day
            .is_provisional && (
            <p className="mt-2 text-xs font-semibold text-amber-300">
              PROVISIONAL DATA
            </p>
          )}
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
      ) : data ? (
        <>
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Latest trading day
                </p>

                <p className="mt-2 font-semibold text-white">
                  {formatDate(
                    data.latest_day
                      .date
                  )}
                </p>
              </div>

              <p className="max-w-2xl text-sm leading-6 text-slate-400">
                {interpretation.description}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <DailyFlowCard
              title="FII / FPI Activity"
              values={
                data.latest_day
                  .fii_fpi
              }
            />

            <DailyFlowCard
              title="DII Activity"
              values={
                data.latest_day
                  .dii
              }
            />
          </div>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">
                Month-to-Date Flow
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {formatMonth(
                  data.month_to_date
                    .month
                )}{" "}
                through{" "}
                {formatDate(
                  data.month_to_date
                    .through_date
                )}
              </p>
            </div>

            <span className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-400">
              {
                data.month_to_date
                  .trading_days
              }{" "}
              stored trading{" "}
              {data.month_to_date
                .trading_days === 1
                ? "day"
                : "days"}
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <MonthToDateCard
              label="FII / FPI Net"
              value={
                data.month_to_date
                  .fii_fpi_net
              }
            />

            <MonthToDateCard
              label="DII Net"
              value={
                data.month_to_date
                  .dii_net
              }
            />
          </div>

          {data.month_to_date
            .trading_days <= 1 && (
            <div className="mt-5 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-xs leading-6 text-amber-200">
              Month-to-date currently
              contains only one stored
              trading day. The cumulative
              figures will expand as
              additional daily records
              are synchronized.
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-5 text-xs text-slate-500">
            <span>
              Source: {data.source}
            </span>

            <span>
              Refresh interval: 15 minutes
            </span>
          </div>
        </>
      ) : null}
            <InstitutionalFlowChart />
    </section>
  );
}