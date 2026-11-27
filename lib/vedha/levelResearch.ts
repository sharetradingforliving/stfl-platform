import type { Evidence, Fact } from "./contracts";
import { renderFactText } from "./contracts";
import { sma, ema } from "./seriesMath";
import {
  isClosedEquityCandle,
  timestamp,
  type StudyCandle,
} from "@/lib/indicators/chartStudies";
import { validateAnswer, type Answer } from "./chat/contracts";
const FRAMES = [
  { code: "1H", key: "hourly", days: 7 },
  { code: "D", key: "daily", days: 14 },
  { code: "W", key: "weekly", days: 28 },
  { code: "M", key: "monthly", days: 100 },
] as const;
const words: Record<string, string> = {
  "20": "twenty",
  "50": "fifty",
  "100": "hundred",
  "200": "two hundred",
};
const frameName: Record<string, string> = {
  "1H": "hourly",
  D: "daily",
  W: "weekly",
  M: "monthly",
  "4H": "four-hour",
  "1m": "one-minute",
  "5m": "five-minute",
  "15m": "fifteen-minute",
  "30m": "thirty-minute",
};
const candleDate = (ms: number, timeframe: string = "D") => {
  const dailyOrLonger = ["D", "W", "M"].includes(timeframe);
  return (
    new Date(ms).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      ...(dailyOrLonger ? {} : { timeStyle: "short" as const }),
    }) + (dailyOrLonger ? "" : " IST")
  );
};
const money = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
/** Keep independent MA coverage: a hundred-period average needs a hundred
 * completed candles, even if a separate full-trend classification needs more. */
export function addLevelResearch(
  evidence: Evidence,
  series: Map<string, StudyCandle[]>,
  now: number,
): Evidence {
  const facts = [...evidence.facts.filter((f) => !f.id.startsWith("level_"))];
  for (const frame of FRAMES) {
    const unique = new Map<number, StudyCandle>();
    for (const c of series.get(frame.code) ?? []) {
      const ms = timestamp(c.time);
      if (
        Number.isFinite(ms) &&
        ms <= now &&
        [c.open, c.high, c.low, c.close].every(
          (v) => Number.isFinite(v) && v > 0,
        ) &&
        c.low <= Math.min(c.open, c.close) &&
        c.high >= Math.max(c.open, c.close) &&
        c.high >= c.low &&
        isClosedEquityCandle(c.time, frame.code, now)
      )
        unique.set(ms, c);
    }
    const closed = [...unique.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([, c]) => c),
      last = closed.at(-1);
    const prefix = `level_${frame.key}_`,
      source = `Upstox completed ${frame.key} candles; STFL level research`;
    const add = (id: string, label: string, value: string) =>
      facts.push({
        id: prefix + id,
        label: `${frame.key} ${label}`,
        value,
        source,
      });
    add("bars", "completed candles available", String(closed.length));
    if (!last) {
      add(
        "coverage",
        "level coverage",
        "No completed candles supplied; no levels calculated.",
      );
      continue;
    }
    add(
      "asof",
      "last completed candle start",
      candleDate(timestamp(last.time), frame.code),
    );
    add(
      "start",
      "first supplied completed candle start",
      candleDate(timestamp(closed[0].time), frame.code),
    );
    if (now - timestamp(last.time) > frame.days * 86400000) {
      add(
        "coverage",
        "level coverage",
        "Stale candles; no current level values supplied.",
      );
      continue;
    }
    add(
      "coverage",
      "level coverage",
      "Individual averages use their own period requirements; historical swing scan uses all supplied completed candles. Full exchange history and corporate-action adjustment consistency are not independently verified.",
    );
    const values = closed.map((c) => c.close);
    for (const period of [20, 50, 100, 200])
      for (const kind of ["sma", "ema"] as const) {
        const value = (
          kind === "sma" ? sma(values, period) : ema(values, period)
        ).at(-1);
        if (value != null && Number.isFinite(value))
          add(
            `${kind}${period}`,
            `${words[period]}-period ${kind === "sma" ? "simple" : "exponential"} moving average`,
            money(value),
          );
      }
    const highs: { value: number; index: number }[] = [],
      lows: { value: number; index: number }[] = [];
    // A strict local pivot is confirmed only after three subsequent closed bars.
    for (let i = 3; i < closed.length - 3; i++) {
      const window = closed.slice(i - 3, i + 4);
      if (window.every((c, j) => j === 3 || closed[i].high > c.high))
        highs.push({ value: closed[i].high, index: i });
      if (window.every((c, j) => j === 3 || closed[i].low < c.low))
        lows.push({ value: closed[i].low, index: i });
    }
    // Active historical levels must not have been closed through subsequently.
    // This uses only candles supplied up to this analysis; no future bars are fetched.
    const laterHigh = new Array<number>(closed.length + 1).fill(-Infinity);
    const laterLow = new Array<number>(closed.length + 1).fill(Infinity);
    for (let i = closed.length - 1; i >= 0; i--) {
      laterHigh[i] = Math.max(closed[i].close, laterHigh[i + 1]);
      laterLow[i] = Math.min(closed[i].close, laterLow[i + 1]);
    }
    const reference =
      frame.code === evidence.context.timeframe
        ? readPrice(evidence.facts.find((f) => f.id === "close")?.value)
        : last.close;
    if (reference === null) continue;
    for (const [name, points] of [
      ["resistance", highs],
      ["support", lows],
    ] as const) {
      const ranked = points
        .filter((p) =>
          name === "resistance" ? p.value > reference : p.value < reference,
        )
        .filter((p) =>
          name === "resistance"
            ? laterHigh[p.index + 1] <= p.value + Math.max(1, p.value) * 1e-8
            : laterLow[p.index + 1] >= p.value - Math.max(1, p.value) * 1e-8,
        )
        .sort(
          (a, b) =>
            (name === "resistance" ? a.value - b.value : b.value - a.value) ||
            b.index - a.index,
        );
      const seen = new Set<number>();
      let count = 0;
      for (const point of ranked) {
        if (seen.has(point.value)) continue;
        seen.add(point.value);
        count++;
        add(`${name}${count}`, `confirmed swing ${name}`, money(point.value));
        add(
          `${name}${count}_date`,
          `historical swing ${name} candle start`,
          candleDate(timestamp(closed[point.index].time), frame.code),
        );
        if (count === 3) break;
      }
    }
  }
  return {
    ...evidence,
    version: "vedha-evidence-levels-1.1",
    facts,
    limitations: [
      ...evidence.limitations,
      "Active swing resistance excludes highs subsequently exceeded by a completed close; active swing support excludes lows subsequently undercut by a completed close. Broken levels need new swing evidence before being treated as re-established barriers. Candle dates identify historical swing bars, not the later confirmation bar.",
      "Level research keeps selected-timeframe swings, moving averages, traditional pivot reference periods and Fibonacci anchors distinct. A reference on the correct side of the completed close is a candidate, not proof it will hold. Higher-timeframe levels are context, not a replacement timeframe.",
    ],
  };
}
function readPrice(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const n = Number(value.replace(/^[₹\s]+/, "").replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}
type Candidate = {
  id: string;
  value: number;
  method: string;
  context: string[];
};
/** Deterministic source selection; the answer never invents a missing level. */
export function levelResearchAnswer(
  evidence: Evidence,
  question: string,
): { answer: Answer; usage: unknown } | null {
  if (/Clarification: Previous major swing high/i.test(question)) return null;
  if (
    /^\s*what\s+(?:is|are)\s+(?:a\s+)?(?:support|resistance)(?:\s+(?:and|&)\s+(?:support|resistance))?\s*[?.!]*\s*$/i.test(
      question,
    )
  )
    return null;
  if (
    !/\bsupport\b|\bresistance\b|\bnext\s+(?:major\s+)?swing\s*high\b/i.test(
      question,
    )
  )
    return null;
  if (
    !/\b(?:next|nearest|overhead|where|what|which|show|identify|level|support\s+and\s+resistance|support\s*&\s*resistance)\b/i.test(
      question,
    )
  )
    return null;
  // Explanatory/education requests go to the model rather than being reduced to lookup.
  if (
    /\b(?:why|explain|how to|what is (?:a |the concept|meant)|difference|calculate|definition)\b/i.test(
      question,
    )
  )
    return null;
  const hasSupport = /\bsupport\b/i.test(question),
    hasResistance = /\bresistance\b|\bswing\s*high\b/i.test(question);
  const sides =
    hasSupport && hasResistance
      ? ["support", "resistance"]
      : hasSupport
        ? ["support"]
        : ["resistance"];
  // Human display values are derived from the same source timestamps, not market-close times.
  const asOfMs = Date.parse(evidence.candleAsOf);
  evidence = {
    ...evidence,
    facts: evidence.facts.map((f) => {
      if (f.id === "candle_time" && Number.isFinite(asOfMs))
        return {
          ...f,
          label: "Selected candle date",
          value: candleDate(asOfMs, evidence.context.timeframe),
        };
      if (f.id === "pivot_reference") {
        const period =
          /^(daily|weekly|monthly)\s+(\d{4}-\d{2}-\d{2});\s*target\s+(\d{4}-\d{2}-\d{2})$/.exec(
            f.value,
          );
        if (period) {
          const from = Date.parse(period[2] + "T00:00:00Z"),
            to = Date.parse(period[3] + "T00:00:00Z");
          if (Number.isFinite(from) && Number.isFinite(to))
            return {
              ...f,
              label: "Pivot calculation and applicable periods",
              value: `${period[1]} pivot; calculated from period beginning ${candleDate(from)}; applies to period beginning ${candleDate(to)}`,
            };
        }
      }
      return f;
    }),
  };
  const map = new Map(evidence.facts.map((f) => [f.id, f])),
    close = readPrice(map.get("close")?.value),
    frame = frameName[evidence.context.timeframe] ?? "selected",
    key = FRAMES.find((f) => f.code === evidence.context.timeframe)?.key;
  const now = Date.parse(evidence.fetchedAt ?? evidence.generatedAt),
    date = Date.parse(evidence.candleAsOf),
    maxDays =
      FRAMES.find((f) => f.code === evidence.context.timeframe)?.days ?? 7;
  const refs = new Set<string>();
  const ref = (id: string) => {
    refs.add(id);
    return `[F:${id}]`;
  };
  let text: string, summary: string;
  if (
    close === null ||
    !Number.isFinite(now) ||
    !Number.isFinite(date) ||
    now - date > maxDays * 86400000
  ) {
    text = `The selected ${frame} reference close is missing or its candle history is stale. I cannot reliably rank current support or resistance. Refresh the matching candle data before comparing levels.`;
    summary = `Current ${frame} price levels are unavailable until the reference data is refreshed.`;
  } else {
    const referenceClose = close;
    const above = (side: string, n: number) =>
      side === "resistance" ? n > referenceClose : n < referenceClose;
    function candidates(
      ids: string[],
      method: (id: string) => string,
      side: string,
      context: string[] = [],
    ): Candidate[] {
      return ids
        .flatMap((id) => {
          const value = readPrice(map.get(id)?.value);
          return value !== null &&
            above(side, value) &&
            context.every((k) => map.has(k))
            ? [{ id, value, method: method(id), context }]
            : [];
        })
        .sort(
          (a, b) =>
            Math.abs(a.value - referenceClose) -
            Math.abs(b.value - referenceClose),
        );
    }
    function unique(items: Candidate[], limit: number) {
      const seen = new Set<number>();
      return items
        .filter((item) => {
          if (seen.has(item.value)) return false;
          seen.add(item.value);
          return true;
        })
        .slice(0, limit);
    }
    function describe(item: Candidate) {
      for (const id of item.context) refs.add(id);
      return `• ${ref(item.id)} — ${item.method}`;
    }
    // Labels generated here contain no unbound numeric values; values/dates use fact references.
    function maLabel(id: string, name: string) {
      const m = id.match(/(sma|ema)(20|50|100|200)$/)!;
      return `${name} ${words[m[2]]}-period ${m[1] === "sma" ? "simple" : "exponential"} moving average (potential dynamic reference)`;
    }
    const paragraphs = [
        `Selected chart: ${frame}. Reference completed close: ${ref("close")}. Candle date: ${map.has("candle_time") ? ref("candle_time") : "not supplied"}. This is completed-candle research, not a live quote.`,
      ],
      takeaways: string[] = [];
    // Source selection stays explicit: a weekly pivot on a daily chart is labelled as a weekly-period calculation.
    for (const side of sides) {
      const fullIds = key
        ? [1, 2, 3].map((n) => `level_${key}_${side}${n}`)
        : [];
      const swingIds =
        key && map.has(`level_${key}_coverage`)
          ? fullIds
          : [side + "1", side + "2"];
      const swings = unique(
        candidates(swingIds, () => `${frame} confirmed swing ${side}`, side),
        2,
      );
      paragraphs.push(
        swings.length
          ? `${frame[0].toUpperCase() + frame.slice(1)} swing ${side}:\n${swings
              .map((item) => {
                const dateId = item.id + "_date";
                return `• ${ref(item.id)}${map.has(dateId) ? ` — historical swing candle: ${ref(dateId)}` : ""}`;
              })
              .join("\n")}.`
          : `No confirmed ${frame} swing ${side} ${side === "resistance" ? "above" : "below"} the reference close was supplied. Checking other methods:`,
      );
      const selectedMA = [20, 50, 100, 200].flatMap((n) => [
        "sma" + n,
        "ema" + n,
      ]);
      const ma = candidates(selectedMA, (id) => maLabel(id, frame), side);
      const pivotIds = [
        "pivot_P",
        "pivot_R1",
        "pivot_R2",
        "pivot_R3",
        "pivot_S1",
        "pivot_S2",
        "pivot_S3",
      ];
      const pivots = candidates(
        pivotIds,
        (id) =>
          id === "pivot_P"
            ? `${map.get("pivot_reference")?.value.match(/^(daily|weekly|monthly)/)?.[1] ?? "Traditional"} central pivot`
            : (map
                .get("pivot_reference")
                ?.value.match(/^(daily|weekly|monthly)/)?.[1] ??
                "Traditional") +
              " pivot " +
              (id.includes("_R") ? "resistance" : "support") +
              " " +
              ({ 1: "one", 2: "two", 3: "three" }[
                Number(id.at(-1)) as 1 | 2 | 3
              ] ?? ""),
        side,
        ["pivot_reference"],
      );
      const fib = candidates(
        ["fib_382", "fib_500", "fib_618"],
        (id) =>
          "Selected-swing Fibonacci " +
          {
            fib_382: "thirty-eight point two",
            fib_500: "fifty",
            fib_618: "sixty-one point eight",
          }[id as "fib_382"] +
          " percent retracement",
        side,
        ["fib_a", "fib_b"],
      );
      const alternatives = unique(
        [ma[0], pivots[0], fib[0]]
          .filter((item): item is Candidate => Boolean(item))
          .sort(
            (a, b) =>
              Math.abs(a.value - referenceClose) -
              Math.abs(b.value - referenceClose),
          ),
        3,
      );
      if (alternatives.length)
        paragraphs.push(
          `Other ${side} reference methods for the selected chart:\n${alternatives.map(describe).join("\n")}.\nCalculation periods, Fibonacci anchors and higher-timeframe candle dates are available in supporting evidence. Prices above are the level values; dates are not price targets. These are candidate references, not confirmed swing levels or guaranteed barriers.`,
        );
      else if (!swings.length)
        paragraphs.push(
          `No valid selected-chart moving-average, pivot or Fibonacci ${side} value was supplied on the required side of the reference close.`,
        );
      const rank = FRAMES.findIndex(
          (f) => f.code === evidence.context.timeframe,
        ),
        higher =
          rank < 0
            ? FRAMES.filter((f) => f.code === "D" || f.code === "W")
            : FRAMES.slice(rank + 1);
      const htf: Candidate[] = [];
      for (const higherFrame of higher) {
        const prefix = `level_${higherFrame.key}_`,
          context = [prefix + "asof"];
        const all = candidates(
          [20, 50, 100, 200].flatMap((n) => [
            prefix + "sma" + n,
            prefix + "ema" + n,
          ]),
          (id) => maLabel(id, higherFrame.key),
          side,
          context,
        );
        const swingsHigher = candidates(
          [1, 2, 3].map((n) => prefix + side + n),
          () => `${higherFrame.key} confirmed swing ${side}`,
          side,
          context,
        );
        htf.push(
          ...unique(
            [...all, ...swingsHigher].sort(
              (a, b) =>
                Math.abs(a.value - referenceClose) -
                Math.abs(b.value - referenceClose),
            ),
            2,
          ),
        );
      }
      const higherLevels = unique(
        htf.sort(
          (a, b) =>
            Math.abs(a.value - referenceClose) -
            Math.abs(b.value - referenceClose),
        ),
        3,
      );
      if (higherLevels.length)
        paragraphs.push(
          `Higher-timeframe ${side} context (your selected chart remains ${frame}):\n${higherLevels.map(describe).join("\n")}. These averages and historical swings are possible reference levels; their presence alone does not prove rejection or acceptance.`,
        );
      const primary = swings[0] ?? alternatives[0] ?? higherLevels[0];
      takeaways.push(
        primary
          ? `${swings.length ? "Nearest supplied swing" : alternatives.length ? "Nearest selected-chart alternative" : "Higher-timeframe reference"} ${side}: ${primary.method} at ${ref(primary.id)}.`
          : `No verified ${side} price is available from the supplied methods and timeframes.`,
      );
      if (primary && higherLevels[0] && higherLevels[0].id !== primary.id)
        takeaways.push(
          `Higher-timeframe context: ${higherLevels
            .slice(0, 2)
            .map((level) => `${level.method} at ${ref(level.id)}`)
            .join("; ")}.`,
        );
    }
    paragraphs.push(
      "Levels are ranked against the selected completed close and may differ from levels around the current live price. Several nearby references do not automatically establish a validated confluence zone. Finding no overhead swing does not establish an all-time high. Full-history coverage and corporate-action adjustment consistency have not been independently verified.",
    );
    text = paragraphs.join("\n\n");
    summary = takeaways.join(" ");
  }
  const parsed = validateAnswer(
    { answer: text, evidenceIds: [...refs] },
    evidence,
  );
  validateAnswer({ answer: summary, evidenceIds: [...refs] }, evidence);
  return {
    answer: {
      text: renderFactText(parsed.answer, evidence),
      summary: renderFactText(summary, evidence),
      evidence: evidence.facts.filter((f) => refs.has(f.id)),
      candleAsOf: evidence.candleAsOf,
      generatedAt: new Date().toISOString(),
      provider: "STFL",
      model: "multi-method-price-levels-v1.2",
      reviewedGuidanceIds: [],
    },
    usage: {
      kind: "deterministic_multi_method_levels",
      inputTokens: 0,
      outputTokens: 0,
    },
  };
}
