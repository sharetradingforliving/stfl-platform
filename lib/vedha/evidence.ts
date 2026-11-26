import { ADX, ATR } from "technicalindicators";

import {
  calculateSupertrend,
  detectCandlePatterns,
  calculatePivotSeries,
  isClosedEquityCandle,
  timestamp,
  validCandle,
  type StudyCandle,
} from "@/lib/indicators/chartStudies";

import {
  sma,
  ema,
  rsi,
  macd,
  slope,
} from "./seriesMath";

import type {
  Context,
  Evidence,
  Fact,
} from "./contracts";

const fmt = (value: number, digits = 2) =>
  value.toLocaleString("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const money = (value: number) => `₹${fmt(value)}`;

const date = (time: StudyCandle["time"]) =>
  new Date(timestamp(time)).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  }) + " IST";

export function parseCandles(
  raw: unknown,
  now: number,
): StudyCandle[] {
  if (!Array.isArray(raw)) {
    throw new Error("Invalid candle response.");
  }

  const seen = new Map<number, StudyCandle>();

  for (const row of raw) {
    if (!Array.isArray(row) || row.length < 6) {
      continue;
    }

    const milliseconds =
      typeof row[0] === "string"
        ? Date.parse(row[0])
        : NaN;

    if (
      !Number.isFinite(milliseconds) ||
      milliseconds > now ||
      ![1, 2, 3, 4, 5].every(
        index =>
          typeof row[index] === "number" &&
          Number.isFinite(row[index]),
      ) ||
      row[5] < 0 ||
      row[3] <= 0
    ) {
      continue;
    }

    const candle: StudyCandle = {
      time: Math.floor(
        milliseconds / 1000,
      ) as StudyCandle["time"],
      open: row[1],
      high: row[2],
      low: row[3],
      close: row[4],
      volume: row[5],
    };

    if (validCandle(candle)) {
      seen.set(milliseconds, candle);
    }
  }

  return [...seen.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, candle]) => candle);
}

export function buildEvidence(
  context: Context,
  candles: StudyCandle[],
  daily: StudyCandle[],
  now: number,
): Evidence {
  const closed = candles.filter(candle =>
    isClosedEquityCandle(
      candle.time,
      context.timeframe,
      now,
    ),
  );

  if (closed.length < 60) {
    throw new Error(
      "At least sixty completed candles are needed for this analysis.",
    );
  }

  const last = closed.at(-1)!;
  const previous = closed.at(-2)!;
  const closes = closed.map(candle => candle.close);

  const facts: Fact[] = [];
  const observations: string[] = [];

  const limitations = [
    "Analysis uses completed historical candles and their close, not a live executable quote. Compare candle time with the current chart before using it.",
    "The closure rule uses standard NSE/BSE equity hours with a publication margin; special sessions and holidays are not verified against an exchange calendar.",
    "Indicator settings are independently fixed for this report, including Supertrend ten/three; they do not inherit custom chart-study settings.",
    "This release has no verified fundamentals, news, analyst estimates, historical analogue success rates or trading execution. No inference about trader intentions is established by candles alone.",
  ];

  function add(
    id: string,
    label: string,
    value: number | string | null,
    unit:
      | "price"
      | "percent"
      | "number"
      | "count"
      | "multiple" = "number",
    source = "Upstox historical candles",
  ) {
    if (
      value === null ||
      (typeof value === "number" &&
        !Number.isFinite(value))
    ) {
      return;
    }

    const formatted =
      typeof value === "string"
        ? value
        : unit === "price"
          ? money(value)
          : unit === "percent"
            ? `${fmt(value)}%`
            : unit === "count"
              ? fmt(value, 0)
              : unit === "multiple"
                ? `${fmt(value)}×`
                : fmt(value);

    facts.push({
      id,
      label,
      value: formatted,
      source,
    });
  }

  add(
    "symbol",
    "Analysed instrument",
    `${context.exchange}:${context.symbol}`,
  );

  add(
    "timeframe",
    "Analysed candle timeframe",
    context.timeframe,
  );

  add(
    "close",
    "Last completed candle close",
    last.close,
    "price",
  );

  add(
    "candle_time",
    "Last completed candle start",
    date(last.time),
  );

  add(
    "bars",
    "Completed candles used",
    closed.length,
    "count",
  );

  add(
    "change",
    "Change versus preceding completed candle",
    (last.close / previous.close - 1) * 100,
    "percent",
  );

  const movingAverageValues: Record<
    string,
    number | null
  > = {};

  for (const period of [20, 50, 100, 200]) {
    for (const kind of ["ema", "sma"] as const) {
      const values =
        kind === "ema"
          ? ema(closes, period)
          : sma(closes, period);

      const value = values.at(-1) ?? null;

      movingAverageValues[kind + period] = value;

      add(
        kind + period,
        `${kind.toUpperCase()} ${period}`,
        value,
        "price",
      );

      add(
        kind + period + "_slope",
        `${kind.toUpperCase()} ${period} change over five bars`,
        slope(values),
        "percent",
      );

      if (value !== null) {
        const position =
          last.close > value
            ? "above"
            : last.close < value
              ? "below"
              : "at";

        observations.push(
          `Close is ${position} ${kind.toUpperCase()} ${period}.`,
        );
      }
    }
  }

  const emaValues = [20, 50, 100, 200].map(
    period => movingAverageValues["ema" + period],
  );

  if (emaValues.every(value => value !== null)) {
    const bullish = emaValues.every(
      (value, index) =>
        index === 0 ||
        emaValues[index - 1]! > value!,
    );

    const bearish = emaValues.every(
      (value, index) =>
        index === 0 ||
        emaValues[index - 1]! < value!,
    );

    observations.push(
      bullish
        ? "EMA stack is bullishly aligned."
        : bearish
          ? "EMA stack is bearishly aligned."
          : "EMA alignment is mixed.",
    );
  } else {
    observations.push(
      "Longer EMA alignment cannot be assessed due to warm-up coverage.",
    );
  }

  const rsiValues = rsi(closes);
  const macdValues = macd(closes);

  const rsiNow = rsiValues.at(-1);
  const rsiThen = rsiValues.at(-6);

  const histogramNow = macdValues.histogram.at(-1);
  const histogramThen = macdValues.histogram.at(-6);

  if (rsiNow != null && rsiThen != null) {
    const direction =
      rsiNow > rsiThen
        ? "higher"
        : rsiNow < rsiThen
          ? "lower"
          : "unchanged";

    observations.push(
      `RSI is ${direction} versus five completed bars earlier. This comparison does not establish divergence.`,
    );
  }

  if (histogramNow != null && histogramThen != null) {
    const direction =
      histogramNow > histogramThen
        ? "higher"
        : histogramNow < histogramThen
          ? "lower"
          : "unchanged";

    observations.push(
      `MACD histogram is ${direction} versus five completed bars earlier. This does not by itself establish a crossover.`,
    );
  }

  add("rsi", "RSI fourteen", rsiNow ?? null);

  add(
    "rsi_prior",
    "RSI five bars earlier",
    rsiThen ?? null,
  );

  add(
    "macd",
    "MACD twelve twenty-six",
    macdValues.line.at(-1) ?? null,
  );

  add(
    "macd_signal",
    "MACD signal nine",
    macdValues.signal.at(-1) ?? null,
  );

  add(
    "macd_hist",
    "MACD histogram",
    histogramNow ?? null,
  );

  add(
    "macd_hist_prior",
    "MACD histogram five bars earlier",
    histogramThen ?? null,
  );

  const meanVolume =
    closed
      .slice(-21, -1)
      .reduce(
        (total, candle) => total + (candle.volume ?? 0),
        0,
      ) / 20;

  const volume = last.volume ?? 0;

  const relativeVolume =
    meanVolume > 0 ? volume / meanVolume : null;

  add(
    "volume",
    "Last completed candle volume",
    volume,
    "count",
  );

  add(
    "volume_mean",
    "Prior twenty completed bars mean volume",
    meanVolume,
  );

  add(
    "relative_volume",
    "Relative volume against prior twenty bars",
    relativeVolume,
    "multiple",
  );

  observations.push(
    relativeVolume === null
      ? "Volume comparison unavailable."
      : relativeVolume >= 1.5
        ? "Volume is elevated relative to the preceding average."
        : relativeVolume < 0.75
          ? "Volume is subdued relative to the preceding average."
          : "Volume is broadly near its preceding average; small differences are not strong confirmation.",
  );

  const highsForIndicators = closed.map(
    candle => candle.high,
  );

  const lowsForIndicators = closed.map(
    candle => candle.low,
  );

  const directional = ADX.calculate({
    high: highsForIndicators,
    low: lowsForIndicators,
    close: closes,
    period: 14,
  }).at(-1);

  if (directional) {
    add("adx", "ADX fourteen", directional.adx);

    add(
      "plus_di",
      "Positive directional indicator",
      directional.pdi,
    );

    add(
      "minus_di",
      "Negative directional indicator",
      directional.mdi,
    );
  }

  const atr = ATR.calculate({
    high: highsForIndicators,
    low: lowsForIndicators,
    close: closes,
    period: 14,
  }).at(-1);

  if (atr !== undefined) {
    add("atr", "ATR fourteen", atr, "price");

    add(
      "atr_percent",
      "ATR relative to last completed close",
      (atr / last.close) * 100,
      "percent",
    );
  }

  const supertrend = calculateSupertrend(
    closed,
    10,
    3,
  );

  const latestSupertrend = supertrend.at(-1);

  if (latestSupertrend) {
    add(
      "supertrend",
      "Supertrend ten three",
      latestSupertrend.value,
      "price",
    );

    add(
      "supertrend_direction",
      "Supertrend direction",
      latestSupertrend.direction,
    );

    const flip = supertrend.findLastIndex(
      (point, index) =>
        index > 0 &&
        point.direction !==
          supertrend[index - 1].direction,
    );

    if (flip >= 0) {
      add(
        "supertrend_flip",
        "Last observed Supertrend direction change",
        date(supertrend[flip].time),
      );
    }
  }

  const swings: {
    index: number;
    price: number;
    kind: "high" | "low";
  }[] = [];

  for (
    let index = Math.max(3, closed.length - 180);
    index < closed.length - 3;
    index++
  ) {
    const window = closed.slice(
      index - 3,
      index + 4,
    );

    const swingHigh = window.every(
      (candle, offset) =>
        offset === 3 ||
        closed[index].high > candle.high,
    );

    const swingLow = window.every(
      (candle, offset) =>
        offset === 3 ||
        closed[index].low < candle.low,
    );

    if (swingHigh) {
      swings.push({
        index,
        price: closed[index].high,
        kind: "high",
      });
    }

    if (swingLow) {
      swings.push({
        index,
        price: closed[index].low,
        kind: "low",
      });
    }
  }

  const highs = swings.filter(
    swing => swing.kind === "high",
  );

  const lows = swings.filter(
    swing => swing.kind === "low",
  );

  for (const [kind, points] of [
    ["high", highs],
    ["low", lows],
  ] as const) {
    const recent = points.at(-1);
    const prior = points.at(-2);

    if (recent) {
      add(
        "swing_" + kind,
        "Latest confirmed swing " + kind,
        `${money(recent.price)} at ${date(
          closed[recent.index].time,
        )}`,
      );
    }

    if (prior) {
      add(
        "prior_swing_" + kind,
        "Previous confirmed swing " + kind,
        `${money(prior.price)} at ${date(
          closed[prior.index].time,
        )}`,
      );
    }
  }

  if (highs.length >= 2 && lows.length >= 2) {
    const highDirection =
      highs.at(-1)!.price > highs.at(-2)!.price
        ? "rising"
        : "falling or equal";

    const lowDirection =
      lows.at(-1)!.price > lows.at(-2)!.price
        ? "rising"
        : "falling or equal";

    observations.push(
      `Last two confirmed swing highs are ${highDirection}; last two confirmed swing lows are ${lowDirection}.`,
    );
  }

  const supports = [
    ...new Set(
      lows
        .map(swing => swing.price)
        .filter(value => value < last.close),
    ),
  ]
    .sort((a, b) => b - a)
    .slice(0, 2);

  const resistances = [
    ...new Set(
      highs
        .map(swing => swing.price)
        .filter(value => value > last.close),
    ),
  ]
    .sort((a, b) => a - b)
    .slice(0, 2);

  supports.forEach((value, index) => {
    add(
      "support" + (index + 1),
      `Confirmed swing support ${index + 1}`,
      value,
      "price",
    );

    add(
      "support" + (index + 1) + "_distance",
      `Distance down to support ${index + 1}`,
      ((last.close - value) / last.close) * 100,
      "percent",
    );
  });

  resistances.forEach((value, index) => {
    add(
      "resistance" + (index + 1),
      `Confirmed swing resistance ${index + 1}`,
      value,
      "price",
    );

    add(
      "resistance" + (index + 1) + "_distance",
      `Distance up to resistance ${index + 1}`,
      ((value - last.close) / last.close) * 100,
      "percent",
    );
  });

  const anchorB = swings.at(-1);

  const anchorA = anchorB
    ? swings
        .filter(
          swing =>
            swing.index < anchorB.index &&
            swing.kind !== anchorB.kind,
        )
        .at(-1)
    : undefined;

  if (anchorA && anchorB) {
    add(
      "fib_direction",
      "Fibonacci anchor move",
      anchorB.price > anchorA.price
        ? "Upward confirmed swing; levels measure a downward retracement"
        : "Downward confirmed swing; levels measure an upward retracement",
    );

    add(
      "fib_a",
      "Fibonacci start anchor",
      `${money(anchorA.price)} at ${date(
        closed[anchorA.index].time,
      )}`,
    );

    add(
      "fib_b",
      "Fibonacci end anchor",
      `${money(anchorB.price)} at ${date(
        closed[anchorB.index].time,
      )}`,
    );

    for (const ratio of [0.382, 0.5, 0.618]) {
      add(
        "fib_" + Math.round(ratio * 1000),
        `${ratio * 100}% retracement of latest confirmed alternating swing`,
        anchorB.price +
          (anchorA.price - anchorB.price) * ratio,
        "price",
      );
    }

    limitations.push(
      "Fibonacci anchors are the latest alternating strict three-bar confirmed swings within the downloaded window, not manually selected major market turning points.",
    );
  }

  const pivotPeriod =
    context.timeframe === "D"
      ? "weekly"
      : context.timeframe === "W" ||
          context.timeframe === "M"
        ? "monthly"
        : "daily";

  const pivots = calculatePivotSeries(
    [last],
    daily,
    pivotPeriod,
    now,
  ).at(-1);

  if (pivots) {
    add(
      "pivot_reference",
      "Traditional pivot reference",
      `${pivotPeriod} ${pivots.referencePeriod}; target ${pivots.targetPeriod}`,
    );

    for (const [key, value] of Object.entries(
      pivots.levels,
    )) {
      add(
        "pivot_" + key,
        `Traditional ${pivotPeriod} ${key}`,
        value,
        "price",
      );
    }
  }

  const patterns = detectCandlePatterns(closed)
    .filter(
      pattern =>
        timestamp(pattern.time) >=
        timestamp(closed.at(-20)!.time),
    )
    .slice(-10);

  add(
    "patterns",
    "Recent detected candle patterns",
    patterns.length
      ? patterns
          .map(
            pattern =>
              `${pattern.name} (${pattern.bias}) at ${date(
                pattern.time,
              )}`,
          )
          .join("; ")
      : "No supported candle-pattern match in the last twenty completed candles",
  );

  limitations.push(
    "Swing levels use strict three-bar local extremes, not the existing full support-resistance confluence engine. No chart-pattern detector, divergence detector or risk-reward scenario engine is connected in this increment.",
  );

  const age = now - timestamp(last.time);

  if (
    age > 7 * 86400000 &&
    !["W", "M"].includes(context.timeframe)
  ) {
    limitations.push(
      "The latest available candle is more than seven calendar days old. Treat this as stale historical research.",
    );
  }

  return {
    version: "vedha-evidence-2.4",
    context,
    generatedAt: new Date(now).toISOString(),
    candleAsOf: new Date(
      timestamp(last.time),
    ).toISOString(),
    fetchedAt: new Date(now).toISOString(),
    facts,
    observations,
    limitations,
  };
}