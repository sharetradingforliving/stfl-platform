import Link from "next/link";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  IndianRupee,
  Layers3,
  LineChart,
  Users,
} from "lucide-react";

import { runIPOEngine } from "@/lib/ipo/ipoEngine";

import IPOFinancialPerformance from "@/components/ipo/IPOFinancialPerformance";

import { fetchIPOFinancials } from "@/lib/ipo/providers/financials";


type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};


/**
 * ================================================================
 * FORMAT CURRENCY
 * ================================================================
 */

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


/**
 * ================================================================
 * FORMAT DATE
 * ================================================================
 */

function formatDate(
  value?: string
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}


/**
 * ================================================================
 * FORMAT SUBSCRIPTION MULTIPLE
 * ================================================================
 */

function formatMultiple(
  value?: number
) {
  if (
    value === undefined ||
    value === null ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return `${value.toFixed(2)}x`;
}


/**
 * ================================================================
 * PAGE
 * ================================================================
 */

export default async function Page({
  params,
}: PageProps) {

  const { slug } =
    await params;


  /**
   * ------------------------------------------------
   * Load IPO engine
   * ------------------------------------------------
   */

  const result =
    await runIPOEngine();


  const ipo =
    result.ipos.find(
      (item) =>
        item.slug === slug
    );


  /**
   * ------------------------------------------------
   * IPO not found
   * ------------------------------------------------
   */

  if (!ipo) {

    return (
      <main className="min-h-screen bg-[#020817] px-6 py-16 text-white">

        <div className="mx-auto max-w-5xl">

          <Link
            href="/ipo-research"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 transition hover:text-emerald-300"
          >
            <ArrowLeft size={16} />

            Back to IPO Research
          </Link>


          <div className="mt-10 rounded-2xl border border-slate-800 bg-[#07111f] p-10 text-center">

            <h1 className="text-2xl font-bold">
              IPO not found
            </h1>

            <p className="mt-3 text-slate-400">
              The selected IPO is not currently available in the STFL IPO engine.
            </p>

          </div>

        </div>

      </main>
    );
  }


  /**
   * ------------------------------------------------
   * Fetch financial information
   * ------------------------------------------------
   */

  const financials =
    await fetchIPOFinancials(
      ipo.companyName,
      ipo.symbol
    );


  /**
   * ------------------------------------------------
   * Estimated listing price
   * ------------------------------------------------
   */

  const estimatedListingPrice =
    ipo.estimatedListingPrice ??
    (
      ipo.gmp !== undefined &&
      ipo.priceBandHigh !== undefined
        ? ipo.priceBandHigh +
          ipo.gmp
        : undefined
    );


  /**
   * ================================================================
   * RENDER
   * ================================================================
   */

  return (
    <main className="min-h-screen bg-[#020817] text-white">

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">


        {/* ===================================================== */}
        {/* BACK */}
        {/* ===================================================== */}

        <Link
          href="/ipo-research"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-emerald-400"
        >
          <ArrowLeft size={16} />

          Back to IPO Research
        </Link>


        {/* ===================================================== */}
        {/* HERO */}
        {/* ===================================================== */}

        <section className="mt-6 rounded-3xl border border-slate-800 bg-[#07111f] p-7 lg:p-9">

          <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">

            <div className="max-w-4xl">

              <div className="flex flex-wrap items-center gap-3">

                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                  {ipo.status}
                </span>


                <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300">
                  {ipo.type}
                </span>


                <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-300">
                  {ipo.exchange}
                </span>

              </div>


              <h1 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                {ipo.companyName}
              </h1>


              {ipo.symbol && (

                <p className="mt-2 text-sm font-medium text-slate-500">
                  {ipo.symbol}
                </p>

              )}


              <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-400 md:text-base">
                STFL IPO research page covering issue details,
                subscription trends, valuation inputs, GMP,
                financial analysis, peer comparison and risk assessment.
              </p>

            </div>


            <div className="rounded-2xl border border-slate-800 bg-[#0a1424] px-5 py-4">

              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Last Updated
              </p>

              <p className="mt-2 text-sm font-semibold text-white">
                {formatDate(
                  ipo.lastUpdated
                )}
              </p>

            </div>

          </div>

        </section>


        {/* ===================================================== */}
        {/* KEY METRICS */}
        {/* ===================================================== */}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <MetricCard
            icon={
              <IndianRupee size={19} />
            }
            label="Price Band"
            value={
              ipo.priceBandLow !== undefined &&
              ipo.priceBandHigh !== undefined
                ? `${formatCurrency(
                    ipo.priceBandLow
                  )} – ${formatCurrency(
                    ipo.priceBandHigh
                  )}`
                : "—"
            }
          />


          <MetricCard
            icon={
              <Layers3 size={19} />
            }
            label="Lot Size"
            value={
              ipo.lotSize !== undefined
                ? `${ipo.lotSize} Shares`
                : "—"
            }
          />


          <MetricCard
            icon={
              <Building2 size={19} />
            }
            label="Issue Size"
            value={
              ipo.issueSizeCr !== undefined
                ? formatCurrency(
                    ipo.issueSizeCr,
                    " Cr"
                  )
                : "—"
            }
          />


          <MetricCard
            icon={
              <Users size={19} />
            }
            label="Total Subscription"
            value={
              formatMultiple(
                ipo.subscription?.total
              )
            }
          />

        </section>


        {/* ===================================================== */}
        {/* MAIN CONTENT */}
        {/* ===================================================== */}

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">


          {/* =================================================== */}
          {/* LEFT COLUMN */}
          {/* =================================================== */}

          <div className="space-y-6">


            {/* ================================================= */}
            {/* ISSUE DETAILS */}
            {/* ================================================= */}

            <section className="rounded-2xl border border-slate-800 bg-[#07111f] p-6">

              <SectionTitle
                eyebrow="IPO Overview"
                title="Issue Details"
              />


              <div className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-2">

                <DetailRow
                  label="Company"
                  value={
                    ipo.companyName
                  }
                />


                <DetailRow
                  label="Symbol"
                  value={
                    ipo.symbol ??
                    "—"
                  }
                />


                <DetailRow
                  label="IPO Type"
                  value={
                    ipo.type
                  }
                />


                <DetailRow
                  label="Exchange"
                  value={
                    ipo.exchange
                  }
                />


                <DetailRow
                  label="Open Date"
                  value={
                    formatDate(
                      ipo.openDate
                    )
                  }
                />


                <DetailRow
                  label="Close Date"
                  value={
                    formatDate(
                      ipo.closeDate
                    )
                  }
                />


                <DetailRow
                  label="Listing Date"
                  value={
                    formatDate(
                      ipo.listingDate
                    )
                  }
                />


                <DetailRow
                  label="Issue Price"
                  value={
                    formatCurrency(
                      ipo.issuePrice
                    )
                  }
                />


                <DetailRow
                  label="Lot Size"
                  value={
                    ipo.lotSize !== undefined
                      ? `${ipo.lotSize} Shares`
                      : "—"
                  }
                />


                <DetailRow
                  label="Issue Size"
                  value={
                    ipo.issueSizeCr !== undefined
                      ? formatCurrency(
                          ipo.issueSizeCr,
                          " Cr"
                        )
                      : "—"
                  }
                />

              </div>

            </section>


            {/* ================================================= */}
            {/* SUBSCRIPTION */}
            {/* ================================================= */}

            <section className="rounded-2xl border border-slate-800 bg-[#07111f] p-6">

              <SectionTitle
                eyebrow="Live Demand"
                title="Subscription Analysis"
              />


              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <SubscriptionCard
                  label="QIB"
                  value={
                    ipo.subscription?.qib
                  }
                />


                <SubscriptionCard
                  label="NII"
                  value={
                    ipo.subscription?.nii
                  }
                />


                <SubscriptionCard
                  label="Retail"
                  value={
                    ipo.subscription?.retail
                  }
                />


                <SubscriptionCard
                  label="Total"
                  value={
                    ipo.subscription?.total
                  }
                  highlight
                />

              </div>


              <p className="mt-5 text-xs leading-6 text-slate-500">
                Subscription figures are sourced from NSE bid data
                and may change during the bidding period.
              </p>

            </section>


            {/* ================================================= */}
            {/* FINANCIAL PERFORMANCE */}
            {/* ================================================= */}

            <IPOFinancialPerformance
              financials={financials}
            />


            {/* ================================================= */}
            {/* RESEARCH MODULES */}
            {/* ================================================= */}

            <section className="rounded-2xl border border-slate-800 bg-[#07111f] p-6">

              <SectionTitle
                eyebrow="STFL Research"
                title="Detailed IPO Analysis"
              />


              <div className="mt-6 grid gap-4 md:grid-cols-2">


                <ResearchBlock
                  title="Company & Business"
                  description="Business model, industry positioning, promoters, objects of the issue and use of proceeds."
                />



                <ResearchBlock
                  title="Valuation"
                  description="IPO P/E, P/B, EV/EBITDA and valuation comparison versus listed peers."
                />


                <ResearchBlock
                  title="Peer Comparison"
                  description="Compare growth, profitability, leverage and valuation with comparable listed companies."
                />


                <ResearchBlock
                  title="Strengths & Risks"
                  description="Key competitive advantages, business risks and IPO-specific concerns."
                />


                <ResearchBlock
                  title="STFL Analysis"
                  description="Structured IPO assessment combining fundamentals, valuation, demand and market information."
                />

              </div>

            </section>

          </div>


          {/* =================================================== */}
          {/* RIGHT COLUMN */}
          {/* =================================================== */}

          <aside className="space-y-6">


            {/* ================================================= */}
            {/* TIMELINE */}
            {/* ================================================= */}

            <section className="rounded-2xl border border-slate-800 bg-[#07111f] p-6">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">

                  <CalendarDays
                    size={19}
                  />

                </div>


                <div>

                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    IPO Timeline
                  </p>

                  <h2 className="mt-1 font-semibold text-white">
                    Important Dates
                  </h2>

                </div>

              </div>


              <div className="mt-6 space-y-5">

                <TimelineRow
                  label="Issue Opens"
                  value={
                    formatDate(
                      ipo.openDate
                    )
                  }
                />


                <TimelineRow
                  label="Issue Closes"
                  value={
                    formatDate(
                      ipo.closeDate
                    )
                  }
                />


                <TimelineRow
                  label="Allotment"
                  value={
                    formatDate(
                      ipo.allotmentDate
                    )
                  }
                />


                <TimelineRow
                  label="Refund"
                  value={
                    formatDate(
                      ipo.refundDate
                    )
                  }
                />


                <TimelineRow
                  label="Demat Credit"
                  value={
                    formatDate(
                      ipo.dematCreditDate
                    )
                  }
                />


                <TimelineRow
                  label="Listing"
                  value={
                    formatDate(
                      ipo.listingDate
                    )
                  }
                />

              </div>

            </section>


            {/* ================================================= */}
            {/* GMP */}
            {/* ================================================= */}

            <section className="rounded-2xl border border-slate-800 bg-[#07111f] p-6">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">

                  <LineChart
                    size={19}
                  />

                </div>


                <div>

                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Grey Market
                  </p>

                  <h2 className="mt-1 font-semibold text-white">
                    GMP Snapshot
                  </h2>

                </div>

              </div>


              <div className="mt-6 space-y-4">

                <DetailRow
                  label="Current GMP"
                  value={
                    ipo.gmp !== undefined
                      ? formatCurrency(
                          ipo.gmp
                        )
                      : "Awaiting Data"
                  }
                />


                <DetailRow
                  label="GMP %"
                  value={
                    typeof ipo.gmpPercent === "number" &&
Number.isFinite(ipo.gmpPercent)
                      ? `${ipo.gmpPercent.toFixed(
                          2
                        )}%`
                      : "—"
                  }
                />


                <DetailRow
                  label="Estimated Listing Price"
                  value={
                    estimatedListingPrice !== undefined
                      ? formatCurrency(
                          estimatedListingPrice
                        )
                      : "—"
                  }
                />

              </div>


              <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">

                <p className="text-xs leading-6 text-amber-200/70">
                  Grey Market Premium is unofficial market information
                  and should not be treated as an investment recommendation.
                </p>

              </div>

            </section>

          </aside>

        </div>

      </div>

    </main>
  );
}


/**
 * ================================================================
 * METRIC CARD
 * ================================================================
 */

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#07111f] p-5">

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">

        {icon}

      </div>


      <p className="mt-4 text-xs uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>


      <p className="mt-2 text-xl font-bold text-white">
        {value}
      </p>

    </div>
  );
}


/**
 * ================================================================
 * SECTION TITLE
 * ================================================================
 */

function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {

  return (
    <div>

      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
        {eyebrow}
      </p>


      <h2 className="mt-2 text-xl font-bold text-white">
        {title}
      </h2>

    </div>
  );
}


/**
 * ================================================================
 * DETAIL ROW
 * ================================================================
 */

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (
    <div className="flex items-start justify-between gap-6 border-b border-slate-800/70 pb-3">

      <span className="text-sm text-slate-500">
        {label}
      </span>


      <span className="text-right text-sm font-semibold text-slate-200">
        {value}
      </span>

    </div>
  );
}


/**
 * ================================================================
 * SUBSCRIPTION CARD
 * ================================================================
 */

function SubscriptionCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value?: number;
  highlight?: boolean;
}) {

  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-slate-800 bg-[#0a1424]"
      }`}
    >

      <p className="text-xs uppercase tracking-[0.15em] text-slate-500">
        {label}
      </p>


      <p
        className={`mt-2 text-2xl font-bold ${
          highlight
            ? "text-emerald-400"
            : "text-white"
        }`}
      >

        {formatMultiple(
          value
        )}

      </p>

    </div>
  );
}


/**
 * ================================================================
 * TIMELINE ROW
 * ================================================================
 */

function TimelineRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (
    <div className="relative border-l border-slate-700 pl-5">

      <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full border-2 border-[#07111f] bg-cyan-400" />


      <p className="text-xs text-slate-500">
        {label}
      </p>


      <p className="mt-1 text-sm font-semibold text-slate-200">
        {value}
      </p>

    </div>
  );
}


/**
 * ================================================================
 * RESEARCH BLOCK
 * ================================================================
 */

function ResearchBlock({
  title,
  description,
}: {
  title: string;
  description: string;
}) {

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0a1424] p-5">

      <h3 className="font-semibold text-white">
        {title}
      </h3>


      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>


      <div className="mt-4 text-xs font-semibold text-cyan-400">
        Research module in development
      </div>

    </div>
  );
}