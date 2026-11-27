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
export async function GET(request: NextRequest) {
  try {
    await reviewer(true);
    const sql = database();
    const status =
      request.nextUrl.searchParams.get("status") === "reviewed"
        ? "reviewed"
        : "pending";
    const feedback =
      await sql`SELECT id,category,status,revision,share_for_review,CASE WHEN share_for_review THEN note ELSE NULL END AS note,CASE WHEN share_for_review THEN snapshot ELSE NULL END AS snapshot,created_at FROM vedha_answer_feedback WHERE (${status}='pending' AND status='pending') OR (${status}='reviewed' AND status<>'pending') ORDER BY created_at DESC LIMIT 50`;
    const guidance =
      await sql`SELECT id,scope,guidance,evaluation_notes,active,created_at FROM vedha_review_guidance ORDER BY created_at DESC LIMIT 100`;
    return reply({ feedback, guidance });
  } catch (error) {
    return reviewFailure(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    const admin = await reviewer(true);
    const b = await reviewBody(request);
    const sql = database();
    if (b.action === "retire") {
      if (!validId(b.guidanceId))
        throw new ReviewError(400, "Invalid guidance.");
      const result =
        await sql`WITH retired AS (UPDATE vedha_review_guidance SET active=false,retired_by=${admin},retired_at=now() WHERE id=${b.guidanceId}::uuid AND active=true RETURNING id) INSERT INTO vedha_review_audit(guidance_id,actor_id,action) SELECT id,${admin},'retired' FROM retired RETURNING id`;
      return reply({ saved: result.length > 0 });
    }
    if (
      !validId(b.feedbackId) ||
      !Number.isInteger(b.revision) ||
      !["approve", "reject"].includes(String(b.action))
    )
      throw new ReviewError(400, "Invalid review request.");
    if (b.action === "reject") {
      const result =
        await sql`WITH reviewed AS (UPDATE vedha_answer_feedback SET status='rejected',reviewer_id=${admin},reviewed_at=now(),updated_at=now() WHERE id=${b.feedbackId}::uuid AND status='pending' AND revision=${b.revision as number} RETURNING id) INSERT INTO vedha_review_audit(feedback_id,actor_id,action) SELECT id,${admin},'rejected' FROM reviewed RETURNING id`;
      if (!result[0])
        throw new ReviewError(
          409,
          "Feedback changed. Reload before reviewing.",
        );
      return reply({ saved: true });
    }
    const scope = String(b.scope ?? "");
    const guidance = typeof b.guidance === "string" ? b.guidance.trim() : "";
    const notes =
      typeof b.evaluationNotes === "string" ? b.evaluationNotes.trim() : "";
    if (
      !["levels", "trend", "volume", "general"].includes(scope) ||
      guidance.length < 30 ||
      guidance.length > 1200 ||
      notes.length < 40 ||
      notes.length > 2500 ||
      b.evaluated !== true
    )
      throw new ReviewError(
        400,
        "Provide a general rule, evaluation notes and confirm cross-stock evaluation.",
      );
    // Shared guidance must not embed literal stock prices, dates, personal identifiers or URLs.
    if (
      /[0-9@₹]|https?:\/\/|\[F:|guaranteed|risk.free|buy now|sell now|ignore.*instructions/i.test(
        guidance,
      )
    )
      throw new ReviewError(
        400,
        "Use a general interpretation rule without prices, dates, personal details, links or trading instructions.",
      );
    const id = randomUUID();
    const result = await sql`WITH reviewed AS (
   UPDATE vedha_answer_feedback SET status='approved',reviewer_id=${admin},reviewed_at=now(),updated_at=now()
   WHERE id=${b.feedbackId}::uuid AND status='pending' AND revision=${b.revision as number} AND share_for_review=true RETURNING id
  ), published AS (
   INSERT INTO vedha_review_guidance(id,feedback_id,scope,guidance,evaluation_notes,created_by)
   SELECT ${id}::uuid,id,${scope},${guidance},${notes},${admin} FROM reviewed RETURNING id,feedback_id
  ) INSERT INTO vedha_review_audit(feedback_id,guidance_id,actor_id,action) SELECT feedback_id,id,${admin},'approved' FROM published RETURNING id`;
    if (!result[0])
      throw new ReviewError(
        409,
        "Feedback changed or the user has not shared this answer for review. Reload.",
      );
    return reply({ saved: true });
  } catch (error) {
    return reviewFailure(error);
  }
}
