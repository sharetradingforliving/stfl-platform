import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { database } from "@/lib/vedha/server/store";
import { validId } from "@/lib/vedha/chat/contracts";
import {
  reviewer,
  reply,
  reviewBody,
  reviewFailure,
  ReviewError,
} from "@/lib/vedha/learning/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const categories = [
  "helpful",
  "wrong_level",
  "wrong_timeframe",
  "outdated_data",
  "other",
];
export async function POST(request: NextRequest) {
  try {
    const owner = await reviewer();
    const b = await reviewBody(request);
    if (
      !validId(b.turnId) ||
      typeof b.category !== "string" ||
      !categories.includes(b.category) ||
      typeof b.note !== "string" ||
      b.note.length > 1500 ||
      typeof b.shareForReview !== "boolean"
    )
      throw new ReviewError(400, "Check the feedback category and note.");
    const sql = database();
    // Snapshot only the caller's completed turn. Sharing is explicit; never accept a browser-supplied answer.
    const rows =
      await sql`INSERT INTO vedha_answer_feedback(id,owner_id,turn_id,category,note,share_for_review,snapshot)
   SELECT ${randomUUID()}::uuid,t.owner_id,t.id,${b.category},${b.note.trim()},${b.shareForReview},
    CASE WHEN ${b.shareForReview} THEN jsonb_build_object('question',t.question,'answer',t.answer,'context',c.context) ELSE NULL END
   FROM vedha_chat_turns t JOIN vedha_chat_conversations c ON c.id=t.conversation_id AND c.owner_id=t.owner_id
   WHERE t.id=${b.turnId}::uuid AND t.owner_id=${owner} AND t.status='completed'
   ON CONFLICT(owner_id,turn_id) DO UPDATE SET category=excluded.category,note=excluded.note,share_for_review=excluded.share_for_review,snapshot=excluded.snapshot,status='pending',reviewer_id=NULL,reviewed_at=NULL,revision=vedha_answer_feedback.revision+1,updated_at=now()
   WHERE vedha_answer_feedback.status='pending'
   RETURNING id`;
    if (!rows[0])
      throw new ReviewError(
        409,
        "This answer is unavailable or its feedback has already been reviewed.",
      );
    return reply({ saved: true });
  } catch (error) {
    return reviewFailure(error);
  }
}
