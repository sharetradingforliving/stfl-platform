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
  providers?: {
    nse?: boolean;
    offerDetails?: boolean;
    gmp?: boolean;
    gmpSource?: string;
    gmpLastFetchedAt?: string;
    gmpLastUpdatedAt?: string;
    persistentDatabase?: boolean;
  };
  gmpDisclaimer?: string;
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
function formatDateTime(value?: string) {
  if (!value) {
    return "Not available";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    timeZoneName: "short",
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
  const [page, setPage] =
    useState(1);
  const [pageSize, setPageSize] =
    useState<10 | 20>(10);
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
  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredIPOs.length / pageSize
    )
  );
  const currentPage = Math.min(
    page,
    totalPages
  );
  const paginatedIPOs = useMemo(() => {
    const firstIndex =
      (currentPage - 1) * pageSize;
    return filteredIPOs.slice(
      firstIndex,
      firstIndex + pageSize
    );
  }, [
    currentPage,
    filteredIPOs,
    pageSize,
  ]);
  const visiblePages = useMemo(() => {
    const maximumVisiblePages = 5;
    let firstPage = Math.max(
      1,
      currentPage - 2
    );
    firstPage = Math.min(
      firstPage,
      Math.max(
        1,
        totalPages -
          maximumVisiblePages +
          1
      )
    );
    const lastPage = Math.min(
      totalPages,
      firstPage +
        maximumVisiblePages -
        1
    );
    return Array.from(
      {
        length:
          lastPage - firstPage + 1,
      },
      (_, index) =>
        firstPage + index
    );
  }, [currentPage, totalPages]);
  const firstVisibleRecord =
    filteredIPOs.length === 0
      ? 0
      : (currentPage - 1) *
          pageSize +
        1;
  const lastVisibleRecord = Math.min(
    currentPage * pageSize,
    filteredIPOs.length
  );
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
      {/* Controls */}
      <div className="rounded-2xl border border-slate-800 bg-[#07111f] p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {typeFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setTypeFilter(filter);
                  setPage(1);
                }}
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
              onChange={(event) => {
                setSearch(
                  event.target.value
                );
                setPage(1);
              }}
              placeholder="Search IPO or symbol..."
              className="w-full rounded-xl border border-slate-700 bg-[#0a1424] py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500/50"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setStatusFilter(filter);
                setPage(1);
              }}
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
          <label className="flex items-center gap-2 text-xs text-slate-500">
            Rows per page
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(
                  Number(
                    event.target.value
                  ) as 10 | 20
                );
                setPage(1);
              }}
              className="rounded-lg border border-slate-700 bg-[#0a1424] px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </label>
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
              {paginatedIPOs.map((ipo) => (
                <tr
                  key={ipo.id}
                  className="bg-[#07111f] transition hover:bg-[#0b1628]"
                >
                  {/* Company */}
                  <td className="px-5 py-5 align-top">
                    <Link
                      href={`/ipo/${ipo.slug}`}
                      className="text-sm font-semibold leading-5 text-white"
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
                  <td className="px-3 py-5 align-middle">
  {typeof ipo.gmp === "number" &&
  Number.isFinite(ipo.gmp) ? (
    <div className="relative">
      <span
        className={`block whitespace-nowrap text-sm font-medium leading-5 ${
          ipo.gmp >= 0
            ? "text-emerald-400"
            : "text-rose-400"
        }`}
      >
        {ipo.gmp >= 0 ? "+" : ""}
        {formatCurrency(ipo.gmp)}
      </span>
      {typeof ipo.estimatedListingPrice === "number" &&
        Number.isFinite(ipo.estimatedListingPrice) && (
          <span className="absolute left-0 top-full mt-1 block whitespace-nowrap text-[11px] text-slate-500">
            Est. listing:{" "}
            {formatCurrency(
              ipo.estimatedListingPrice
            )}
          </span>
        )}
    </div>
  ) : (
    <span className="text-slate-600">
      —
    </span>
  )}
</td>
                  {/* GMP % */}
<td className="px-3 py-5 align-middle">
  {typeof ipo.gmpPercent === "number" &&
  Number.isFinite(ipo.gmpPercent) ? (
    <span
      className={`block whitespace-nowrap text-sm font-medium leading-5 ${
        ipo.gmpPercent >= 0
          ? "text-emerald-400"
          : "text-rose-400"
      }`}
    >
      {ipo.gmpPercent >= 0 ? "+" : ""}
      {ipo.gmpPercent.toFixed(1)}%
    </span>
  ) : (
    <span className="text-slate-500">—</span>
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
        {filteredIPOs.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-800 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-slate-500">
              Showing {firstVisibleRecord}–{lastVisibleRecord} of {filteredIPOs.length} IPOs
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() =>
                  setPage((current) =>
                    Math.max(
                      1,
                      current - 1
                    )
                  )
                }
                className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              {visiblePages.map(
                (pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    aria-current={
                      pageNumber === currentPage
                        ? "page"
                        : undefined
                    }
                    onClick={() =>
                      setPage(pageNumber)
                    }
                    className={`min-w-10 rounded-lg border px-3 py-2 transition ${
                      pageNumber === currentPage
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                        : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white"
                    }`}
                  >
                    {pageNumber}
                  </button>
                )
              )}
              <button
                type="button"
                disabled={
                  currentPage >= totalPages
                }
                onClick={() =>
                  setPage((current) =>
                    Math.min(
                      totalPages,
                      current + 1
                    )
                  )
                }
                className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Footer */}
      <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-4">
  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
    <span>
      IPO data: NSE and STFL IPO Engine
    </span>
    <span>
      Catalogue updated:{" "}
      {formatDateTime(data.lastUpdated)}
    </span>
  </div>
  {data.providers?.gmp && (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3 text-xs text-slate-500">
      <span>
        GMP source:{" "}
        <span className="font-medium text-slate-300">
          {data.providers.gmpSource ??
            "IPO Guru"}
        </span>
      </span>
      <span>
        GMP updated:{" "}
        {formatDateTime(
          data.providers.gmpLastUpdatedAt ??
            data.providers.gmpLastFetchedAt
        )}
      </span>
    </div>
  )}
  {data.gmpDisclaimer && (
    <p className="border-t border-slate-800 pt-3 text-xs leading-5 text-amber-200/70">
      {data.gmpDisclaimer}
    </p>
  )}
</div>
    </section>
  );
}
