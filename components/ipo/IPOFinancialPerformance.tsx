import type {
  IPOFinancialData,
} from "@/lib/ipo/financialTypes";

type Props = {
  financials: IPOFinancialData | null;
};

function formatValue(
  value?: number
) {
  if (
    value === undefined ||
    value === null ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return `₹${value.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  )} Cr`;
}

function formatPercent(
  value?: number
) {
  if (
    value === undefined ||
    value === null ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return `${value.toFixed(2)}%`;
}

export default function IPOFinancialPerformance({
  financials,
}: Props) {

  return (
    <section className="rounded-2xl border border-slate-800 bg-[#07111f] p-6">

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Financial Analysis
        </p>

        <h2 className="mt-2 text-xl font-bold text-white">
          Financial Performance
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Revenue, profitability, margins, returns,
          leverage and cash-flow trends before the IPO.
        </p>
      </div>

      {!financials ||
      financials.years.length === 0 ? (

        <div className="mt-6 rounded-xl border border-dashed border-slate-700 bg-[#0a1424] p-8 text-center">

          <p className="font-semibold text-slate-300">
            Financial data integration in progress
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            STFL will display audited pre-IPO financial
            statements, growth, profitability and return
            ratios here.
          </p>

        </div>

      ) : (

        <>
          <div className="mt-6 overflow-x-auto">

            <table className="w-full min-w-[720px]">

              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">

                  <th className="px-3 py-3">
                    Metric
                  </th>

                  {financials.years.map(
                    (year) => (
                      <th
                        key={year.period}
                        className="px-3 py-3 text-right"
                      >
                        {year.period}
                      </th>
                    )
                  )}

                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">

                <FinancialRow
                  label="Revenue"
                  years={financials.years}
                  getValue={(year) =>
                    formatValue(
                      year.revenue
                    )
                  }
                />

                <FinancialRow
                  label="EBITDA"
                  years={financials.years}
                  getValue={(year) =>
                    formatValue(
                      year.ebitda
                    )
                  }
                />

                <FinancialRow
                  label="PAT"
                  years={financials.years}
                  getValue={(year) =>
                    formatValue(
                      year.pat
                    )
                  }
                />

                <FinancialRow
                  label="EBITDA Margin"
                  years={financials.years}
                  getValue={(year) =>
                    formatPercent(
                      year.ebitdaMargin
                    )
                  }
                />

                <FinancialRow
                  label="PAT Margin"
                  years={financials.years}
                  getValue={(year) =>
                    formatPercent(
                      year.patMargin
                    )
                  }
                />

                <FinancialRow
                  label="ROE"
                  years={financials.years}
                  getValue={(year) =>
                    formatPercent(
                      year.roe
                    )
                  }
                />

                <FinancialRow
                  label="ROCE"
                  years={financials.years}
                  getValue={(year) =>
                    formatPercent(
                      year.roce
                    )
                  }
                />

                <FinancialRow
                  label="Debt / Equity"
                  years={financials.years}
                  getValue={(year) =>
                    year.debtEquity !==
                    undefined
                      ? year.debtEquity.toFixed(
                          2
                        )
                      : "—"
                  }
                />

              </tbody>

            </table>

          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">

            <GrowthCard
              label="Revenue CAGR"
              value={financials.revenueCagr}
            />

            <GrowthCard
              label="PAT CAGR"
              value={financials.patCagr}
            />

          </div>

        </>
      )}

    </section>
  );
}

type FinancialYear =
  IPOFinancialData["years"][number];

function FinancialRow({
  label,
  years,
  getValue,
}: {
  label: string;
  years: FinancialYear[];
  getValue: (
    year: FinancialYear
  ) => string;
}) {
  return (
    <tr>

      <td className="px-3 py-4 text-sm font-medium text-slate-300">
        {label}
      </td>

      {years.map(
        (year) => (
          <td
            key={`${label}-${year.period}`}
            className="px-3 py-4 text-right text-sm font-semibold text-white"
          >
            {getValue(year)}
          </td>
        )
      )}

    </tr>
  );
}

function GrowthCard({
  label,
  value,
}: {
  label: string;
  value?: number;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0a1424] p-4">

      <p className="text-xs uppercase tracking-[0.15em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-white">
        {value !== undefined
          ? `${value.toFixed(2)}%`
          : "—"}
      </p>

    </div>
  );
}