import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "node:crypto";
import * as store from "@/lib/portfolio/store";
import { resolveHoldings, prices } from "@/lib/portfolio/market";
import { keyOf, positionInput, type Portfolio } from "@/lib/portfolio/model";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const uuid = (s: unknown): s is string =>
  typeof s === "string" &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
    s,
  );
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  });
function storageFailure(error: unknown, phase: string) {
  const e = error as { code?: unknown; cause?: { code?: unknown } };
  const raw = e?.code ?? e?.cause?.code;
  const sqlCode =
    typeof raw === "string" && /^[A-Z0-9]{5}$/.test(raw) ? raw : undefined;
  const code =
    raw === "PORTFOLIO_CONFIG_MISSING"
      ? "PORTFOLIO_CONFIG_MISSING"
      : sqlCode === "42P01"
        ? "PORTFOLIO_TABLE_MISSING"
        : sqlCode === "42883"
          ? "PORTFOLIO_FUNCTION_MISSING"
          : sqlCode === "42501"
            ? "PORTFOLIO_DATABASE_PERMISSION"
            : sqlCode === "28P01"
              ? "PORTFOLIO_DATABASE_AUTH"
              : "PORTFOLIO_SERVICE_UNAVAILABLE";
  console.error("Portfolio service diagnostic", { phase, code, sqlCode });
  return json(
    {
      error:
        "We could not connect to your saved portfolios. Please try again shortly.",
      code,
    },
    503,
  );
}
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId)
      return json({ error: "Sign in to view your portfolios." }, 401);
    const portfolios = await store.list(userId);
    const id = new URL(request.url).searchParams.get("id") ?? portfolios[0]?.id;
    if (id && !uuid(id)) return json({ error: "Invalid portfolio." }, 400);
    const portfolio = id ? await store.read(userId, id) : null;
    if (id && !portfolio) return json({ error: "Portfolio not found." }, 404);
    const market = await prices(portfolio?.holdings ?? []);
    return json({
      portfolios,
      portfolio,
      ...market,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    return storageFailure(error, "read");
  }
}
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return json({ error: "Sign in to save your portfolio." }, 401);
    // Browser writes must originate on this application; no cross-site mutations.
    const allowedOrigins = process.env.PORTFOLIO_PUBLIC_ORIGIN
      ? [process.env.PORTFOLIO_PUBLIC_ORIGIN]
      : process.env.NODE_ENV === "production"
        ? [
            "https://sharetradingforliving.com",
            "https://www.sharetradingforliving.com",
          ]
        : [new URL(request.url).origin];
    if (!allowedOrigins.includes(request.headers.get("origin") ?? ""))
      return json({ error: "Invalid request origin." }, 403);
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      return json({ error: "JSON required." }, 415);
    // Stream bounded input so a forged Content-Length cannot bypass the size limit.
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "Request body required." }, 400);
    let text = "";
    let size = 0;
    const decoder = new TextDecoder();
    while (true) {
      const r = await reader.read();
      if (r.done) break;
      size += r.value.byteLength;
      if (size > 200000) {
        await reader.cancel();
        return json({ error: "Request is too large." }, 413);
      }
      text += decoder.decode(r.value, { stream: true });
    }
    text += decoder.decode();
    let b: Record<string, unknown>;
    try {
      b = JSON.parse(text);
    } catch {
      return json({ error: "Invalid JSON." }, 400);
    }
    if (!b || typeof b !== "object")
      return json({ error: "Invalid request." }, 400);
    const action = b.action;
    let p: Portfolio;
    if (action === "create") {
      const name = typeof b.name === "string" ? b.name.trim() : "";
      if (!name || name.length > 60)
        return json({ error: "Name must contain 1–60 characters." }, 400);
      p = { id: randomUUID(), name, revision: 0, holdings: [] };
    } else {
      if (!uuid(b.id)) return json({ error: "Invalid portfolio." }, 400);
      const existing = await store.read(userId, b.id);
      if (!existing) return json({ error: "Portfolio not found." }, 404);
      if (b.revision !== existing.revision)
        return json(
          { error: "Portfolio changed in another tab. Refresh before saving." },
          409,
        );
      p = { ...existing, holdings: [...existing.holdings] };
      try {
        if (action === "rename") {
          if (
            typeof b.name !== "string" ||
            !b.name.trim() ||
            b.name.trim().length > 60
          )
            throw new Error("Name must contain 1–60 characters.");
          p.name = b.name.trim();
        } else if (action === "upsert") {
          if (b.mode !== "add" && b.mode !== "set")
            throw new Error("Choose add or edit mode.");
          const input = positionInput(b.holding);
          const [h] = await resolveHoldings([input]);
          const index = p.holdings.findIndex((x) => keyOf(x) === keyOf(h));
          if (index >= 0) {
            if (b.mode === "add") {
              const old = p.holdings[index];
              const quantity = old.quantity + h.quantity;
              h.averagePrice =
                Math.round(
                  ((old.quantity * old.averagePrice +
                    h.quantity * h.averagePrice) /
                    quantity) *
                    10000,
                ) / 10000;
              h.quantity = quantity;
              positionInput(h);
            }
            p.holdings[index] = h;
          } else p.holdings.push(h);
        } else if (action === "remove") {
          if (
            typeof b.key !== "string" ||
            !p.holdings.some((h) => keyOf(h) === b.key)
          )
            throw new Error("Holding not found.");
          p.holdings = p.holdings.filter((h) => keyOf(h) !== b.key);
        } else if (action === "import") {
          if (!Array.isArray(b.rows) || !b.rows.length || b.rows.length > 200)
            throw new Error("Import between 1 and 200 holdings.");
          const inputs = b.rows.map(positionInput);
          const keys = inputs.map(keyOf);
          if (new Set(keys).size !== keys.length)
            throw new Error("CSV contains duplicate holdings.");
          if (keys.some((k) => p.holdings.some((h) => keyOf(h) === k)))
            throw new Error(
              "An imported stock already exists. Edit that holding separately to avoid duplicate quantities.",
            );
          if (p.holdings.length + inputs.length > 200)
            throw new Error("A portfolio can contain up to 200 holdings.");
          p.holdings.push(...(await resolveHoldings(inputs)));
        } else if (action !== "delete") throw new Error("Unsupported action.");
        if (p.holdings.length > 200)
          throw new Error("A portfolio can contain up to 200 holdings.");
      } catch (e) {
        return json(
          { error: e instanceof Error ? e.message : "Invalid holding." },
          400,
        );
      }
    }
    const result = await store.save(userId, p, action === "delete");
    if (result === "limit")
      return json({ error: "You can create up to five portfolios." }, 409);
    if (result !== "saved")
      return json({ error: "Portfolio changed. Refresh before saving." }, 409);
    return json({ id: p.id, saved: true });
  } catch (error) {
    return storageFailure(error, "write");
  }
}
