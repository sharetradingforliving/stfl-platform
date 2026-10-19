"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import {
  useParams,
} from "next/navigation";
import UnlistedPriceHistoryChart from "../../../components/unlisted-shares/UnlistedPriceHistoryChart";

type NullableNumber =
  | number
  | null;

type PriceObservation = {
  id?: number;
  observation_date: string;
  indicative_price: NullableNumber;
  price_low: NullableNumber;
  price_high: NullableNumber;
  buy_price: NullableNumber;
  sell_price: NullableNumber;
  quote_type: string;
  minimum_lot: number | null;
  source: string;
  source_url: string | null;
  verification_status: string;
  notes: string | null;
  created_at?: string;
};

type FinancialRecord = {
  period_end: string;
  period_type: string;
  currency: string;
  unit: string;
  revenue: NullableNumber;
  ebitda: NullableNumber;
  profit_after_tax: NullableNumber;
  total_assets: NullableNumber;
  net_worth: NullableNumber;
  total_debt: NullableNumber;
  operating_cash_flow: NullableNumber;
  earnings_per_share: NullableNumber;
  book_value_per_share: NullableNumber;
  roe_percent: NullableNumber;
  roce_percent: NullableNumber;
  debt_to_equity: NullableNumber;
  source: string;
  source_url: string | null;
  is_audited: boolean;
};

type Valuation = {
  implied_market_cap_cr: NullableNumber;
  price_to_earnings: NullableNumber;
  price_to_book: NullableNumber;
  earnings_yield_percent: NullableNumber;
  price_observation_date: string | null;
  financial_period_end: string | null;
};

type UnlistedCompany = {
  id: number;
  slug: string;
  company_name: string;
  short_name: string | null;
  cin: string | null;
  isin: string | null;
  sector: string | null;
  industry: string | null;
  company_status: string;
  face_value: NullableNumber;
  outstanding_shares: NullableNumber;
  data_confidence: string;
  latest_price: PriceObservation | null;
  latest_financial: FinancialRecord | null;
  valuation: Valuation;
};

type CompanyResponse = {
  status: string;
  company: UnlistedCompany;
  website_url: string | null;
  registered_office: string | null;
  overview: string | null;
  source: string | null;
  source_url: string | null;
  source_verified_at: string | null;
  price_history: PriceObservation[];
  financial_history: FinancialRecord[];
  disclaimer: string;
  generated_at: string;
};

function formatDate(
  value: string | null
): string {
  if (!value) {
    return "Not available";
  }

  const parsed = new Date(
    `${value}T00:00:00+05:30`
  );

  if (
    Number.isNaN(
      parsed.getTime()
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
      timeZone: "Asia/Kolkata",
    }
  ).format(parsed);
}

function formatNumber(
  value: NullableNumber,
  maximumFractionDigits = 2
): string {
  if (value === null) {
    return "Not available";
  }

  return value.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits,
    }
  );
}

function formatCurrency(
  value: NullableNumber
): string {
  if (value === null) {
    return "Not available";
  }

  return `₹${value.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatCrores(
  value: NullableNumber
): string {
  if (value === null) {
    return "Not available";
  }

  return `₹${value.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  )} Cr`;
}

function formatPercent(
  value: NullableNumber
): string {
  if (value === null) {
    return "Not available";
  }

  return `${value.toFixed(2)}%`;
}

function formatMultiple(
  value: NullableNumber
): string {
  if (value === null) {
    return "Not available";
  }

  return `${value.toFixed(2)}x`;
}

function labelFromCode(
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

function valueColour(
  value: NullableNumber
): string {
  if (value === null) {
    return "text-slate-400";
  }

  return value >= 0
    ? "text-emerald-300"
    : "text-red-300";
}

export default function UnlistedShareDetailPage() {
  const params = useParams<{
    slug: string;
  }>();

  const slug =
    typeof params.slug === "string"
      ? params.slug
      : "";

  const [
    data,
    setData,
  ] = useState<CompanyResponse | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

 useEffect(() => {
  if (!slug) {
    return;
  }

  const controller = new AbortController();
  let isActive = true;

  async function loadCompany() {
    if (isActive) {
      setLoading(true);
      setError("");
      setData(null);
    }

    try {
      const response = await fetch(
        `/api/unlisted-shares/${encodeURIComponent(
          slug
        )}`,
        {
          cache: "no-store",
          signal: controller.signal,
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            "The requested company was not found."
          );
        }

        throw new Error(
          payload?.error ??
            payload?.detail ??
            "Unable to load the unlisted-share profile."
        );
      }

      if (isActive) {
        setData(payload);
      }
    } catch (requestError) {
      if (
        controller.signal.aborted ||
        !isActive
      ) {
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load the unlisted-share profile."
      );
    } finally {
      if (isActive) {
        setLoading(false);
      }
    }
  }

  void loadCompany();

  return () => {
    isActive = false;
    controller.abort();
  };
}, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#020817] px-5 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-16 text-center text-slate-400">
            Loading unlisted-share research…
          </div>
        </div>
      </main>
    );
  }

  if (
    error ||
    !data
  ) {
    return (
      <main className="min-h-screen bg-[#020817] px-5 py-16 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <h1 className="text-xl font-bold text-red-200">
            Unable to open this company
          </h1>

          <p className="mt-3 text-sm leading-6 text-red-200/80">
            {error ||
              "The requested company was not found."}
          </p>

          <Link
            href="/unlisted-shares"
            className="mt-6 inline-flex rounded-lg border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/10"
          >
            Back to Unlisted Shares
          </Link>
        </div>
      </main>
    );
  }

  const {
    company,
  } = data;

  const latestPrice =
    company.latest_price;

  const latestFinancial =
    company.latest_financial;

  const valuation =
    company.valuation;

  const isLossMaking =
    latestFinancial
      ?.profit_after_tax !== null &&
    latestFinancial
      ?.profit_after_tax !== undefined &&
    latestFinancial.profit_after_tax < 0;

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <Link
          href="/unlisted-shares"
          className="inline-flex text-sm font-semibold text-slate-400 transition hover:text-emerald-300"
        >
          Back to Unlisted Shares
        </Link>

        <section className="mt-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/30 p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge
                  value={
                    company.company_status
                  }
                  colour="emerald"
                />

                <StatusBadge
                  value={`${company.data_confidence} confidence`}
                  colour="blue"
                />

                {latestFinancial
                  ?.is_audited ? (
                  <StatusBadge
                    value="Audited financials"
                    colour="amber"
                  />
                ) : null}
              </div>

              <h1 className="mt-5 max-w-4xl text-3xl font-bold tracking-tight md:text-4xl">
                {company.company_name}
              </h1>

              <p className="mt-3 text-sm text-slate-400">
                {[
                  company.short_name,
                  company.sector,
                  company.industry,
                ]
                  .filter(Boolean)
                  .join(" • ")}
              </p>

              {data.overview ? (
                <p className="mt-5 max-w-4xl text-sm leading-7 text-slate-300 md:text-base">
                  {data.overview}
                </p>
              ) : null}
            </div>

            <div className="min-w-[250px] rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-300/70">
                Latest indicative price
              </p>

              <p className="mt-2 text-4xl font-bold text-emerald-300">
                {formatCurrency(
                  latestPrice
                    ?.indicative_price ??
                    null
                )}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Observed{" "}
                {formatDate(
                  latestPrice
                    ?.observation_date ??
                    null
                )}
              </p>

              <p className="mt-3 text-xs leading-5 text-amber-200/80">
                Indicative information only—not
                an exchange-traded or executable
                quotation.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InformationItem
              label="ISIN"
              value={
                company.isin ??
                "Not available"
              }
            />

            <InformationItem
              label="CIN"
              value={
                company.cin ??
                "Not available"
              }
            />

            <InformationItem
              label="Face value"
              value={
                company.face_value ===
                null
                  ? "Not available"
                  : formatCurrency(
                      company.face_value
                    )
              }
            />

            <InformationItem
              label="Outstanding shares"
              value={formatNumber(
                company.outstanding_shares,
                0
              )}
            />
          </div>
        </section>

        <section className="mt-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
              Valuation snapshot
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              What the observed price implies
            </h2>

            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
              These figures combine the latest
              dated indicative price observation
              with the most recent financial data.
              They are research reference points,
              not a recommendation or assured
              transaction value.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Implied market cap"
              value={formatCrores(
                valuation
                  .implied_market_cap_cr
              )}
              detail="Indicative price multiplied by outstanding shares"
            />

            <MetricCard
              label="Price to earnings"
              value={formatMultiple(
                valuation
                  .price_to_earnings
              )}
              detail={
                isLossMaking
                  ? "Not meaningful because reported earnings are negative"
                  : "Indicative price relative to reported earnings"
              }
            />

            <MetricCard
              label="Price to book"
              value={formatMultiple(
                valuation.price_to_book
              )}
              detail="Indicative price relative to reported book value"
            />

            <MetricCard
              label="Earnings yield"
              value={formatPercent(
                valuation
                  .earnings_yield_percent
              )}
              detail={
                isLossMaking
                  ? "Not meaningful while earnings remain negative"
                  : "Reported earnings as a percentage of indicative value"
              }
            />
          </div>

          {isLossMaking ? (
            <div className="mt-5 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5">
              <h3 className="font-semibold text-amber-200">
                Why P/E is not shown
              </h3>

              <p className="mt-2 text-sm leading-6 text-amber-100/75">
                The company reported a loss for
                the latest financial period.
                A conventional positive P/E ratio
                would therefore be misleading.
                Book value, operating progress,
                cash flow and future profitability
                should be reviewed together.
              </p>
            </div>
          ) : null}
                  </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 px-5 py-5 md:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
              Financial performance
            </p>

            <h2 className="mt-2 text-xl font-bold">
              Latest audited financials
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Financial values are presented in
              the unit reported by the source.
              MSEI figures below are standalone
              values from its FY2024–25 annual
              report.
            </p>
          </div>

          {latestFinancial ? (
            <>
              <div className="grid gap-px bg-slate-800 sm:grid-cols-2 lg:grid-cols-4">
                <FinancialMetric
                  label="Revenue"
                  value={formatCrores(
                    latestFinancial.revenue
                  )}
                />

                <FinancialMetric

                  label="EBITDA"

                  value={formatCrores(

                    latestFinancial.ebitda

                  )}

                  valueClass={valueColour(

                    latestFinancial.ebitda

                  )}

                />

                <FinancialMetric
                  label="Profit after tax"
                  value={formatCrores(
                    latestFinancial
                      .profit_after_tax
                  )}
                  valueClass={valueColour(
                    latestFinancial
                      .profit_after_tax
                  )}
                />

                <FinancialMetric
                  label="Net worth"
                  value={formatCrores(
                    latestFinancial.net_worth
                  )}
                />

                <FinancialMetric
                  label="Total assets"
                  value={formatCrores(
                    latestFinancial
                      .total_assets
                  )}
                />

                <FinancialMetric
                  label="Operating cash flow"
                  value={formatCrores(
                    latestFinancial
                      .operating_cash_flow
                  )}
                  valueClass={valueColour(
                    latestFinancial
                      .operating_cash_flow
                  )}
                />

                <FinancialMetric
                  label="Earnings per share"
                  value={
                    latestFinancial
                      .earnings_per_share ===
                    null
                      ? "Not available"
                      : formatCurrency(
                          latestFinancial
                            .earnings_per_share
                        )
                  }
                  valueClass={valueColour(
                    latestFinancial
                      .earnings_per_share
                  )}
                />

                <FinancialMetric
                  label="Book value per share"
                  value={
                    latestFinancial
                      .book_value_per_share ===
                    null
                      ? "Not available"
                      : formatCurrency(
                          latestFinancial
                            .book_value_per_share
                        )
                  }
                />

                <FinancialMetric
                  label="ROE"
                  value={formatPercent(
                    latestFinancial
                      .roe_percent
                  )}
                  valueClass={valueColour(
                    latestFinancial
                      .roe_percent
                  )}
                />

                <FinancialMetric
                  label="ROCE"
                  value={formatPercent(
                    latestFinancial
                      .roce_percent
                  )}
                  valueClass={valueColour(
                    latestFinancial
                      .roce_percent
                  )}
                />

                <FinancialMetric
                  label="Total debt"
                  value={formatCrores(
                    latestFinancial
                      .total_debt
                  )}
                />

                <FinancialMetric
                  label="Debt to equity"
                  value={formatMultiple(
                    latestFinancial
                      .debt_to_equity
                  )}
                />

                <FinancialMetric
                  label="Financial period"
                  value={formatDate(
                    latestFinancial
                      .period_end
                  )}
                />
              </div>

              <div className="border-t border-slate-800 px-5 py-4 text-xs leading-5 text-slate-500 md:px-6">
                Source:{" "}
                {latestFinancial
                  .source_url ? (
                  <a
                    href={
                      latestFinancial
                        .source_url
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-cyan-300 transition hover:text-cyan-200"
                  >
                    {
                      latestFinancial
                        .source
                    }
                  </a>
                ) : (
                  latestFinancial.source
                )}
                {" • "}
                {latestFinancial
                  .is_audited
                  ? "Audited"
                  : "Unaudited"}
                {" • "}
                {latestFinancial
                  .period_type}
              </div>
            </>
          ) : (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              Financial information is not
              available for this company.
            </div>
          )}
          <UnlistedPriceHistoryChart
  observations={data.price_history}
/>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 px-5 py-5 md:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-400">
              Price observations
            </p>

            <h2 className="mt-2 text-xl font-bold">
              Indicative price history
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Each row is a dated observation
              from an identified source. These
              values are not exchange closing
              prices and may not represent an
              executable transaction.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-left">
              <thead className="bg-slate-950/70">
                <tr className="text-xs uppercase tracking-wider text-slate-500">
                  <th className="whitespace-nowrap px-5 py-4 font-medium">
                    Observation date
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 font-medium">
                    Indicative price
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 font-medium">
                    Price range
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 font-medium">
                    Minimum lot
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Source
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 font-medium">
                    Verification
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/80">
                {data.price_history.length >
                0 ? (
                  data.price_history.map(
                    (
                      observation,
                      index
                    ) => (
                      <tr
                        key={
                          observation.id ??
                          `${observation.observation_date}-${index}`
                        }
                        className="align-top transition hover:bg-slate-800/30"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-300">
                          {formatDate(
                            observation
                              .observation_date
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-emerald-300">
                          {formatCurrency(
                            observation
                              .indicative_price
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-300">
                          {observation
                              .price_low !==
                            null &&
                          observation
                              .price_high !==
                            null
                            ? `${formatCurrency(
                                observation
                                  .price_low
                              )} – ${formatCurrency(
                                observation
                                  .price_high
                              )}`
                            : "Not available"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-300">
                          {observation
                            .minimum_lot ===
                          null
                            ? "Not available"
                            : observation
                                .minimum_lot
                                .toLocaleString(
                                  "en-IN"
                                )}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {observation
                            .source_url ? (
                            <a
                              href={
                                observation
                                  .source_url
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-cyan-300 transition hover:text-cyan-200"
                            >
                              {
                                observation
                                  .source
                              }
                            </a>
                          ) : (
                            <span className="text-slate-300">
                              {
                                observation
                                  .source
                              }
                            </span>
                          )}

                          {observation
                            .notes ? (
                            <p className="mt-2 min-w-[260px] max-w-md text-xs leading-5 text-slate-500">
                              {
                                observation
                                  .notes
                              }
                            </p>
                          ) : null}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <span className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-300">
                            {labelFromCode(
                              observation
                                .verification_status
                            )}
                          </span>
                        </td>
                      </tr>
                    )
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      No dated price observations
                      are available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="border-b border-slate-800 px-5 py-5 md:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">
              Financial history
            </p>

            <h2 className="mt-2 text-xl font-bold">
              Reported annual performance
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-left">
              <thead className="bg-slate-950/70">
                <tr className="text-xs uppercase tracking-wider text-slate-500">
                  <th className="whitespace-nowrap px-5 py-4 font-medium">
                    Period
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 font-medium">
                    Revenue
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 font-medium">
                    PAT
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 font-medium">
                    Net worth
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 font-medium">
                    Operating cash flow
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 font-medium">
                    EPS
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 font-medium">
                    ROE
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Source
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/80">
                {data.financial_history
                  .length > 0 ? (
                  data.financial_history.map(
                    (
                      financial,
                      index
                    ) => (
                      <tr
                        key={`${financial.period_end}-${index}`}
                        className="transition hover:bg-slate-800/30"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-white">
                          {formatDate(
                            financial
                              .period_end
                          )}

                          <p className="mt-1 text-xs text-slate-500">
                            {
                              financial
                                .period_type
                            }
                            {financial
                              .is_audited
                              ? " • Audited"
                              : ""}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-300">
                          {formatCrores(
                            financial
                              .revenue
                          )}
                        </td>

                        <td
                          className={`whitespace-nowrap px-5 py-4 text-sm font-medium ${valueColour(
                            financial
                              .profit_after_tax
                          )}`}
                        >
                          {formatCrores(
                            financial
                              .profit_after_tax
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-300">
                          {formatCrores(
                            financial
                              .net_worth
                          )}
                        </td>

                        <td
                          className={`whitespace-nowrap px-5 py-4 text-sm ${valueColour(
                            financial
                              .operating_cash_flow
                          )}`}
                        >
                          {formatCrores(
                            financial
                              .operating_cash_flow
                          )}
                        </td>

                        <td
                          className={`whitespace-nowrap px-5 py-4 text-sm ${valueColour(
                            financial
                              .earnings_per_share
                          )}`}
                        >
                          {financial
                              .earnings_per_share ===
                            null
                            ? "Not available"
                            : formatCurrency(
                                financial
                                  .earnings_per_share
                              )}
                        </td>

                        <td
                          className={`whitespace-nowrap px-5 py-4 text-sm ${valueColour(
                            financial
                              .roe_percent
                          )}`}
                        >
                          {formatPercent(
                            financial
                              .roe_percent
                          )}
                        </td>

                        <td className="min-w-[250px] px-5 py-4 text-sm">
                          {financial
                            .source_url ? (
                            <a
                              href={
                                financial
                                  .source_url
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-cyan-300 transition hover:text-cyan-200"
                            >
                              {
                                financial
                                  .source
                              }
                            </a>
                          ) : (
                            <span className="text-slate-300">
                              {
                                financial
                                  .source
                              }
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      No financial history is
                      available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Company information
            </p>

            <div className="mt-5 space-y-4">
              <DetailRow
                label="Website"
                value={
                  data.website_url ? (
                    <a
                      href={
                        data.website_url
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-300 transition hover:text-cyan-200"
                    >
                      Visit company website
                    </a>
                  ) : (
                    "Not available"
                  )
                }
              />

              <DetailRow
                label="Registered office"
                value={
                  data.registered_office ??
                  "Not available"
                }
              />

              <DetailRow
                label="Profile source"
                value={
                  data.source_url ? (
                    <a
                      href={
                        data.source_url
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-300 transition hover:text-cyan-200"
                    >
                      {data.source ??
                        "Open source"}
                    </a>
                  ) : (
                    data.source ??
                    "Not available"
                  )
                }
              />

              <DetailRow
                label="Source verified"
                value={
                  data.source_verified_at
                    ? new Date(
                        data.source_verified_at
                      ).toLocaleString(
                        "en-IN",
                        {
                          dateStyle:
                            "medium",
                          timeStyle:
                            "short",
                        }
                      )
                    : "Not available"
                }
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              How to interpret this page
            </p>

            <div className="mt-5 space-y-4 text-sm leading-6 text-slate-400">
              <p>
                <span className="font-semibold text-white">
                  Indicative price:
                </span>{" "}
                A dated level observed from an
                identified source. It is not a
                live exchange price.
              </p>

              <p>
                <span className="font-semibold text-white">
                  Implied market cap:
                </span>{" "}
                Indicative price multiplied by
                the recorded outstanding share
                count.
              </p>

              <p>
                <span className="font-semibold text-white">
                  Data confidence:
                </span>{" "}
                STFL’s assessment of source
                coverage, recency and available
                verification—not a measure of
                investment quality.
              </p>

              <p>
                <span className="font-semibold text-white">
                  Liquidity:
                </span>{" "}
                Unlisted shares may be difficult
                to buy or sell, and actual
                transaction prices may differ
                materially from observed levels.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5">
          <h2 className="font-semibold text-amber-200">
            Important unlisted-share disclaimer
          </h2>

          <p className="mt-2 text-xs leading-6 text-amber-100/70">
            {data.disclaimer}
          </p>
        </div>
      </div>
    </main>
  );
}

function StatusBadge({
  value,
  colour,
}: {
  value: string;
  colour:
    | "emerald"
    | "blue"
    | "amber";
}) {
  const colours = {
    emerald:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    blue:
      "border-blue-500/30 bg-blue-500/10 text-blue-300",
    amber:
      "border-amber-500/30 bg-amber-500/10 text-amber-300",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${colours[colour]}`}
    >
      {labelFromCode(value)}
    </span>
  );
}

function InformationItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4">
      <p className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-slate-200">
        {value}
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-white">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function FinancialMetric({
  label,
  value,
  valueClass = "text-white",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-slate-900/90 p-5">
      <p className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-lg font-bold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-800 pb-4 last:border-b-0 last:pb-0">
      <p className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <div className="mt-1 break-words text-sm text-slate-300">
        {value}
      </div>
    </div>
  );
}