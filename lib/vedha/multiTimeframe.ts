import { addLevelResearch } from "./levelResearch";
import type { Evidence } from "./contracts";
import { ema, slope } from "./seriesMath";
import {
  isClosedEquityCandle,
  timestamp,
  type StudyCandle,
} from "@/lib/indicators/chartStudies";
export const TREND_FRAMES = [
  {
    timeframe: "1H",
    key: "hourly",
    name: "Hourly",
    role: "Short-term",
    maximumAge: 7,
  },
  {
    timeframe: "D",
    key: "daily",
    name: "Daily",
    role: "Intermediate",
    maximumAge: 14,
  },
  {
    timeframe: "W",
    key: "weekly",
    name: "Weekly",
    role: "Medium-term",
    maximumAge: 28,
  },
  {
    timeframe: "M",
    key: "monthly",
    name: "Monthly",
    role: "Long-term",
    maximumAge: 100,
  },
] as const;
/** Deterministic agreement check, not a forecast or a measured probability. */
export function trendSnapshot(
  candles: StudyCandle[] | undefined,
  frame: (typeof TREND_FRAMES)[number],
  now: number,
) {
  const closed = (candles ?? []).filter((c) =>
    isClosedEquityCandle(c.time, frame.timeframe, now),
  );
  const last = closed.at(-1);
  const asOf = last
    ? new Date(timestamp(last.time)).toISOString()
    : "Unavailable";
  const coverage = `${closed.length.toLocaleString("en-IN")} completed candles; latest candle start ${asOf}`;
  if (!last)
    return {
      status: "Insufficient evidence",
      summary: "No verified completed candles are available.",
      coverage,
    };
  if (now - timestamp(last.time) > frame.maximumAge * 86400000)
    return {
      status: "Stale evidence",
      summary:
        "The latest candle exceeds the freshness allowance for this timeframe; no current trend classification is made.",
      coverage,
    };
  if (closed.length < 205)
    return {
      status: "Insufficient evidence",
      summary:
        "The two hundred-period EMA and its five-bar slope require at least two hundred five completed candles. Shorter averages are not substituted for long-term coverage.",
      coverage,
    };
  const close = closed.map((c) => c.close),
    averages = [20, 50, 200].map((period) => ema(close, period));
  const values = averages.map((series) => series.at(-1)! as number),
    slopes = averages.map((series) => slope(series)!);
  const highs: number[] = [],
    lows: number[] = [];
  for (let i = Math.max(3, closed.length - 180); i < closed.length - 3; i++) {
    const window = closed.slice(i - 3, i + 4);
    if (window.every((c, j) => j === 3 || closed[i].high > c.high))
      highs.push(closed[i].high);
    if (window.every((c, j) => j === 3 || closed[i].low < c.low))
      lows.push(closed[i].low);
  }
  const swing =
    highs.length < 2 || lows.length < 2
      ? "unavailable"
      : highs.at(-1)! > highs.at(-2)! && lows.at(-1)! > lows.at(-2)!
        ? "rising"
        : highs.at(-1)! < highs.at(-2)! && lows.at(-1)! < lows.at(-2)!
          ? "falling"
          : "mixed";
  const above = values.every((v) => last.close > v),
    below = values.every((v) => last.close < v);
  const up = values[0] > values[1] && values[1] > values[2],
    down = values[0] < values[1] && values[1] < values[2];
  const rising = slopes.every((v) => v > 0),
    falling = slopes.every((v) => v < 0);
  const status =
    above && up && rising && swing === "rising"
      ? "Bullish"
      : below && down && falling && swing === "falling"
        ? "Bearish"
        : "Mixed";
  const price = (v: number) =>
    `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const summary = `Close ${price(last.close)}; twenty/fifty/two hundred-period EMAs ${values.map(price).join(" / ")}. Price is ${above ? "above all" : below ? "below all" : "across"} these averages; EMA ordering is ${up ? "bullish" : down ? "bearish" : "mixed"}; five-bar slopes are ${rising ? "all positive" : falling ? "all negative" : "mixed or flat"}; latest confirmed swing highs and lows are ${swing}.`;
  return { status, summary, coverage };
}
export function addMultiTimeframeEvidence(
  evidence: Evidence,
  series: Map<string, StudyCandle[]>,
  now: number,
): Evidence {
  const facts = [...evidence.facts];
  for (const frame of TREND_FRAMES) {
    const row = trendSnapshot(series.get(frame.timeframe), frame, now);
    for (const [key, value] of Object.entries(row))
      facts.push({
        id: `mtf_${frame.key}_${key}`,
        label: `${frame.name} ${key}`,
        value,
        source:
          "Upstox completed historical candles; STFL trend agreement rules",
      });
  }
  return addLevelResearch(
    {
      ...evidence,
      version: "vedha-evidence-3.0",
      facts,
      limitations: [
        ...evidence.limitations,
        "Multi-timeframe classifications independently compare twenty-, fifty- and two hundred-period EMAs, their five-bar slopes and strict three-bar confirmed swing highs and lows. All components must agree for a bullish or bearish classification; otherwise the result is mixed. This rule is not backtested predictive performance.",
        "Full trend classification requires at least two hundred five completed candles. Individual price-level moving averages use their own period requirements and can be available with less history. Missing or stale evidence is not a neutral trend. Freshness allowances are seven, fourteen, twenty-eight and one hundred calendar days for hourly, daily, weekly and monthly candle starts respectively. Exchange holidays and missing interior bars are not independently verified.",
      ],
    },
    series,
    now,
  );
}
