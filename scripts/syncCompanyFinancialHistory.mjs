import {
  appendFile,
  mkdir,
  readFile,
} from "node:fs/promises";

import path from "node:path";

const token =
  process.env.FINANCIAL_HISTORY_SYNC_TOKEN;

if (!token) {
  throw new Error(
    "FINANCIAL_HISTORY_SYNC_TOKEN is missing."
  );
}

const origin = "http://localhost:3000";

const limitArgument = process.argv[2] ?? "50";

const limit =
  limitArgument === "all"
    ? Infinity
    : Number(limitArgument);

if (
  limit !== Infinity &&
  (!Number.isInteger(limit) || limit < 1)
) {
  throw new Error(
    "Provide a positive batch size or 'all'."
  );
}

const catalogue = JSON.parse(
  await readFile(
    "./data/seo/company-sitemap.json",
    "utf8"
  )
);

if (
  !Array.isArray(catalogue.companies) ||
  !Array.isArray(catalogue.reviewRequired)
) {
  throw new Error("Invalid sitemap catalogue.");
}

const progressDirectory = path.join(
  process.cwd(),
  ".cache",
  "financial-history"
);

const progressFile = path.join(
  progressDirectory,
  "sync-progress.jsonl"
);

await mkdir(progressDirectory, {
  recursive: true,
});

const latestResults = new Map();

try {
  const previous = await readFile(
    progressFile,
    "utf8"
  );

  for (const line of previous.split(/\r?\n/)) {
    if (!line.trim()) continue;

    const result = JSON.parse(line);

    latestResults.set(result.symbol, result);
  }
} catch (error) {
  if (error.code !== "ENOENT") {
    throw error;
  }
}

const selected = new Set(
  catalogue.companies.map(
    (company) => company.symbol
  )
);

const candidates = [...new Set(
  catalogue.reviewRequired
    .map((item) => item.symbol)
    .filter(
      (symbol) =>
        typeof symbol === "string" &&
        /^[A-Z0-9&._-]{1,30}$/.test(symbol)
    )
)].sort();

const pending = candidates.filter((symbol) => {
  if (selected.has(symbol)) {
    return false;
  }

  const previous = latestResults.get(symbol);

  return ![
    "verified",
    "no_records_written",
  ].includes(previous?.outcome);
});

const batch = pending.slice(0, limit);

console.log({
  pending: pending.length,
  thisBatch: batch.length,
  progressFile,
});

async function saveResult(result) {
  await appendFile(
    progressFile,
    JSON.stringify({
      ...result,
      checkedAt: new Date().toISOString(),
    }) + "\n",
    "utf8"
  );
}

let verified = 0;
let noRecords = 0;
let failed = 0;

for (const [index, symbol] of batch.entries()) {
  console.log(
    `[${index + 1}/${batch.length}] ${symbol}`
  );

  let result;
  let stop = false;

  try {
    const response = await fetch(
      `${origin}/api/internal/financial-history/sync/` +
        encodeURIComponent(symbol),
      {
        method: "POST",
        redirect: "error",
        headers: {
          "X-STFL-Sync-Token": token,
        },
        signal: AbortSignal.timeout(600_000),
      }
    );

    if ([401, 403, 503].includes(response.status)) {
      stop = true;

      throw new Error(
        `Authorization/configuration failure: HTTP ${response.status}`
      );
    }

    if (!response.ok) {
      throw new Error(
        `Synchronization returned HTTP ${response.status}`
      );
    }

    const body = await response.json();

    if (![
      "synchronized",
      "no_records_written",
    ].includes(body.status)) {
      throw new Error(
        "Unexpected synchronization response."
      );
    }

    const page = await fetch(
      `${origin}/company/` +
        encodeURIComponent(symbol),
      {
        redirect: "error",
        signal: AbortSignal.timeout(60_000),
      }
    );

    if (!page.ok) {
      throw new Error(
        `Company page returned HTTP ${page.status}`
      );
    }

    const highlights = (
      await page.text()
    ).includes('id="public-financial-highlights"');

    const outcome = highlights
      ? "verified"
      : body.status === "no_records_written"
        ? "no_records_written"
        : "highlights_missing";

    result = {
      symbol,
      sync: body.status,
      highlights,
      outcome,
    };
  } catch (error) {
    result = {
      symbol,
      outcome: "request_failed",
      error: error.message,
    };

    // Stop on connection failures or timeouts.
    // A timed-out server task might still be running.
    stop = true;
  }

  await saveResult(result);

  console.log(result);

  if (result.outcome === "verified") {
    verified += 1;
  } else if (
    result.outcome === "no_records_written"
  ) {
    noRecords += 1;
  } else {
    failed += 1;
  }

  if (stop) {
    console.log(
      "Stopped. Progress saved; inspect the error before resuming."
    );
    break;
  }

  await new Promise((resolve) =>
    setTimeout(resolve, 1000)
  );
}

console.log({
  verified,
  noRecords,
  failed,
  progressFile,
});