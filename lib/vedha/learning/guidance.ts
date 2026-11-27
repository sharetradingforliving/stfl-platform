import "server-only";
import { database } from "@/lib/vedha/server/store";
import { learningScope } from "./questions";
export async function reviewedGuidance(
  question: string,
): Promise<{ id: string; text: string }[]> {
  if (process.env.VEDHA_LEARNING_ENABLED !== "true") return [];
  try {
    const scope = learningScope(question);
    const rows =
      await database()`SELECT id,guidance FROM vedha_review_guidance WHERE active=true AND (scope=${scope} OR scope='general') ORDER BY created_at DESC LIMIT 6`;
    return rows.map((row) => ({
      id: String(row.id),
      text: String(row.guidance),
    }));
  } catch {
    console.warn("Vedha reviewed guidance unavailable; using baseline rules.");
    return [];
  }
}
