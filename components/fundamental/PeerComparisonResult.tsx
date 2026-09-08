type NullableNumber =
  | number
  | null;

export type PeerComparisonCompany = {
  symbol: string;
  companyName: string;

  revenueGrowth:
    NullableNumber;

  patGrowth:
    NullableNumber;

  ebitdaMargin:
    NullableNumber;

  returnOnEquity:
    NullableNumber;

  returnOnCapitalEmployed:
    NullableNumber;

  debtToEquity:
    NullableNumber;

  priceToEarnings:
    NullableNumber;

  priceToBook:
    NullableNumber;

  enterpriseValueToEbitda:
    NullableNumber;
};

export type PeerRankingDirection =
  | "HIGHER_IS_BETTER"
  | "LOWER_IS_BETTER"
  | "COMPARISON_ONLY";

export type PeerMedianPosition =
  | "ABOVE"
  | "NEAR"
  | "BELOW"
  | "INSUFFICIENT_DATA";

export type PeerMetricKey =
  | "REVENUE_GROWTH"
  | "PAT_GROWTH"
  | "EBITDA_MARGIN"
  | "RETURN_ON_EQUITY"
  | "RETURN_ON_CAPITAL_EMPLOYED"
  | "DEBT_TO_EQUITY"
  | "PRICE_TO_EARNINGS"
  | "PRICE_TO_BOOK"
  | "ENTERPRISE_VALUE_TO_EBITDA";

export type PeerMetricRanking = {
  key: PeerMetricKey;
  label: string;

  direction:
    PeerRankingDirection;

  selectedValue:
    NullableNumber;

  rank: number | null;

  totalCompanies: number;

  peerMedian:
    NullableNumber;

  differenceFromPeerMedianPercent:
    NullableNumber;

  medianPosition:
    PeerMedianPosition;

  validPeerObservations:
    number;
};

export type PeerComparisonRanking = {
  available: boolean;

  suitabilityReason: string;

  selectedCompany:
    PeerComparisonCompany;

  peers:
    PeerComparisonCompany[];

  qualityRankings:
    PeerMetricRanking[];

  valuationComparisons:
    PeerMetricRanking[];

  summary: string[];

  warnings: string[];
};

type PeerComparisonResultProps = {
  ranking:
    PeerComparisonRanking;
};

function isFiniteNumber(
  value:
    | number
    | null
    | undefined
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function formatPercent(
  value:
    | number
    | null
    | undefined
): string {
  if (!isFiniteNumber(value)) {
    return "Not available";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(
    2
  )}%`;
}

function formatRatio(
  value:
    | number
    | null
    | undefined
): string {
  if (!isFiniteNumber(value)) {
    return "Not available";
  }

  return value.toFixed(2);
}

function formatMultiple(
  value:
    | number
    | null
    | undefined
): string {
  if (!isFiniteNumber(value)) {
    return "Not available";
  }

  return `${value.toFixed(2)}x`;
}

function formatMetricValue(
  key: PeerMetricKey,
  value:
    | number
    | null
    | undefined
): string {
  if (
    key === "DEBT_TO_EQUITY"
  ) {
    return formatRatio(value);
  }

  if (
    key ===
      "PRICE_TO_EARNINGS" ||
    key === "PRICE_TO_BOOK" ||
    key ===
      "ENTERPRISE_VALUE_TO_EBITDA"
  ) {
    return formatMultiple(value);
  }

  return formatPercent(value);
}

function ordinal(
  value: number
): string {
  const remainder100 =
    value % 100;

  if (
    remainder100 >= 11 &&
    remainder100 <= 13
  ) {
    return `${value}th`;
  }

  const remainder10 =
    value % 10;

  if (remainder10 === 1) {
    return `${value}st`;
  }

  if (remainder10 === 2) {
    return `${value}nd`;
  }

  if (remainder10 === 3) {
    return `${value}rd`;
  }

  return `${value}th`;
}

function getRankColour(
  ranking:
    PeerMetricRanking
): string {
  if (
    ranking.rank === null ||
    ranking.totalCompanies <= 1
  ) {
    return "text-slate-400";
  }

  if (ranking.rank === 1) {
    return "text-emerald-400";
  }

  if (
    ranking.rank ===
    ranking.totalCompanies
  ) {
    return "text-red-400";
  }

  return "text-amber-300";
}

function getPositionText(
  position:
    PeerMedianPosition
): string {
  if (position === "ABOVE") {
    return "Above peer median";
  }

  if (position === "BELOW") {
    return "Below peer median";
  }

  if (position === "NEAR") {
    return "Near peer median";
  }

  return "Insufficient data";
}

function getPositionColour(
  position:
    PeerMedianPosition
): string {
  if (position === "ABOVE") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  }

  if (position === "BELOW") {
    return "border-sky-500/40 bg-sky-500/10 text-sky-300";
  }

  if (position === "NEAR") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  }

  return "border-slate-700 bg-slate-900 text-slate-400";
}

function getDirectionText(
  direction:
    PeerRankingDirection
): string {
  if (
    direction ===
    "HIGHER_IS_BETTER"
  ) {
    return "Higher value receives the stronger rank";
  }

  if (
    direction ===
    "LOWER_IS_BETTER"
  ) {
    return "Lower value receives the stronger rank";
  }

  return "Descriptive comparison only";
}

function getCompanyValue(
  company:
    PeerComparisonCompany,

  key:
    PeerMetricKey
): NullableNumber {
  if (
    key === "REVENUE_GROWTH"
  ) {
    return company.revenueGrowth;
  }

  if (key === "PAT_GROWTH") {
    return company.patGrowth;
  }

  if (
    key === "EBITDA_MARGIN"
  ) {
    return company.ebitdaMargin;
  }

  if (
    key === "RETURN_ON_EQUITY"
  ) {
    return company.returnOnEquity;
  }

  if (
    key ===
    "RETURN_ON_CAPITAL_EMPLOYED"
  ) {
    return company
      .returnOnCapitalEmployed;
  }

  if (
    key === "DEBT_TO_EQUITY"
  ) {
    return company.debtToEquity;
  }

  if (
    key ===
    "PRICE_TO_EARNINGS"
  ) {
    return company
      .priceToEarnings;
  }

  if (
    key === "PRICE_TO_BOOK"
  ) {
    return company.priceToBook;
  }

  return company
    .enterpriseValueToEbitda;
}

export default function PeerComparisonResult({
  ranking,
}: PeerComparisonResultProps) {
  if (!ranking.available) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6">
        <p className="font-semibold text-amber-300">
          Peer comparison unavailable
        </p>

        <p className="mt-2 text-sm leading-6 text-amber-100/80">
          {ranking.suitabilityReason}
        </p>
      </div>
    );
  }

  const comparisonCompanies = [
    ranking.selectedCompany,
    ...ranking.peers,
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
              Peer Positioning
            </p>

            <h3 className="mt-2 text-2xl font-bold text-white">
              {
                ranking
                  .selectedCompany
                  .companyName
              }
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Ranked against{" "}
              {ranking.peers.length}{" "}
              user-selected comparable
              {ranking.peers.length === 1
                ? " company"
                : " companies"}
              .
            </p>
          </div>

          <span className="w-fit rounded-full border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-xs font-semibold text-sky-300">
            COMPARISON — NOT FAIR VALUE
          </span>
        </div>

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm font-semibold text-white">
            STFL comparison summary
          </p>

          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
            {ranking.summary.map(
              (statement, index) => (
                <li
                  key={`${statement}-${index}`}
                  className="flex gap-3"
                >
                  <span className="text-emerald-400">
                    •
                  </span>

                  <span>
                    {statement}
                  </span>
                </li>
              )
            )}
          </ul>
        </div>

        <p className="mt-5 text-xs leading-5 text-slate-500">
          {ranking.suitabilityReason}
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
        <div>
          <h3 className="text-xl font-bold text-white">
            Financial-quality ranking
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            Rankings use reported
            financial metrics from the
            selected companies.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ranking.qualityRankings.map(
            (metric) => (
              <div
                key={metric.key}
                className="rounded-xl border border-slate-800 bg-slate-900 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-slate-400">
                    {metric.label}
                  </p>

                  {metric.rank !==
                    null &&
                    metric.totalCompanies >
                      0 && (
                      <span
                        className={`text-sm font-bold ${getRankColour(
                          metric
                        )}`}
                      >
                        {ordinal(
                          metric.rank
                        )}{" "}
                        of{" "}
                        {
                          metric
                            .totalCompanies
                        }
                      </span>
                    )}
                </div>

                <p className="mt-3 text-xl font-bold text-white">
                  {formatMetricValue(
                    metric.key,
                    metric.selectedValue
                  )}
                </p>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
                  <div>
                    <p className="text-xs text-slate-500">
                      Selected-peer median
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-300">
                      {formatMetricValue(
                        metric.key,
                        metric.peerMedian
                      )}
                    </p>
                  </div>

                  <p className="max-w-36 text-right text-xs leading-5 text-slate-500">
                    {getDirectionText(
                      metric.direction
                    )}
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
        <div>
          <h3 className="text-xl font-bold text-white">
            Valuation-multiple
            positioning
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            These multiples show whether
            the company trades above,
            near or below the selected
            peer median. They do not
            independently establish fair
            value.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {ranking
            .valuationComparisons
            .map((metric) => (
              <div
                key={metric.key}
                className="rounded-xl border border-slate-800 bg-slate-900 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-slate-400">
                    {metric.label}
                  </p>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPositionColour(
                      metric.medianPosition
                    )}`}
                  >
                    {getPositionText(
                      metric.medianPosition
                    )}
                  </span>
                </div>

                <p className="mt-4 text-2xl font-bold text-white">
                  {formatMetricValue(
                    metric.key,
                    metric.selectedValue
                  )}
                </p>

                <div className="mt-4 space-y-2 border-t border-slate-800 pt-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">
                      Peer median
                    </span>

                    <span className="font-semibold text-slate-300">
                      {formatMetricValue(
                        metric.key,
                        metric.peerMedian
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">
                      Difference
                    </span>

                    <span className="font-semibold text-slate-300">
                      {formatPercent(
                        metric
                          .differenceFromPeerMedianPercent
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">
                      Peer observations
                    </span>

                    <span className="font-semibold text-slate-300">
                      {
                        metric
                          .validPeerObservations
                      }
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
        <div className="p-6">
          <h3 className="text-xl font-bold text-white">
            Detailed peer comparison
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            The selected company is
            highlighted. Valuation
            multiples are descriptive and
            are not scored as higher or
            lower quality.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="border-y border-slate-800 bg-slate-900 text-left text-slate-400">
              <tr>
                <th className="px-4 py-4">
                  Company
                </th>

                {[
                  ...ranking
                    .qualityRankings,
                  ...ranking
                    .valuationComparisons,
                ].map((metric) => (
                  <th
                    key={metric.key}
                    className="whitespace-nowrap px-4 py-4"
                  >
                    {metric.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {comparisonCompanies.map(
                (
                  company,
                  companyIndex
                ) => {
                  const isSelected =
                    companyIndex === 0;

                  return (
                    <tr
                      key={
                        company.symbol
                      }
                      className={`border-b border-slate-800 last:border-b-0 ${
                        isSelected
                          ? "bg-emerald-500/10"
                          : ""
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <p
                              className={`font-bold ${
                                isSelected
                                  ? "text-emerald-300"
                                  : "text-white"
                              }`}
                            >
                              {
                                company.symbol
                              }
                            </p>

                            <p className="mt-1 max-w-48 truncate text-xs text-slate-500">
                              {
                                company.companyName
                              }
                            </p>
                          </div>

                          {isSelected && (
                            <span className="rounded-full border border-emerald-500/40 px-2 py-1 text-[10px] font-semibold text-emerald-300">
                              SELECTED
                            </span>
                          )}
                        </div>
                      </td>

                      {[
                        ...ranking
                          .qualityRankings,
                        ...ranking
                          .valuationComparisons,
                      ].map(
                        (metric) => (
                          <td
                            key={`${company.symbol}-${metric.key}`}
                            className="whitespace-nowrap px-4 py-4 text-slate-300"
                          >
                            {formatMetricValue(
                              metric.key,
                              getCompanyValue(
                                company,
                                metric.key
                              )
                            )}
                          </td>
                        )
                      )}
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </div>

      {ranking.warnings.length >
        0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6">
          <h3 className="font-bold text-amber-300">
            Comparison warnings
          </h3>

          <ul className="mt-4 space-y-2 text-sm leading-6 text-amber-100/80">
            {ranking.warnings.map(
              (warning, index) => (
                <li
                  key={`${warning}-${index}`}
                >
                  • {warning}
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  );
}