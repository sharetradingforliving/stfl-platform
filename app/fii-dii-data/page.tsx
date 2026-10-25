"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type FlowValues = {
  gross_buy: number;
  gross_sell: number;
  net: number;
};

type FlowRecord = {
  date: string;
  fii_fpi: FlowValues;
  dii: FlowValues;
  is_provisional: boolean;
};

type HistoryResponse = {
  status?: string;
  start_date?: string;
  end_date?: string;
  trading_days?: number;
  records?: FlowRecord[];
  error?: string;
  details?: string;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateRange(
  year: number,
  month: number,
): {
  startDate: string;
  endDate: string;
} {
  const today = new Date();
  const start =
    month === 0 ? new Date(year, 0, 1) : new Date(year, month - 1, 1);
  const naturalEnd =
    month === 0 ? new Date(year, 11, 31) : new Date(year, month, 0);
  const end = naturalEnd > today ? today : naturalEnd;

  return {
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
  };
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCrores(value: number, showSign = false): string {
  const sign = showSign ? (value > 0 ? "+" : value < 0 ? "−" : "") : "";

  return `${sign}₹${Math.abs(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} Cr`;
}

function netColour(value: number): string {
  if (value > 0) return "text-emerald-600 dark:text-emerald-400";
  if (value < 0) return "text-red-600 dark:text-red-400";
  return "text-slate-600 dark:text-slate-300";
}

export default function FiiDiiDataPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [records, setRecords] = useState<FlowRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const years = useMemo(
    () => Array.from({ length: 5 }, (_, index) => currentYear - index),
    [currentYear],
  );

  const range = useMemo(
    () => getDateRange(selectedYear, selectedMonth),
    [selectedYear, selectedMonth],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadHistory() {
      setIsLoading(true);
      setError("");

      try {
        const query = new URLSearchParams({
          start_date: range.startDate,
          end_date: range.endDate,
        });

        const response = await fetch(`/api/market/fii-dii/history?${query}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const result = (await response.json()) as HistoryResponse;

        if (!response.ok || result.status !== "success") {
          throw new Error(
            result.details ??
              result.error ??
              "Unable to retrieve FII/DII history",
          );
        }

        setRecords(Array.isArray(result.records) ? result.records : []);
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }

        console.error("FII/DII history page error:", requestError);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to retrieve FII/DII history",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadHistory();

    return () => controller.abort();
  }, [range]);

  const totals = useMemo(
    () =>
      records.reduce(
        (summary, record) => ({
          fiiBuy: summary.fiiBuy + record.fii_fpi.gross_buy,
          fiiSell: summary.fiiSell + record.fii_fpi.gross_sell,
          fiiNet: summary.fiiNet + record.fii_fpi.net,
          diiBuy: summary.diiBuy + record.dii.gross_buy,
          diiSell: summary.diiSell + record.dii.gross_sell,
          diiNet: summary.diiNet + record.dii.net,
        }),
        {
          fiiBuy: 0,
          fiiSell: 0,
          fiiNet: 0,
          diiBuy: 0,
          diiSell: 0,
          diiNet: 0,
        },
      ),
    [records],
  );

  const periodLabel =
    selectedMonth === 0
      ? `${selectedYear} full-year data`
      : `${MONTHS[selectedMonth - 1]} ${selectedYear}`;
  const firstAvailableDate = records.length > 0 ? records[0].date : null;

  const hasPartialCoverage =
    firstAvailableDate !== null && firstAvailableDate > range.startDate;

  function downloadCsv() {
    const header = [
      "Date",
      "FII Gross Buy",
      "FII Gross Sell",
      "FII Net",
      "DII Gross Buy",
      "DII Gross Sell",
      "DII Net",
      "Provisional",
    ];

    const rows = records.map((record) => [
      record.date,
      record.fii_fpi.gross_buy,
      record.fii_fpi.gross_sell,
      record.fii_fpi.net,
      record.dii.gross_buy,
      record.dii.gross_sell,
      record.dii.net,
      record.is_provisional ? "Yes" : "No",
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `stfl-fii-dii-${selectedYear}-${selectedMonth || "full-year"}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#020817] dark:text-white">
      <section className="border-b border-slate-200 bg-gradient-to-b from-cyan-50 to-white px-6 py-16 dark:border-slate-800 dark:from-cyan-950/30 dark:to-[#020817]">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-700 dark:text-cyan-400">
            STFL Institutional Activity
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            FII/FPI and DII Data in India
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-400">
            Study day-wise foreign and domestic institutional cash-market
            activity, compare gross purchases and sales, and review monthly or
            full-year net flows.
          </p>

          <Link
            href="/market-intelligence"
            className="mt-7 inline-flex font-semibold text-emerald-700 hover:text-emerald-600 dark:text-emerald-400"
          >
            View Market Intelligence →
          </Link>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Select reporting period
              </p>

              <p className="mt-2 text-lg font-bold">{periodLabel}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Year
                <select
                  value={selectedYear}
                  onChange={(event) =>
                    setSelectedYear(Number(event.target.value))
                  }
                  className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Month
                <select
                  value={selectedMonth}
                  onChange={(event) =>
                    setSelectedMonth(Number(event.target.value))
                  }
                  className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                >
                  <option value={0}>Full year</option>
                  {MONTHS.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={downloadCsv}
                disabled={records.length === 0}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Download CSV
              </button>
            </div>
          </div>
          {hasPartialCoverage && firstAvailableDate && (
            <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
              Historical coverage for this selected period begins on{" "}
              <span className="font-bold">
                {formatDate(firstAvailableDate)}
              </span>
              . Earlier daily records are not currently available from the
              historical source and are excluded from the displayed totals.
            </div>
          )}
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
              <p className="text-sm text-slate-500">Available sessions</p>
              <p className="mt-3 text-3xl font-bold">{records.length}</p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
              <p className="text-sm text-slate-500">FII/FPI net flow</p>
              <p
                className={`mt-3 text-2xl font-bold ${netColour(totals.fiiNet)}`}
              >
                {formatCrores(totals.fiiNet, true)}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
              <p className="text-sm text-slate-500">DII net flow</p>
              <p
                className={`mt-3 text-2xl font-bold ${netColour(totals.diiNet)}`}
              >
                {formatCrores(totals.diiNet, true)}
              </p>
            </article>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
            <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <h2 className="text-xl font-bold">
                Day-wise institutional flows
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                All monetary figures are shown in ₹ crore.
              </p>
            </div>

            {isLoading ? (
              <p className="p-8 text-center text-slate-500">
                Loading institutional-flow history…
              </p>
            ) : error ? (
              <p className="p-8 text-center text-red-600 dark:text-red-400">
                {error}
              </p>
            ) : records.length === 0 ? (
              <p className="p-8 text-center text-slate-500">
                No institutional-flow records are available for this period.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1050px] w-full text-sm">
                  <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-900">
                    <tr>
                      <th className="px-5 py-4 text-left">Date</th>
                      <th className="px-5 py-4 text-right">FII Buy</th>
                      <th className="px-5 py-4 text-right">FII Sell</th>
                      <th className="px-5 py-4 text-right">FII Net</th>
                      <th className="px-5 py-4 text-right">DII Buy</th>
                      <th className="px-5 py-4 text-right">DII Sell</th>
                      <th className="px-5 py-4 text-right">DII Net</th>
                      <th className="px-5 py-4 text-center">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {[...records].reverse().map((record) => (
                      <tr
                        key={record.date}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/70"
                      >
                        <td className="whitespace-nowrap px-5 py-4 font-semibold">
                          {formatDate(record.date)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          {formatCrores(record.fii_fpi.gross_buy)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          {formatCrores(record.fii_fpi.gross_sell)}
                        </td>
                        <td
                          className={`whitespace-nowrap px-5 py-4 text-right font-bold ${netColour(record.fii_fpi.net)}`}
                        >
                          {formatCrores(record.fii_fpi.net, true)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          {formatCrores(record.dii.gross_buy)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          {formatCrores(record.dii.gross_sell)}
                        </td>
                        <td
                          className={`whitespace-nowrap px-5 py-4 text-right font-bold ${netColour(record.dii.net)}`}
                        >
                          {formatCrores(record.dii.net, true)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                            {record.is_provisional ? "PROVISIONAL" : "FINAL"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  <tfoot className="border-t border-slate-300 bg-slate-50 font-bold dark:border-slate-700 dark:bg-slate-900">
                    <tr>
                      <td className="px-5 py-4">Period total</td>
                      <td className="px-5 py-4 text-right">
                        {formatCrores(totals.fiiBuy)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {formatCrores(totals.fiiSell)}
                      </td>
                      <td
                        className={`px-5 py-4 text-right ${netColour(totals.fiiNet)}`}
                      >
                        {formatCrores(totals.fiiNet, true)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {formatCrores(totals.diiBuy)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {formatCrores(totals.diiSell)}
                      </td>
                      <td
                        className={`px-5 py-4 text-right ${netColour(totals.diiNet)}`}
                      >
                        {formatCrores(totals.diiNet, true)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <div className="mt-8 rounded-2xl border border-amber-500/25 bg-amber-50 p-6 text-sm leading-7 text-slate-700 dark:bg-amber-500/5 dark:text-slate-400">
            <p className="font-bold text-amber-800 dark:text-amber-300">
              Data note
            </p>
            <p className="mt-2">
              Institutional-flow figures are provided for market research and
              education. Provisional figures may be revised by the reporting
              source and should not be treated as independent buy or sell
              signals.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
