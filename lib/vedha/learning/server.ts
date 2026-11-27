import "server-only";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
export class ReviewError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function reviewer(admin = false) {
  const { userId } = await auth();
  if (!userId) throw new ReviewError(401, "Please sign in.");
  if (
    admin &&
    !(process.env.VEDHA_ADMIN_USER_IDS ?? "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .includes(userId)
  )
    throw new ReviewError(403, "Admin access is required.");
  if (process.env.VEDHA_LEARNING_ENABLED !== "true")
    throw new ReviewError(
      503,
      "The feedback and review service is not enabled.",
    );
  return userId;
}
export function reply(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      Vary: "Cookie, Authorization",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export function reviewFailure(error: unknown) {
  if (error instanceof ReviewError)
    return reply({ detail: error.message }, error.status);
  console.error("Vedha review diagnostic", { code: "review_unavailable" });
  return reply(
    { detail: "The review service is temporarily unavailable. Please retry." },
    503,
  );
}
export async function reviewBody(
  request: NextRequest,
): Promise<Record<string, unknown>> {
  const origin = request.headers.get("origin");
  const allowed =
    process.env.NODE_ENV === "production"
      ? [
          process.env.VEDHA_CHAT_PUBLIC_ORIGIN ||
            "https://sharetradingforliving.com",
          "https://www.sharetradingforliving.com",
        ]
      : [request.nextUrl.origin];
  if (
    !origin ||
    !allowed.includes(origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new ReviewError(403, "Cross-site requests are not permitted.");
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new ReviewError(415, "JSON is required.");
  const reader = request.body?.getReader();
  if (!reader) throw new ReviewError(400, "Request body is required.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const item = await reader.read();
      if (item.done) break;
      size += item.value.byteLength;
      if (size > 12000) {
        await reader.cancel();
        throw new ReviewError(413, "Request is too large.");
      }
      chunks.push(item.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const value = JSON.parse(new TextDecoder().decode(bytes));
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error();
    return value;
  } catch {
    throw new ReviewError(400, "Invalid JSON.");
  }
}
