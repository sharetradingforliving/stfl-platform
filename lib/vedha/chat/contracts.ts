import type { Context, Evidence, Fact } from "../contracts";
export type Answer = {
  text: string;
  summary?: string;
  reviewedGuidanceIds?: string[];
  evidence: Fact[];
  candleAsOf: string;
  generatedAt: string;
  provider: string;
  model: string;
};
export type Turn = {
  id: string;
  question: string;
  answer: Answer;
  created_at: string;
};
export type Conversation = {
  id: string;
  context: Context;
  title: string;
  updated_at: string;
};
export const validId = (id: unknown): id is string =>
  typeof id === "string" &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
    id,
  );
export function validateAnswer(
  value: unknown,
  evidence: Evidence,
): { answer: string; evidenceIds: string[] } {
  const b = value as { answer?: unknown; evidenceIds?: unknown };
  if (
    !b ||
    typeof b.answer !== "string" ||
    b.answer.length < 20 ||
    b.answer.length > 6500 ||
    !Array.isArray(b.evidenceIds) ||
    b.evidenceIds.length > 30 ||
    !b.evidenceIds.every((x) => typeof x === "string")
  )
    throw new Error("Invalid chat answer.");
  // The answer text is authoritative for citations; the model list is redundant.
  const facts = new Map(evidence.facts.map((f) => [f.id, f]));
  const used = [...b.answer.matchAll(/\[F:([a-zA-Z0-9_]+)\]/g)].map(
    (m) => m[1],
  );
  if (used.some((id) => !facts.has(id)))
    throw new Error("Unsupported answer evidence.");
  const plain = b.answer.replace(/\[F:[a-zA-Z0-9_]+\]/g, "");
  if (/[0-9]|\[|\]|https?:\/\/|<[^>]*>/.test(plain))
    throw new Error("Unverified numeric claim or markup.");
  if (
    /guaranteed (profit|return)|risk[- ]free (trade|return)|sure[- ]shot|you should (buy|sell)|buy now|sell now/i.test(
      plain,
    )
  )
    throw new Error("Unsupported recommendation.");
  return { answer: b.answer, evidenceIds: [...new Set(used)] };
}
