import "server-only";
import { neon } from "@neondatabase/serverless";
import type { Portfolio } from "./model";
function database() {
  const url =
    process.env.PORTFOLIO_DATABASE_URL || process.env.VEDHA_DATABASE_URL;
  if (!url)
    throw Object.assign(new Error("Portfolio database is not configured."), {
      code: "PORTFOLIO_CONFIG_MISSING",
    });
  return neon(url, { fetchOptions: { signal: AbortSignal.timeout(8000) } });
}
export async function list(owner: string) {
  return (await database()`SELECT id,name FROM stfl_portfolios WHERE owner_id=${owner} ORDER BY created_at,id`) as {
    id: string;
    name: string;
  }[];
}
export async function read(owner: string, id: string) {
  const rows =
    await database()`SELECT id,name,revision,holdings FROM stfl_portfolios WHERE owner_id=${owner} AND id=${id}::uuid`;
  return rows[0] as Portfolio | undefined;
}
export async function save(owner: string, p: Portfolio, remove = false) {
  const rows =
    await database()`SELECT stfl_portfolio_save(${owner},${p.id}::uuid,${p.revision},${p.name},${JSON.stringify(p.holdings)}::jsonb,${remove}) AS result`;
  return rows[0].result as string;
}
