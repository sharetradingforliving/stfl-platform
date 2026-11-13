import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  auditPage,
  getNifty500,
  origin,
  request,
  requireLocalOrigin,
} from "./companyAuditHelpers.mjs";

async function main() {
  requireLocalOrigin();

  const token = process.env.FINANCIAL_HISTORY_SYNC_TOKEN;
  if (!token) {
    throw new Error("FINANCIAL_HISTORY_SYNC_TOKEN is missing.");
  }

  const argument = process.argv[2] || "50";
  const limit = argument === "all" ? Infinity : Number(argument);
  const retry = process.argv.includes("--retry");

  if (limit !== Infinity && (!Number.isInteger(limit) || limit < 1)) {
    throw new Error("Provide a positive batch size or 'all'.");
  }

  const { companies } = await getNifty500();

  const directory = path.join(
    process.cwd(), ".cache", "financial-history"
  );

  // Separate progress from the older all-company script.
  const progressFile = path.join(
    directory, "nifty500-sync-v2.jsonl"
  );

  await mkdir(directory, { recursive: true });

  const latest = new Map();

  try {
    const saved = await readFile(progressFile, "utf8");
    for (const line of saved.split(/\r?\n/)) {
      if (!line.trim()) continue;
      const result = JSON.parse(line);
      latest.set(result.symbol, result);
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  // Retry unresolved results after 24 hours, or explicitly with --retry.
  const retryAfter = 24 * 60 * 60 * 1000;

  const pending = companies.filter((company) => {
    const previous = latest.get(company.symbol);
    if (!previous || previous.isin !== company.isin || retry) return true;

    if (previous.outcome === "page_passed") return false;

    const timestamp = Date.parse(previous.checkedAt);
    return !Number.isFinite(timestamp) ||
      Date.now() - timestamp >= retryAfter;
  });

  const batch = pending.slice(0, limit);
  const counts = { pagePassed: 0, reviewRequired: 0, failed: 0 };

  console.log({
    scope: "NIFTY_500",
    constituents: companies.length,
    pending: pending.length,
    thisBatch: batch.length,
    progressFile,
  });

  for (const [index, company] of batch.entries()) {
    console.log(`[${index + 1}/${batch.length}] ${company.symbol}`);

    let result;
    let stop = false;

    try {
      const response = await request(
        `${origin}/api/internal/financial-history/sync/` +
          encodeURIComponent(company.symbol),
        {
          method: "POST",
          headers: { "X-STFL-Sync-Token": token },
        },
        600000
      );

      if (!response.ok) {
        // Avoid repeated upstream failures or overlapping timed-out tasks.
        throw new Error(`Sync returned HTTP ${response.status}`);
      }

      const body = JSON.parse(response.text);

      if (
        body.symbol !== company.symbol ||
        !["synchronized", "no_records_written"].includes(body.status)
      ) {
        throw new Error("Unexpected synchronization response.");
      }

      const audit = await auditPage(company);

      result = {
        symbol: company.symbol,
        isin: company.isin,
        sync: body.status,
        outcome: audit.passed ? "page_passed" : "review_required",
        audit,
      };

      if (audit.passed) counts.pagePassed++;
      else counts.reviewRequired++;
    } catch (error) {
      result = {
        symbol: company.symbol,
        isin: company.isin,
        outcome: "request_failed",
        error: error.message,
      };
      counts.failed++;
      stop = true;
    }

    result.checkedAt = new Date().toISOString();

    await appendFile(
      progressFile,
      JSON.stringify(result) + "\n",
      "utf8"
    );

    console.log(result);

    if (stop) {
      console.log("Stopped; progress saved. Inspect the error before retrying.");
      process.exitCode = 1;
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log({ ...counts, progressFile });
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});