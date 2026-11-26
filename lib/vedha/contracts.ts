export const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1H", "4H", "D", "W", "M"] as const;
export type Timeframe = typeof TIMEFRAMES[number];
export type Context = { symbol: string; exchange: "NSE" | "BSE"; timeframe: Timeframe };
export type Tier = "FREE" | "PREMIUM";
export const LAYERS = ["Market structure", "Pattern recognition", "Participation and risk", "Indicator intelligence", "Important price zones", "Conditional outlook"] as const;
export type Fact = { id: string; label: string; value: string; source: string };
export type Evidence = { version: string; context: Context; generatedAt: string; candleAsOf: string; fetchedAt: string; facts: Fact[]; observations: string[]; limitations: string[] };
export type Narrative = { headline: string; overview: string; layers: { id: string; explanation: string; evidenceIds: string[] }[]; conclusion: string };
export type Report = { id: string; tier: Tier; evidence: Evidence; narrative: Narrative; provider: string; model: string; generatedAt: string };
export type View = { authenticated: boolean; tier?: Tier; previewUsed?: boolean; status?: string; stage?: string; report?: Report; detail?: string; code?: string; retryAfter?: number };
export function parseContext(input: unknown): Context {
  const b = input as Partial<Context> | null;
  if (!b || typeof b.symbol !== "string" || !/^[A-Za-z0-9&_.-]{1,32}$/.test(b.symbol) || !["NSE", "BSE"].includes(b.exchange ?? "") || !TIMEFRAMES.includes(b.timeframe as Timeframe)) throw new Error("Invalid company, exchange or timeframe.");
  return { symbol: b.symbol.toUpperCase(), exchange: b.exchange!, timeframe: b.timeframe! };
}
export function renderFactText(text: string, evidence: Evidence): string {
  const facts = new Map(evidence.facts.map(f => [f.id, f.value]));
  return text.replace(/\[F:([a-zA-Z0-9_]+)\]/g, (_, id) => facts.get(id) ?? "unavailable");
}
