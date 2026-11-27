import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { access, configured, VedhaError } from "@/lib/vedha/server/access";
import { parseContext } from "@/lib/vedha/contracts";
import { getEvidence } from "@/lib/vedha/server/data";
import { validId } from "@/lib/vedha/chat/contracts";
import { answerQuestion } from "@/lib/vedha/chat/provider";
import * as store from "@/lib/vedha/chat/store";
import { clarificationFor } from "@/lib/vedha/learning/questions";
import { reviewedGuidance } from "@/lib/vedha/learning/guidance";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      Vary: "Cookie, Authorization",
      "X-Content-Type-Options": "nosniff",
    },
  });
async function membership() {
  const { userId } = await auth();
  if (!userId) throw new VedhaError(401, "sign_in", "Sign in to use Vedha.");
  const admins = (process.env.VEDHA_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  if (admins.includes(userId)) return { owner: userId, role: "ADMIN" };
  const a = await access();
  if (a.tier !== "PREMIUM")
    throw new VedhaError(
      402,
      "premium_required",
      "Premium membership is required for stock conversations.",
    );
  return { owner: a.owner, role: "PREMIUM" };
}
function failure(error: unknown) {
  if (error instanceof VedhaError) {
    return json(
      {
        code:
          error.status === 401
            ? "sign_in"
            : error.status === 402
              ? "premium_required"
              : "unavailable",
        detail:
          error.status === 401
            ? "Sign in to use Ask Vedha."
            : error.status === 402
              ? "Stock conversations are available to Premium members. Your existing chart preview remains available."
              : "Membership or market evidence is temporarily unavailable.",
      },
      error.status,
    );
  }
  const sql = String(
    (error as { code?: unknown; cause?: { code?: unknown } })?.code ??
      (error as { cause?: { code?: unknown } })?.cause?.code ??
      "",
  );
  console.error("Vedha chat diagnostic", {
    code: ["42P01", "42883"].includes(sql) ? "chat_schema" : "chat_unavailable",
    sqlCode: /^[A-Z0-9]{5}$/.test(sql) ? sql : undefined,
  });
  return json(
    {
      code: "unavailable",
      detail:
        "Your conversation could not be completed. Retry the same question to check its saved status.",
    },
    503,
  );
}
export async function GET(request: NextRequest) {
  try {
    const a = await membership();
    const id = request.nextUrl.searchParams.get("id");
    if (id && !validId(id))
      return json({ detail: "Invalid conversation." }, 400);
    const conversations = await store.list(a.owner);
    if (!id) return json({ role: a.role, conversations });
    const result = await store.read(a.owner, id);
    if (!result) return json({ detail: "Conversation not found." }, 404);
    return json({ role: a.role, conversations, ...result });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: NextRequest) {
  let reserved: { owner: string; id: string } | undefined;
  try {
    const a = await membership();
    configured();
    if (process.env.VEDHA_CHAT_ENABLED !== "true")
      return json(
        {
          detail: "Stock conversations are not enabled yet.",
          code: "disabled",
        },
        503,
      );
    const origins = process.env.VEDHA_CHAT_PUBLIC_ORIGIN
      ? [process.env.VEDHA_CHAT_PUBLIC_ORIGIN]
      : process.env.NODE_ENV === "production"
        ? [
            "https://sharetradingforliving.com",
            "https://www.sharetradingforliving.com",
          ]
        : [request.nextUrl.origin];
    if (
      !origins.includes(request.headers.get("origin") ?? "") ||
      request.headers.get("sec-fetch-site") === "cross-site"
    )
      return json({ detail: "Cross-site request rejected." }, 403);
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      return json({ detail: "JSON is required." }, 415);
    const reader = request.body?.getReader();
    if (!reader) return json({ detail: "Question is required." }, 400);
    let size = 0,
      text = "";
    const decoder = new TextDecoder();
    while (true) {
      const r = await reader.read();
      if (r.done) break;
      size += r.value.byteLength;
      if (size > 12000) {
        await reader.cancel();
        return json({ detail: "Request is too large." }, 413);
      }
      text += decoder.decode(r.value, { stream: true });
    }
    text += decoder.decode();
    let b: Record<string, unknown>;
    try {
      b = JSON.parse(text);
    } catch {
      return json({ detail: "Invalid JSON." }, 400);
    }
    if (!b || typeof b !== "object" || !validId(b.conversationId))
      return json({ detail: "Invalid conversation." }, 400);
    if (b.action === "delete") {
      await store.remove(a.owner, b.conversationId);
      const remaining = await store.read(a.owner, b.conversationId);
      return remaining
        ? json(
            {
              detail: "Wait until the current answer finishes before deleting.",
            },
            409,
          )
        : json({ deleted: true });
    }
    if (
      !validId(b.requestId) ||
      typeof b.question !== "string" ||
      !b.question.trim() ||
      b.question.trim().length > 1500
    )
      return json(
        { detail: "Enter a question of up to 1,500 characters." },
        400,
      );
    let context;
    try {
      context = parseContext(b.context);
    } catch {
      return json(
        { detail: "Choose a valid stock, exchange and timeframe." },
        400,
      );
    }
    const originalQuestion = b.question.trim();
    const clarification = clarificationFor(originalQuestion);
    if (
      clarification &&
      !clarification.options.includes(String(b.clarificationChoice ?? ""))
    ) {
      return json({ status: "clarification", clarification });
    }
    if (
      clarification?.intent === "trade" &&
      b.clarificationChoice === "I will provide direction and entry details"
    ) {
      return json({
        status: "clarification",
        clarification: {
          intent: "trade_details",
          prompt:
            "Please enter your direction, entry price and intended holding period in the question box. Do not share account details. I can assess available chart evidence, not personal suitability.",
          options: [],
        },
      });
    }
    const question = clarification
      ? `${originalQuestion}\nClarification: ${String(b.clarificationChoice)}`
      : originalQuestion;
    if (question.length > 1500)
      return json(
        {
          detail:
            "Please shorten the question to leave room for its clarification.",
        },
        400,
      );
    const limit = Number(process.env.VEDHA_CHAT_MONTHLY_LIMIT ?? 100);
    if (!Number.isInteger(limit) || limit < 1 || limit > 10000)
      throw new Error("Chat allowance not configured.");
    const r = await store.reserve(
      a.owner,
      b.conversationId,
      b.requestId,
      context,
      question,
      limit,
    );
    if (r.code === "cached")
      return json({
        conversationId: b.conversationId,
        answer: r.answer,
        cached: true,
      });
    if (r.code !== "reserved") {
      const status =
        r.code === "not_found"
          ? 404
          : r.code === "limit" || r.code === "attempt_limit"
            ? 429
            : 409;
      return json(
        {
          code: r.code,
          detail:
            r.code === "busy"
              ? "An answer is running. Wait, then retry the same question."
              : r.code === "limit"
                ? "Your monthly chat allowance has been reached."
                : r.code === "retry_limit"
                  ? "This question could not be completed. Start a new question."
                  : r.code === "conversation_limit"
                    ? "Your saved-conversation limit has been reached. Delete an old conversation."
                    : r.code === "turn_limit"
                      ? "Start a new conversation to continue."
                      : "The conversation could not be updated.",
        },
        status,
      );
    }
    reserved = { owner: a.owner, id: b.requestId };
    const history = await store.read(a.owner, b.conversationId);
    const evidence = await getEvidence(
      context,
      undefined,
      request.headers.get("cookie") ?? undefined,
    );
    const output = await answerQuestion(
      evidence,
      question,
      history?.turns ?? [],
      await reviewedGuidance(question),
    );
    await store.complete(a.owner, b.requestId, output.answer, output.usage);
    return json({ conversationId: b.conversationId, answer: output.answer });
  } catch (e) {
    if (reserved)
      try {
        await store.fail(reserved.owner, reserved.id);
      } catch {}
    return failure(e);
  }
}
