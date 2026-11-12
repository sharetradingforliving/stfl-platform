import "server-only";

type HistoryRecord = {
  periodEnd?: string;
  consolidated?: boolean;
  currency?: string;
  unitScale?: string;
  source?: {
    name?: string;
    isDerived?: boolean;
  };
  incomeStatement?: {
    revenue?: number | null;
    profitAfterTax?: number | null;
  };
  balanceSheet?: {
    totalAssets?: number | null;
  };
};

type HistoryResponse = {
  status?: string;
  company?: {
    symbol?: string;
    exchange?: string;
    companyName?: string;
  };
  records?: HistoryRecord[];
};

function formatAmount(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2,
      }).format(value)
    : null;
}

export default async function PublicFinancialHighlights({
  symbol,
  exchange,
}: {
  symbol: string;
  exchange: "NSE" | "BSE";
}) {
  const baseUrl = (
    process.env.STFL_FINANCIAL_BACKEND_URL ||
    process.env.STFL_BACKEND_URL ||
    ""
  ).replace(/\/+$/, "");

  const readToken =
    process.env.FINANCIAL_HISTORY_READ_TOKEN;

      console.log("Public highlights configuration", {
    symbol,
    backendConfigured: Boolean(baseUrl),
    readTokenConfigured: Boolean(readToken),
  });

  if (!baseUrl || !readToken) {
    return null;
  }

  let data: HistoryResponse;

  try {
    const response = await fetch(
      `${baseUrl}/api/fundamental/history/company/${encodeURIComponent(symbol)}?exchange=${exchange}&years=1`,
      {
        headers: {
          "X-STFL-Read-Token": readToken,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      }
    );

        console.log("Public highlights backend status", {
      symbol,
      status: response.status,
    });

    if (!response.ok) {
      return null;
    }

    data = (await response.json()) as HistoryResponse;
  } catch {
    // Company information and the dashboard remain available.
    return null;
  }

  if (
    data.status !== "success" ||
    data.company?.symbol !== symbol ||
    data.company?.exchange !== exchange ||
    !Array.isArray(data.records)
  ) {
    return null;
  }

  const latest = [...data.records].sort(
    (first, second) =>
      (second.periodEnd ?? "").localeCompare(
        first.periodEnd ?? ""
      )
  )[0];

    console.log("Public highlights record check", {
    symbol,
    recordCount: data.records.length,
    periodEnd: latest?.periodEnd,
    consolidated: latest?.consolidated,
    currency: latest?.currency,
    unitScale: latest?.unitScale,
  });

  if (
    !latest ||
    latest.consolidated !== true ||
    latest.currency?.toUpperCase() !== "INR" ||
    latest.unitScale?.toUpperCase() !== "CRORES" ||
    !latest.periodEnd ||
    !/^\d{4}-\d{2}-\d{2}$/.test(latest.periodEnd)
  ) {
    return null;
  }

  const isBank = /\bbank\b/i.test(
    data.company?.companyName ?? ""
  );

  const highlights = [
    {
      label: isBank ? "Total income" : "Revenue",
      value: formatAmount(latest.incomeStatement?.revenue),
    },
    {
      label: "Profit after tax",
      value: formatAmount(
        latest.incomeStatement?.profitAfterTax
      ),
    },
    {
      label: "Total assets",
      value: formatAmount(latest.balanceSheet?.totalAssets),
    },
  ].filter((item) => item.value !== null);

    console.log("Public highlights available fields", {
    symbol,
    highlightCount: highlights.length,
    revenueType:
      typeof latest.incomeStatement?.revenue,
    profitAfterTaxType:
      typeof latest.incomeStatement?.profitAfterTax,
    totalAssetsType:
      typeof latest.balanceSheet?.totalAssets,
  });

  if (highlights.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="public-financial-highlights"
      className="border-b border-slate-200 bg-white px-6 py-8 dark:border-slate-800 dark:bg-slate-950"
    >
      <div className="mx-auto max-w-7xl">
        <h2
          id="public-financial-highlights"
          className="text-xl font-bold text-slate-900 dark:text-white"
        >
          Latest annual financial highlights
        </h2>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Consolidated · Year ended {latest.periodEnd} ·
          Amounts in ₹ crore
        </p>

        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200 p-5 dark:border-slate-800"
            >
              <dt className="text-sm text-slate-600 dark:text-slate-400">
                {item.label}
              </dt>
              <dd className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 text-xs text-slate-600 dark:text-slate-400">
          Source: {latest.source?.name ?? "Stored financial records"}.
          {latest.source?.isDerived
            ? " Derived from quarterly filings."
            : " Annual filing."}
        </p>
      </div>
    </section>
  );
}