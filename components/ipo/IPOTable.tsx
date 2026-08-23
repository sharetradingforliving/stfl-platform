"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";

import type {
  IPORecord,
  IPOStatus,
  IPOType,
} from "@/lib/ipo/types";

type IPOEngineResult = {
  ipos: IPORecord[];

  summary: {
    total: number;
    open: number;
    upcoming: number;
    closed: number;
    allotment: number;
    listed: number;
    mainboard: number;
    sme: number;
  };

  lastUpdated: string;
};

type StatusFilter =
  | "All"
  | "Open"
  | "Upcoming"
  | "Closed"
  | "Allotment"
  | "Listed";

type TypeFilter =
  | "All"
  | IPOType;

const statusFilters: StatusFilter[] = [
  "All",
  "Open",
  "Upcoming",
  "Closed",
  "Allotment",
  "Listed",
];

const typeFilters: TypeFilter[] = [
  "All",
  "Mainboard",
  "SME",
];

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatCurrency(
  value?: number,
  suffix = ""
) {
  if (
    value === undefined ||
    value === null ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return `₹${value.toLocaleString("en-IN")}${suffix}`;
}

function formatPriceBand(ipo: IPORecord) {
  const low = ipo.priceBandLow;
  const high = ipo.priceBandHigh;

  if (
    low === undefined &&
    high === undefined
  ) {
    return "—";
  }

  if (
    low !== undefined &&
    high !== undefined
  ) {
    if (low === high) {
      return formatCurrency(high);
    }

    return `${formatCurrency(low)} – ${formatCurrency(high)}`;
  }

  return formatCurrency(high ?? low);
}

function formatMultiple(value?: number) {
  if (
    value === undefined ||
    value === null ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return `${value.toFixed(2)}x`;
}

function statusClasses(status: IPOStatus) {
  switch (status) {
    case "Open":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";

    case "Upcoming":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-400";

    case "Closed":
      return "border-amber-500/30 bg-amber-500/10 text-amber-400";

    case "Allotment":
      return "border-violet-500/30 bg-violet-500/10 text-violet-400";

    case "Listed":
      return "border-slate-600 bg-slate-800 text-slate-300";
  }
}

export default function IPOTable() {
  const [data, setData] =
    useState<IPOEngineResult | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All");

  const [typeFilter, setTypeFilter] =
    useState<TypeFilter>("All");

  async function loadIPOData() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/ipo",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Unable to load IPO data. HTTP ${response.status}`
        );
      }

      const result: IPOEngineResult =
        await response.json();

      setData(result);
    } catch (err) {
      console.error(
        "IPO Dashboard Error:",
        err
      );

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Unable to load IPO data."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIPOData();
  }, []);

  const filteredIPOs = useMemo(() => {
    if (!data) {
      return [];
    }

    const searchText =
      search.trim().toLowerCase();

    return data.ipos.filter((ipo) => {
      const matchesSearch =
        !searchText ||
        ipo.companyName
          .toLowerCase()
          .includes(searchText) ||
        ipo.symbol
          ?.toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        ipo.status === statusFilter;

      const matchesType =
        typeFilter === "All" ||
        ipo.type === typeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      );
    });
  }, [
    data,
    search,
    statusFilter,
    typeFilter,
  ]);

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-[#07111f] p-10 text-center">
        <RefreshCw
          size={22}
          className="mx-auto animate-spin text-emerald-400"
        />

        <p className="mt-4 text-sm text-slate-400">
          Loading live IPO data...
        </p>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <p className="text-sm text-red-400">
          {error ||
            "Unable to load IPO data."}
        </p>

        <button
          onClick={loadIPOData}
          className="mt-4 rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/10"
        >
          Try Again
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-6">

      {/* Summary */}

      <div className="rounded-2xl border border-slate-800 bg-[#07111f] px-5 py-4">

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">

          <span className="font-medium text-slate-400">
            IPO Summary
          </span>

          <span className="text-white">
            Total{" "}
            <strong>
              {data.summary.total}
            </strong>
          </span>

          <span className="text-emerald-400">
            Open{" "}
            <strong>
              {data.summary.open}
            </strong>
          </span>

          <span className="text-cyan-400">
            Upcoming{" "}
            <strong>
              {data.summary.upcoming}
            </strong>
          </span>

          <span className="text-slate-300">
            Mainboard{" "}
            <strong>
              {data.summary.mainboard}
            </strong>
          </span>

          <span className="text-slate-300">
            SME{" "}
            <strong>
              {data.summary.sme}
            </strong>
          </span>

        </div>

      </div>

      {/* Controls */}

      <div className="rounded-2xl border border-slate-800 bg-[#07111f] p-4">

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

          <div className="flex flex-wrap gap-2">

            {typeFilters.map((filter) => (

              <button
                key={filter}
                onClick={() =>
                  setTypeFilter(filter)
                }
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  typeFilter === filter
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                    : "border-slate-700 bg-[#0a1424] text-slate-400 hover:border-slate-600 hover:text-white"
                }`}
              >
                {filter}
              </button>

            ))}

          </div>

          <div className="relative w-full xl:w-80">

            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search IPO or symbol..."
              className="w-full rounded-xl border border-slate-700 bg-[#0a1424] py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500/50"
            />

          </div>

        </div>

        <div className="mt-4 flex flex-wrap gap-2">

          {statusFilters.map((filter) => (

            <button
              key={filter}
              onClick={() =>
                setStatusFilter(filter)
              }
              className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition ${
                statusFilter === filter
                  ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
                  : "border-slate-700 bg-[#0a1424] text-slate-500 hover:border-slate-600 hover:text-slate-300"
              }`}
            >
              {filter}
            </button>

          ))}

        </div>

      </div>

      {/* Table */}

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#07111f]">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1380px] table-fixed text-left">

            <colgroup>
  <col className="w-[210px]" />
  <col className="w-[95px]" />
  <col className="w-[100px]" />
  <col className="w-[105px]" />
  <col className="w-[105px]" />
  <col className="w-[120px]" />
  <col className="w-[60px]" />
  <col className="w-[110px]" />
  <col className="w-[70px]" />
  <col className="w-[70px]" />
  <col className="w-[75px]" />
  <col className="w-[75px]" />
  <col className="w-[80px]" />
  <col className="w-[80px]" />
  <col className="w-[125px]" />
</colgroup>
            <thead className="border-b border-slate-800 bg-[#0b1628]">

              <tr className="text-xs uppercase tracking-wider text-slate-500">

                <th className="px-5 py-4">
                  Company
                </th>

                <th className="px-3 py-4">
                  Type
                </th>

                <th className="px-3 py-4">
                  Status
                </th>

                <th className="px-3 py-4">
                  Open
                </th>

                <th className="px-3 py-4">
                  Close
                </th>

                <th className="px-3 py-4">
                  Price Band
                </th>

                <th className="px-3 py-4">
                  Lot
                </th>

                <th className="px-3 py-4">
                  Issue Size
                </th>

                <th className="px-3 py-4">
                  GMP
                </th>

                <th className="px-3 py-4">
                  GMP %
                </th>

                <th className="border-l border-slate-800 px-3 py-4 text-center">
                  QIB
                </th>

                <th className="px-3 py-4 text-center">
                  NII
                </th>

                <th className="px-3 py-4 text-center">
                  Retail
                </th>

                <th className="px-3 py-4 text-center">
                  Total
                </th>

                <th className="px-4 py-4">
                  Research
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-800">

              {filteredIPOs.map((ipo) => (

                <tr
                  key={ipo.id}
                  className="bg-[#07111f] transition hover:bg-[#0b1628]"
                >

                  {/* Company */}

                  <td className="px-5 py-5 align-top">

                    <Link
                      href={`/ipo/${ipo.slug}`}
                      className="font-semibold text-white transition hover:text-emerald-400"
                    >
                      {ipo.companyName}
                    </Link>

                    {ipo.symbol && (
                      <div className="mt-1 text-xs text-slate-500">
                        {ipo.symbol}
                      </div>
                    )}

                  </td>

                  {/* Type */}

                  <td className="px-3 py-5 text-sm text-slate-300">
                    {ipo.type}
                  </td>

                  {/* Status */}

                  <td className="px-3 py-5">

                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(
                        ipo.status
                      )}`}
                    >
                      {ipo.status}
                    </span>

                  </td>

                  {/* Dates */}

                  <td className="whitespace-nowrap px-3 py-5 text-sm text-slate-300">
                    {formatDate(
                      ipo.openDate
                    )}
                  </td>

                  <td className="whitespace-nowrap px-3 py-5 text-sm text-slate-300">
                    {formatDate(
                      ipo.closeDate
                    )}
                  </td>

                  {/* Price */}

                  <td className="whitespace-nowrap px-3 py-5 text-sm font-medium text-white">
                    {formatPriceBand(ipo)}
                  </td>

                  {/* Lot */}

                  <td className="px-3 py-5 text-sm text-slate-300">
                    {ipo.lotSize ?? "—"}
                  </td>

                  {/* Issue size */}

                  <td className="whitespace-nowrap px-3 py-5 text-sm text-slate-300">
                    {ipo.issueSizeCr !== undefined
                      ? formatCurrency(
                          ipo.issueSizeCr,
                          " Cr"
                        )
                      : "—"}
                  </td>

                  {/* GMP */}

                  <td className="px-3 py-5">

                    {ipo.gmp !== undefined ? (
                      <span className="font-semibold text-emerald-400">
                        {ipo.gmp >= 0
                          ? "+"
                          : ""}
                        {formatCurrency(
                          ipo.gmp
                        )}
                      </span>
                    ) : (
                      <span className="text-slate-600">
                        —
                      </span>
                    )}

                  </td>

                  {/* GMP % */}

                  <td className="px-3 py-5">

                    {ipo.gmpPercent !== undefined ? (
                      <span className="font-semibold text-emerald-400">
                        {ipo.gmpPercent >= 0
                          ? "+"
                          : ""}
                        {ipo.gmpPercent.toFixed(
                          1
                        )}
                        %
                      </span>
                    ) : (
                      <span className="text-slate-600">
                        —
                      </span>
                    )}

                  </td>

                  {/* Subscription block */}

                  <td className="border-l border-slate-800 px-3 py-5 text-center text-sm text-slate-300">
                    {formatMultiple(
                      ipo.subscription?.qib
                    )}
                  </td>

                  <td className="px-3 py-5 text-center text-sm text-slate-300">
                    {formatMultiple(
                      ipo.subscription?.nii
                    )}
                  </td>

                  <td className="px-3 py-5 text-center text-sm text-slate-300">
                    {formatMultiple(
                      ipo.subscription?.retail
                    )}
                  </td>

                  <td className="px-3 py-5 text-center text-sm font-semibold text-white">
                    {formatMultiple(
                      ipo.subscription?.total
                    )}
                  </td>

                  {/* Research */}

                  <td className="px-4 py-5 pr-6">

                    <Link
                      href={`/ipo/${ipo.slug}`}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-emerald-400 transition hover:text-emerald-300"
                    >
                      View Analysis

                      <ArrowUpRight
                        size={14}
                      />

                    </Link>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

        {filteredIPOs.length === 0 && (

          <div className="px-6 py-16 text-center">

            <p className="text-sm text-slate-500">
              No IPOs found for the selected filters.
            </p>

          </div>

        )}

      </div>

      {/* Footer */}

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">

        <span>
          Source: NSE • STFL IPO Engine
        </span>

        <span>
          Last updated:{" "}
          {formatDate(
            data.lastUpdated
          )}
        </span>

      </div>

    </section>
  );
}