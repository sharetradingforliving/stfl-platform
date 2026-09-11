"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type ViewMode =
  | "upcoming"
  | "historical"
  | "all";

type CorporateAction = {
  id: number;
  action_key: string;
  symbol: string;
  company_name: string | null;
  isin: string | null;
  action_type: string;
  purpose: string | null;
  subject: string | null;
  announcement_date: string | null;
  ex_date: string | null;
  record_date: string | null;
  dividend_amount: number | null;
  ratio_numerator: number | null;
  ratio_denominator: number | null;
  old_face_value: number | null;
  new_face_value: number | null;
  share_adjustment_factor: number | null;
  source: string;
  source_fetched_at: string | null;
  created_at: string;
  updated_at: string;
};

type CorporateActionResponse = {
  status: string;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  upcoming_count: number;
  historical_count: number;
  actions: CorporateAction[];
};

const ACTION_TYPES = [
  "ALL",
  "DIVIDEND",
  "DISTRIBUTION",
  "BONUS",
  "STOCK_SPLIT",
  "RIGHTS",
  "BUYBACK",
  "MERGER",
  "DEMERGER",
  "CAPITAL_REDUCTION",
  "INTEREST_PAYMENT",
  "AGM",
  "OTHER",
] as const;

function formatActionType(
  value: string
): string {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function formatDate(
  value: string | null
): string {
  if (!value) {
    return "—";
  }

  const parsed = new Date(
    `${value}T00:00:00+05:30`
  );

  if (Number.isNaN(parsed.getTime())) {
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
  ).format(parsed);
}

function isUpcoming(
  action: CorporateAction
): boolean {
  const effectiveDate =
    action.ex_date ??
    action.record_date ??
    action.announcement_date;

  if (!effectiveDate) {
    return false;
  }

  const today = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(new Date());

  return effectiveDate >= today;
}

function badgeClasses(
  actionType: string
): string {
  const colors:
    Record<string, string> = {
      DIVIDEND:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
      DISTRIBUTION:
        "border-teal-500/30 bg-teal-500/10 text-teal-300",
      BONUS:
        "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
      STOCK_SPLIT:
        "border-blue-500/30 bg-blue-500/10 text-blue-300",
      RIGHTS:
        "border-violet-500/30 bg-violet-500/10 text-violet-300",
      BUYBACK:
        "border-amber-500/30 bg-amber-500/10 text-amber-300",
      MERGER:
        "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300",
      DEMERGER:
        "border-orange-500/30 bg-orange-500/10 text-orange-300",
    };

  return colors[actionType] ??
    "border-slate-600 bg-slate-800 text-slate-300";
}

export default function CorporateActionsPage() {
  const [view, setView] =
    useState<ViewMode>("upcoming");
  const [actionType, setActionType] =
    useState("ALL");
  const [searchInput, setSearchInput] =
    useState("");
  const [search, setSearch] =
    useState("");
  const [fromDate, setFromDate] =
    useState("");
  const [toDate, setToDate] =
    useState("");
  const [page, setPage] =
    useState(1);
  const [data, setData] =
    useState<CorporateActionResponse | null>(null);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState<string | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        setSearch(searchInput.trim());
        setPage(1);
      },
      350
    );

    return () =>
      window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadActions() {
      setLoading(true);
      setError(null);

      const parameters =
        new URLSearchParams({
          view,
          page: String(page),
          page_size: "25",
        });

      if (actionType !== "ALL") {
        parameters.set(
          "action_type",
          actionType
        );
      }

      if (search) {
        parameters.set("search", search);
      }

      if (fromDate) {
        parameters.set(
          "from_date",
          fromDate
        );
      }

      if (toDate) {
        parameters.set(
          "to_date",
          toDate
        );
      }

      try {
        const response = await fetch(
          `/api/corporate-actions/archive?${parameters.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.details ??
              result.error ??
              "Unable to retrieve corporate actions."
          );
        }

        setData(result);
      } catch (caughtError) {
        if (
          caughtError instanceof DOMException &&
          caughtError.name === "AbortError"
        ) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to retrieve corporate actions."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadActions();

    return () => controller.abort();
  }, [
    view,
    actionType,
    search,
    fromDate,
    toDate,
    page,
  ]);

  const rangeText = useMemo(() => {
    if (!data || data.total === 0) {
      return "0 results";
    }

    const first =
      (data.page - 1) *
        data.page_size +
      1;
    const last = Math.min(
      data.page * data.page_size,
      data.total
    );

    return `${first}–${last} of ${data.total}`;
  }, [data]);

  function changeView(
    nextView: ViewMode
  ) {
    setView(nextView);
    setPage(1);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-400">
            Market calendar
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Corporate Actions
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Track upcoming and historical dividends, distributions, bonus issues, stock splits, rights issues, buybacks and other NSE corporate actions.
          </p>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Filtered results"
            value={data?.total ?? 0}
            detail="For the selected view and filters"
          />
          <SummaryCard
            label="Upcoming"
            value={data?.upcoming_count ?? 0}
            detail="Effective date today or later"
          />
          <SummaryCard
            label="Historical"
            value={data?.historical_count ?? 0}
            detail="Retained permanently in STFL"
          />
          <SummaryCard
            label="Current page"
            value={data?.actions.length ?? 0}
            detail={rangeText}
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-2xl shadow-black/20">
          <div className="border-b border-slate-800 p-4 sm:p-5">
            <div className="mb-5 flex flex-wrap gap-2">
              {(
                [
                  ["upcoming", "Upcoming"],
                  ["historical", "Historical"],
                  ["all", "All actions"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => changeView(value)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    view === value
                      ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
                      : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              <label className="lg:col-span-2">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
                  Company or symbol
                </span>
                <input
                  value={searchInput}
                  onChange={(event) =>
                    setSearchInput(
                      event.target.value
                    )
                  }
                  placeholder="Search Reliance, INFY..."
                  className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-amber-400/60"
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
                  Action type
                </span>
                <select
                  value={actionType}
                  onChange={(event) => {
                    setActionType(
                      event.target.value
                    );
                    setPage(1);
                  }}
                  className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-amber-400/60"
                >
                  {ACTION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type === "ALL"
                        ? "All types"
                        : formatActionType(type)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
                  From date
                </span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => {
                    setFromDate(
                      event.target.value
                    );
                    setPage(1);
                  }}
                  className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-amber-400/60"
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
                  To date
                </span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => {
                    setToDate(
                      event.target.value
                    );
                    setPage(1);
                  }}
                  className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-amber-400/60"
                />
              </label>
            </div>
          </div>

          {error ? (
            <div className="m-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-left">
              <thead className="bg-slate-950/70">
                <tr className="text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4 font-medium">Company</th>
                  <th className="px-5 py-4 font-medium">Action</th>
                  <th className="min-w-[300px] px-5 py-4 font-medium">Details</th>
                  <th className="whitespace-nowrap px-5 py-4 font-medium">Ex-date</th>
                  <th className="whitespace-nowrap px-5 py-4 font-medium">Record date</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-sm text-slate-500">
                      Loading corporate actions…
                    </td>
                  </tr>
                ) : data?.actions.length ? (
                  data.actions.map((action) => {
                    const upcoming =
                      isUpcoming(action);

                    return (
                      <tr
                        key={action.action_key}
                        className="align-top transition hover:bg-slate-800/30"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-white">
                            {action.symbol}
                          </p>
                          <p className="mt-1 max-w-[230px] text-xs leading-5 text-slate-500">
                            {action.company_name ?? "Company name unavailable"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClasses(action.action_type)}`}>
                            {formatActionType(action.action_type)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm leading-6 text-slate-300">
                            {action.purpose ?? action.subject ?? "Details unavailable"}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-300">
                          {formatDate(action.ex_date)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-300">
                          {formatDate(action.record_date)}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                            upcoming
                              ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
                              : "border-slate-700 bg-slate-800 text-slate-400"
                          }`}>
                            {upcoming
                              ? "Upcoming"
                              : "Completed"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <p className="font-medium text-slate-300">
                        No matching corporate actions
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Change the view, dates, company search or action type.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-800 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-slate-500">
              {rangeText}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={loading || page <= 1}
                onClick={() =>
                  setPage((current) =>
                    Math.max(1, current - 1)
                  )
                }
                className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-slate-400">
                Page {data?.page ?? page} of {data?.total_pages ?? 0}
              </span>
              <button
                type="button"
                disabled={
                  loading ||
                  !data ||
                  page >= data.total_pages
                }
                onClick={() =>
                  setPage((current) =>
                    current + 1
                  )
                }
                className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        <p className="mt-4 text-xs leading-5 text-slate-600">
          Source: NSE Corporate Actions. Dates and entitlements should be verified against the latest exchange and company filings before acting.
        </p>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-white">
        {value.toLocaleString("en-IN")}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {detail}
      </p>
    </div>
  );
}
