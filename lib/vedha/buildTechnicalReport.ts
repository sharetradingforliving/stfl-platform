import type { CompanyResearch } from "@/lib/types/research";

export type VedhaSection = { id: string; title: string; paragraphs: string[] };
export type VedhaReport = {
  mode: "calculated";
  context: { symbol: string; exchange: "NSE" | "BSE"; timeframe: string };
  generatedAt: string;
  sections: VedhaSection[];
  limitations: string[];
};
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const price = (v: unknown) => finite(v) && v > 0 ? `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}` : "unavailable";
const number = (v: unknown) => finite(v) ? v.toFixed(2) : "unavailable";
const label = (v: unknown) => typeof v === "string" ? v.replace(/_/g, " ").toLowerCase() : "unavailable";

/** Evidence-only preview. No model call, entitlement decision or success probability. */
export function buildTechnicalReport(
  research: CompanyResearch,
  context: VedhaReport["context"],
): VedhaReport {
  const t = research.technical;
  if (t.symbol.toUpperCase() !== context.symbol.toUpperCase()) throw new Error("Research symbol does not match this chart.");
  const current = t.currentPrice;
  if (!finite(current) || current <= 0) throw new Error("A valid research price is required.");
  const averages = Object.entries(t.movingAverages).filter(([, v]) => finite(v) && v > 0);
  const above = averages.filter(([, v]) => current > v).map(([k]) => k.toUpperCase());
  const below = averages.filter(([, v]) => current < v).map(([k]) => k.toUpperCase());
  const equal = averages.filter(([, v]) => current === v).map(([k]) => k.toUpperCase());
  const rsi = t.oscillators.rsi;
  const rsiValid = finite(rsi) && rsi >= 0 && rsi <= 100;
  const hist = t.oscillators.macdHistogram;
  const rv = t.volumeData.relativeVolume;
  const sr = t.supportResistance;
  const support = [sr.immediateSupport, sr.majorSupport].filter(v => finite(v) && v > 0 && v < current);
  const resistance = [sr.immediateResistance, sr.majorResistance].filter(v => finite(v) && v > current);
  const supports = [...new Set(support)].sort((a,b) => b-a);
  const resistances = [...new Set(resistance)].sort((a,b) => a-b);
  const sections: VedhaSection[] = [
    { id: "price", title: "Price and research context", paragraphs: [
      `${context.exchange}:${context.symbol} · ${context.timeframe}. Research reference price: ${price(current)}. This is the price supplied to the technical engine, not a verified live quote.`,
      `The engine classifies the trend as ${label(t.trend.direction)}. This is a calculated classification, not a prediction.`,
    ]},
    { id: "trend", title: "Moving averages and structure", paragraphs: [
      above.length ? `Price is above ${above.join(", ")}.` : "No valid supplied moving average is below price.",
      below.length ? `Price is below ${below.join(", ")}.` : "No valid supplied moving average is above price.",
      ...(equal.length ? [`Price equals ${equal.join(", ")}.`] : []),
      ...(averages.length ? [averages.map(([k,v]) => `${k.toUpperCase()} ${price(v)}`).join(" · ")] : ["Moving average values are unavailable."]),
      `Structure flags: higher highs ${t.trend.higherHighs ? "detected" : "not detected"}; higher lows ${t.trend.higherLows ? "detected" : "not detected"}; lower highs ${t.trend.lowerHighs ? "detected" : "not detected"}; lower lows ${t.trend.lowerLows ? "detected" : "not detected"}. These flags do not establish moving-average slopes.`,
    ]},
    { id: "momentum", title: "Momentum and volatility", paragraphs: [
      rsiValid ? `RSI is ${number(rsi)}. ${rsi >= 70 ? "It is in the conventional overbought range; this alone does not establish a reversal." : rsi <= 30 ? "It is in the conventional oversold range; this alone does not establish a rebound." : "It is between the conventional 30 and 70 thresholds."} A single value cannot establish RSI direction or divergence.` : "A valid RSI value is unavailable.",
      `MACD ${number(t.oscillators.macd)}; signal ${number(t.oscillators.macdSignal)}; histogram ${number(hist)}. ${finite(hist) ? hist > 0 ? "The histogram is positive." : hist < 0 ? "The histogram is negative." : "The histogram is at zero." : "MACD confirmation is unavailable."} A single snapshot does not establish a crossover.`,
      `ADX ${number(t.oscillators.adx)}; ATR ${number(t.oscillators.atr)}. ADX measures trend strength rather than direction.`,
    ]},
    { id: "volume", title: "Volume participation", paragraphs: [
      finite(rv) && rv >= 0 ? `Relative volume is ${rv.toFixed(2)}× the engine's supplied average. ${rv > 1 ? "Participation exceeds that average." : rv < 1 ? "Participation is below that average." : "Participation equals that average."}` : "Relative volume is unavailable.",
      "The current contract does not identify the averaging period or whether the current volume covers a complete candle. Volume alone cannot identify which investors bought or sold.",
    ]},
    { id: "levels", title: "Support and resistance", paragraphs: [
      supports.length ? `Supplied support levels below price: ${supports.map(price).join(", ")}.` : "No valid support below price is available in this snapshot.",
      resistances.length ? `Supplied resistance levels above price: ${resistances.map(price).join(", ")}.` : "No valid resistance above price is available in this snapshot.",
      "These levels are analytical observations. They are not trade targets, stop-loss instructions or proof that price will hold.",
    ]},
    { id: "conditions", title: "Pullback and reversal conditions", paragraphs: [
      "A pullback interpretation needs a sequence showing that a prior trend remains intact. A reversal interpretation needs evidence of a structural break and subsequent confirmation. This snapshot cannot establish either sequence on its own.",
      supports.length ? `A completed close below ${price(supports[0])} would warrant reassessing the supplied immediate support. Confirm the relevant candle, timeframe and volume before drawing a conclusion.` : "No close-based support condition can be described without a valid supplied support level.",
      resistances.length ? `A completed close above ${price(resistances[0])} would warrant reassessing the supplied immediate resistance. This report has not verified a breakout.` : "No close-based resistance condition can be described without a valid supplied resistance level.",
    ]},
  ];
  return {
    mode: "calculated", context, generatedAt: t.generatedAt, sections,
    limitations: [
      "Calculated research preview: no AI provider is connected in this development increment.",
      "The existing research contract does not include verified candle timestamps, candle closure, source provenance or timeframe. The timeframe label is inherited from the chart; the underlying result must be checked against it.",
      "Supertrend, Fibonacci anchors, pivot references and candlestick patterns are not yet connected to this report. Chart studies can remain visible independently.",
      "Fundamentals, valuation, news, historical analogues, multi-timeframe comparisons and self-learning are not included. No Premium entitlement is inferred by this component.",
      "No engine confidence or breakoutProbability value is presented as a measured chance of success.",
    ],
  };
}
