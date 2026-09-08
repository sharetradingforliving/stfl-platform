"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type RangeOption =
  | "1M"
  | "3M"
  | "6M"
  "1Y";

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

type FlowHistoryResponse = {
  status: string;
  start_date: string;
  end_date: string;
  trading_days: number;
  records: FlowRecord[];
};

type CandleRecord = [
  string,
  number,
  number,
  number,
  number,
  number,
  number
];

type CandleResponse = {
  timeframe: string;
  instrumentKey: string;
  candles: CandleRecord[];
  source: string;
};

type ChartPoint = {
  date: string;
  fiiNet: number;
  diiNet: number;

  niftyClose:
    number | null;

  bankNiftyClose:
    number | null;

  niftyPercent:
    number | null;

  bankNiftyPercent:
    number | null;
};

type FlowInterpretation = {
  headline: string;
  summary: string;
  confidence: number;
  sentiment:
    | "positive"
    | "negative"
    | "mixed";
};

const CHART_WIDTH = 1180;
const CHART_HEIGHT = 420;

const PLOT_LEFT = 70;
const PLOT_RIGHT = 1110;
const PLOT_TOP = 35;
const PLOT_BOTTOM = 330;

function formatIsoDate(
  value: Date
): string {
  const year =
    value.getFullYear();

  const month =
    String(
      value.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      value.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getStartDate(
  range: RangeOption
): string {
  const today =
    new Date();

  const months =
  range === "1M"
    ? 1
    : range === "3M"
      ? 3
      : range === "6M"
        ? 6
        : 12;

  today.setMonth(
    today.getMonth() -
    months
  );

  return formatIsoDate(
    today
  );
}

function formatShortDate(
  value: string
): string {
  const parsed =
    new Date(
      `${value}T00:00:00`
    );

  return parsed.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
    }
  );
}

function formatFlowValue(
  value: number
): string {
  const sign =
    value > 0
      ? "+"
      : "";

  return `${sign}₹${value.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )} Cr`;
}

function formatPercent(
  value: number | null
): string {
  if (
    value === null ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  const sign =
    value > 0
      ? "+"
      : "";

  return `${sign}${value.toFixed(
    2
  )}%`;
}

function formatIndexValue(
  value: number | null
): string {
  if (
    value === null ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return value.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}

function createCloseMap(
  candles: CandleRecord[]
): Map<string, number> {
  const values =
    new Map<string, number>();

  for (const candle of candles) {
    const date =
      candle[0].slice(0, 10);

    const close =
      candle[4];

    if (
      Number.isFinite(close)
    ) {
      values.set(
        date,
        close
      );
    }
  }

  return values;
}

function buildFlowInterpretation(
  points: ChartPoint[]
): FlowInterpretation {
  if (points.length === 0) {
    return {
      headline:
        "Insufficient historical data",

      summary:
        "More institutional-flow observations are required before interpreting the selected period.",

      confidence: 0,

      sentiment: "mixed",
    };
  }

  const fiiTotal =
    points.reduce(
      (total, point) =>
        total + point.fiiNet,
      0
    );

  const diiTotal =
    points.reduce(
      (total, point) =>
        total + point.diiNet,
      0
    );

  const combinedTotal =
    fiiTotal + diiTotal;

  const recentPoints =
    points.slice(-5);

  const recentCombined =
    recentPoints.reduce(
      (total, point) =>
        total +
        point.fiiNet +
        point.diiNet,
      0
    );

  const latestNifty =
    [...points]
      .reverse()
      .find(
        (point) =>
          point.niftyPercent !==
          null
      )
      ?.niftyPercent ?? null;

  const latestBankNifty =
    [...points]
      .reverse()
      .find(
        (point) =>
          point.bankNiftyPercent !==
          null
      )
      ?.bankNiftyPercent ?? null;

  let headline =
    "Mixed institutional participation";

  let sentiment:
    FlowInterpretation[
      "sentiment"
    ] = "mixed";

  if (
    fiiTotal > 0 &&
    diiTotal > 0
  ) {
    headline =
      "Broad institutional buying";

    sentiment = "positive";

  } else if (
    fiiTotal < 0 &&
    diiTotal < 0
  ) {
    headline =
      "Broad institutional selling";

    sentiment = "negative";

  } else if (
    fiiTotal < 0 &&
    diiTotal > 0
  ) {
    headline =
      "Domestic institutions are absorbing FII selling";

    sentiment =
      combinedTotal >= 0
        ? "positive"
        : "mixed";

  } else if (
    fiiTotal > 0 &&
    diiTotal < 0
  ) {
    headline =
      "Foreign buying is offsetting domestic selling";

    sentiment =
      combinedTotal >= 0
        ? "positive"
        : "mixed";
  }

  const recentDirection =
    recentCombined > 0
      ? "The latest five reporting sessions show net institutional buying."
      : recentCombined < 0
        ? "The latest five reporting sessions show net institutional selling."
        : "Recent institutional activity is broadly balanced.";

  const indexDirection =
    latestNifty !== null &&
    latestBankNifty !== null
      ? (
          ` During the selected period, Nifty 50 moved ${formatPercent(
            latestNifty
          )} and Bank Nifty moved ${formatPercent(
            latestBankNifty
          )}.`
        )
      : "";

  const confidence =
    Math.min(
      90,
      Math.round(
        50 +
        Math.min(
          points.length,
          80
        ) / 2
      )
    );

  return {
    headline,

    summary:
      `FII/FPI cumulative net activity is ${formatFlowValue(
        fiiTotal
      )}, while DII cumulative net activity is ${formatFlowValue(
        diiTotal
      )}. ${recentDirection}${indexDirection}`,

    confidence,

    sentiment,
  };
}

export default function InstitutionalFlowChart() {
  const [
    selectedRange,
    setSelectedRange,
  ] = useState<RangeOption>(
    "3M"
  );

  const [
    flowRecords,
    setFlowRecords,
  ] = useState<FlowRecord[]>(
    []
  );

  const [
    niftyCandles,
    setNiftyCandles,
  ] = useState<CandleRecord[]>(
    []
  );

  const [
    bankNiftyCandles,
    setBankNiftyCandles,
  ] = useState<CandleRecord[]>(
    []
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

    async function loadChartData() {
      try {
        setIsLoading(true);
        setError("");

        const startDate =
          getStartDate(
            selectedRange
          );

        const endDate =
          formatIsoDate(
            new Date()
          );

        const flowUrl =
          "/api/market/fii-dii/history" +
          `?start_date=${startDate}` +
          `&end_date=${endDate}`;

        const niftyUrl =
          "/api/upstox/candles" +
          "?instrumentKey=" +
          encodeURIComponent(
            "NSE_INDEX|Nifty 50"
          ) +
          "&timeframe=1D";

        const bankNiftyUrl =
          "/api/upstox/candles" +
          "?instrumentKey=" +
          encodeURIComponent(
            "NSE_INDEX|Nifty Bank"
          ) +
          "&timeframe=1D";

        const responses =
          await Promise.all([
            fetch(
              flowUrl,
              {
                cache:
                  "no-store",
              }
            ),

            fetch(
              niftyUrl,
              {
                cache:
                  "no-store",
              }
            ),

            fetch(
              bankNiftyUrl,
              {
                cache:
                  "no-store",
              }
            ),
          ]);

        if (
          responses.some(
            (response) =>
              !response.ok
          )
        ) {
          throw new Error(
            "One or more historical feeds are unavailable."
          );
        }

        const [
          flowData,
          niftyData,
          bankNiftyData,
        ] = await Promise.all([
          responses[0].json() as
            Promise<FlowHistoryResponse>,

          responses[1].json() as
            Promise<CandleResponse>,

          responses[2].json() as
            Promise<CandleResponse>,
        ]);

        if (!requestIsActive) {
          return;
        }

        setFlowRecords(
          Array.isArray(
            flowData.records
          )
            ? flowData.records
            : []
        );

        setNiftyCandles(
          Array.isArray(
            niftyData.candles
          )
            ? niftyData.candles
            : []
        );

        setBankNiftyCandles(
          Array.isArray(
            bankNiftyData.candles
          )
            ? bankNiftyData.candles
            : []
        );

      } catch (chartError) {
        console.error(
          "Institutional-flow chart error:",
          chartError
        );

        if (requestIsActive) {
          setError(
            "Historical institutional-flow chart is temporarily unavailable."
          );
        }

      } finally {
        if (requestIsActive) {
          setIsLoading(false);
        }
      }
    }

    loadChartData();

    return () => {
      requestIsActive = false;
    };
  }, [selectedRange]);

  const chartPoints =
    useMemo<ChartPoint[]>(
      () => {
        const sortedFlows = [
          ...flowRecords,
        ].sort(
          (first, second) =>
            first.date.localeCompare(
              second.date
            )
        );

        const niftyCloseMap =
          createCloseMap(
            niftyCandles
          );

        const bankCloseMap =
          createCloseMap(
            bankNiftyCandles
          );

        const firstNiftyClose =
          sortedFlows
            .map((record) =>
              niftyCloseMap.get(
                record.date
              )
            )
            .find(
              (
                value
              ): value is number =>
                typeof value ===
                "number"
            ) ?? null;

        const firstBankClose =
          sortedFlows
            .map((record) =>
              bankCloseMap.get(
                record.date
              )
            )
            .find(
              (
                value
              ): value is number =>
                typeof value ===
                "number"
            ) ?? null;

        return sortedFlows.map(
          (record) => {
            const niftyClose =
              niftyCloseMap.get(
                record.date
              );

            const bankClose =
              bankCloseMap.get(
                record.date
              );

            return {
              date:
                record.date,

              fiiNet:
                record.fii_fpi.net,

              diiNet:
                record.dii.net,

                              niftyClose:
                niftyClose ??
                null,

              bankNiftyClose:
                bankClose ??
                null,

              niftyPercent:
                firstNiftyClose &&
                niftyClose
                  ? (
                      (
                        niftyClose -
                        firstNiftyClose
                      ) /
                      firstNiftyClose
                    ) *
                    100
                  : null,

              bankNiftyPercent:
                firstBankClose &&
                bankClose
                  ? (
                      (
                        bankClose -
                        firstBankClose
                      ) /
                      firstBankClose
                    ) *
                    100
                  : null,
            };
          }
        );
      },
      [
        flowRecords,
        niftyCandles,
        bankNiftyCandles,
      ]
    );

      const interpretation =
    useMemo(
      () =>
        buildFlowInterpretation(
          chartPoints
        ),
      [chartPoints]
    );

  const chartGeometry =
    useMemo(
      () => {
        const plotWidth =
          PLOT_RIGHT -
          PLOT_LEFT;

        const plotHeight =
          PLOT_BOTTOM -
          PLOT_TOP;

        const zeroY =
          PLOT_TOP +
          plotHeight / 2;

        const largestFlow =
          Math.max(
            1,
            ...chartPoints.flatMap(
              (point) => [
                Math.abs(
                  point.fiiNet
                ),
                Math.abs(
                  point.diiNet
                ),
              ]
            )
          );

        const percentageValues =
          chartPoints.flatMap(
            (point) => [
              point.niftyPercent,
              point.bankNiftyPercent,
            ]
          ).filter(
            (
              value
            ): value is number =>
              typeof value ===
                "number" &&
              Number.isFinite(value)
          );

        const largestPercent =
          Math.max(
            1,
            ...percentageValues.map(
              Math.abs
            )
          );

        const step =
          chartPoints.length > 1
            ? plotWidth /
              (
                chartPoints.length -
                1
              )
            : plotWidth;

        const getX = (
          index: number
        ) =>
          PLOT_LEFT +
          index * step;

        const getFlowY = (
          value: number
        ) =>
          zeroY -
          (
            value /
            largestFlow
          ) *
          (
            plotHeight / 2 -
            12
          );

        const getPercentY = (
          value: number
        ) =>
          zeroY -
          (
            value /
            largestPercent
          ) *
          (
            plotHeight / 2 -
            12
          );

        const niftyLine =
          chartPoints
            .map(
              (
                point,
                index
              ) =>
                point.niftyPercent ===
                null
                  ? null
                  : `${getX(
                      index
                    )},${getPercentY(
                      point.niftyPercent
                    )}`
            )
            .filter(Boolean)
            .join(" ");

        const bankLine =
          chartPoints
            .map(
              (
                point,
                index
              ) =>
                point.bankNiftyPercent ===
                null
                  ? null
                  : `${getX(
                      index
                    )},${getPercentY(
                      point.bankNiftyPercent
                    )}`
            )
            .filter(Boolean)
            .join(" ");

        return {
          zeroY,
          largestFlow,
          largestPercent,
          step,
          getX,
          getFlowY,
          niftyLine,
          bankLine,
        };
      },
      [chartPoints]
    );

  if (isLoading) {
    return (
      <div className="mt-8 h-[430px] animate-pulse rounded-2xl border border-slate-800 bg-slate-900" />
    );
  }

  if (error) {
    return (
      <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
        {error}
      </div>
    );
  }

  if (chartPoints.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">
        Historical institutional-flow data is not available for this period.
      </div>
    );
  }

  const barWidth =
    Math.max(
      2,
      Math.min(
        8,
        chartGeometry.step *
          0.3
      )
    );

  const labelIndexes =
    new Set(
      Array.from(
        {
          length: Math.min(
            6,
            chartPoints.length
          ),
        },
        (_, index) =>
          Math.round(
            index *
            (
              chartPoints.length -
              1
            ) /
            Math.max(
              1,
              Math.min(
                6,
                chartPoints.length
              ) - 1
            )
          )
      )
    );

  return (
    <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/70 p-5 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Historical comparison
          </p>

          <h3 className="mt-2 text-xl font-bold text-white md:text-2xl">
            Institutional Flow and Index Movement
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            Daily FII/FPI and DII net activity compared with normalized Nifty 50 and Bank Nifty movement.
          </p>
        </div>

        <div className="flex rounded-xl border border-slate-800 bg-slate-900 p-1">
          {(
            [
              "1M",
              "3M",
              "6M",
               "1Y",
            ] as RangeOption[]
          ).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() =>
                setSelectedRange(
                  range
                )
              }
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                selectedRange ===
                range
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`mt-6 rounded-2xl border p-5 ${
          interpretation.sentiment ===
          "positive"
            ? "border-emerald-500/30 bg-emerald-500/5"
            : interpretation.sentiment ===
                "negative"
              ? "border-red-500/30 bg-red-500/5"
              : "border-amber-500/30 bg-amber-500/5"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
              STFL Automated Interpretation
            </p>

            <h4 className="mt-2 text-lg font-bold text-white">
              {interpretation.headline}
            </h4>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Data confidence
            </p>

            <p className="mt-1 font-bold text-white">
              {interpretation.confidence}%
            </p>
          </div>
        </div>

        <p className="mt-3 max-w-5xl text-sm leading-7 text-slate-300">
          {interpretation.summary}
        </p>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          This automated interpretation describes historical institutional activity and does not predict future market direction.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-400">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-blue-500" />
          FII/FPI net
        </span>

        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-amber-400" />
          DII net
        </span>

        <span className="flex items-center gap-2">
          <span className="h-0.5 w-5 bg-emerald-400" />
          Nifty 50 %
        </span>

        <span className="flex items-center gap-2">
          <span className="h-0.5 w-5 bg-fuchsia-400" />
          Bank Nifty %
        </span>
      </div>

      <div className="mt-5 overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="min-w-[900px]"
          role="img"
          aria-label="Institutional flow and Indian index movement chart"
        >
          <line
            x1={PLOT_LEFT}
            y1={PLOT_TOP}
            x2={PLOT_RIGHT}
            y2={PLOT_TOP}
            stroke="#1e293b"
          />

          <line
            x1={PLOT_LEFT}
            y1={
              chartGeometry.zeroY
            }
            x2={PLOT_RIGHT}
            y2={
              chartGeometry.zeroY
            }
            stroke="#475569"
            strokeDasharray="5 5"
          />

          <line
            x1={PLOT_LEFT}
            y1={PLOT_BOTTOM}
            x2={PLOT_RIGHT}
            y2={PLOT_BOTTOM}
            stroke="#1e293b"
          />

          <text
            x={PLOT_LEFT}
            y={20}
            fill="#64748b"
            fontSize="11"
          >
            NET FLOW (₹ CRORE)
          </text>

          <text
            x={PLOT_RIGHT}
            y={20}
            fill="#64748b"
            fontSize="11"
            textAnchor="end"
          >
            INDEX MOVEMENT (%)
          </text>

          {chartPoints.map(
            (
              point,
              index
            ) => {
              const x =
                chartGeometry.getX(
                  index
                );

              const fiiY =
                chartGeometry.getFlowY(
                  point.fiiNet
                );

              const diiY =
                chartGeometry.getFlowY(
                  point.diiNet
                );

              return (
                <g
                  key={point.date}
                >
                  <rect
                    x={
                      x -
                      barWidth -
                      1
                    }
                    y={Math.min(
                      fiiY,
                      chartGeometry.zeroY
                    )}
                    width={barWidth}
                    height={Math.max(
                      1,
                      Math.abs(
                        chartGeometry.zeroY -
                        fiiY
                      )
                    )}
                    fill={
                      point.fiiNet >= 0
                        ? "#3b82f6"
                        : "#1d4ed8"
                    }
                    opacity="0.8"
                  >
                    <title>
                      {`${formatShortDate(
                        point.date
                      )} · FII/FPI ${formatFlowValue(
                        point.fiiNet
                      )}`}
                    </title>
                  </rect>

                  <rect
                    x={x + 1}
                    y={Math.min(
                      diiY,
                      chartGeometry.zeroY
                    )}
                    width={barWidth}
                    height={Math.max(
                      1,
                      Math.abs(
                        chartGeometry.zeroY -
                        diiY
                      )
                    )}
                    fill={
                      point.diiNet >= 0
                        ? "#fbbf24"
                        : "#d97706"
                    }
                    opacity="0.8"
                  >
                    <title>
                      {`${formatShortDate(
                        point.date
                      )} · DII ${formatFlowValue(
                        point.diiNet
                      )}`}
                    </title>
                  </rect>

                  <rect
                    x={
                      x -
                      Math.max(
                        4,
                        chartGeometry.step /
                          2
                      )
                    }
                    y={PLOT_TOP}
                    width={Math.max(
                      8,
                      chartGeometry.step
                    )}
                    height={
                      PLOT_BOTTOM -
                      PLOT_TOP
                    }
                    fill="transparent"
                  >
                    <title>
                      {`${formatShortDate(
                        point.date
                      )}
FII/FPI: ${formatFlowValue(
                        point.fiiNet
                      )}
DII: ${formatFlowValue(
                        point.diiNet
                      )}
Nifty 50: ${formatIndexValue(
                        point.niftyClose
                      )} (${formatPercent(
                        point.niftyPercent
                      )})
Bank Nifty: ${formatIndexValue(
                        point.bankNiftyClose
                      )} (${formatPercent(
                        point.bankNiftyPercent
                      )})`}
                    </title>
                  </rect>

                  {labelIndexes.has(
                    index
                  ) && (
                    <text
                      x={x}
                      y={
                        PLOT_BOTTOM +
                        28
                      }
                      fill="#64748b"
                      fontSize="11"
                      textAnchor={
                        index === 0
                          ? "start"
                          : index ===
                              chartPoints.length -
                                1
                            ? "end"
                            : "middle"
                      }
                    >
                      {formatShortDate(
                        point.date
                      )}
                    </text>
                  )}
                </g>
              );
            }
          )}

          {chartGeometry.niftyLine && (
            <polyline
              points={
                chartGeometry.niftyLine
              }
              fill="none"
              stroke="#34d399"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {chartGeometry.bankLine && (
            <polyline
              points={
                chartGeometry.bankLine
              }
              fill="none"
              stroke="#e879f9"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          <text
            x={PLOT_LEFT - 10}
            y={
              chartGeometry.zeroY +
              4
            }
            fill="#64748b"
            fontSize="11"
            textAnchor="end"
          >
            0
          </text>

          <text
            x={PLOT_RIGHT + 10}
            y={PLOT_TOP + 4}
            fill="#34d399"
            fontSize="11"
          >
            {`+${chartGeometry.largestPercent.toFixed(
              1
            )}%`}
          </text>

          <text
            x={PLOT_RIGHT + 10}
            y={PLOT_BOTTOM}
            fill="#f87171"
            fontSize="11"
          >
            {`-${chartGeometry.largestPercent.toFixed(
              1
            )}%`}
          </text>
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4 text-xs text-slate-500">
        <span>
          {chartPoints.length} stored reporting days
        </span>

        <span>
          Index movement is rebased to 0% at the beginning of the selected period.
        </span>
      </div>
    </section>
  );
}