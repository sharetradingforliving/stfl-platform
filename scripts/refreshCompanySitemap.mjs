import { gunzipSync } from "node:zlib";
import {
  mkdir,
  readFile,
  rename,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

const siteUrl = "https://sharetradingforliving.com";
const localOrigin =
  process.env.SEO_AUDIT_ORIGIN || "http://localhost:3000";

const outputDirectory = path.join(
  process.cwd(),
  "data",
  "seo"
);

const outputFile = path.join(
  outputDirectory,
  "company-sitemap.json"
);

async function fetchWithTimeout(url, milliseconds = 30000) {
  return fetch(url, {
    signal: AbortSignal.timeout(milliseconds),
    redirect: "follow",
  });
}

async function main() {
  let previous = [];

  try {
    const saved = JSON.parse(
      await readFile(outputFile, "utf8")
    );
    previous = Array.isArray(saved.companies)
      ? saved.companies
      : [];
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  // Fail before changing the saved catalogue if
  // the instrument source cannot be downloaded.
  const response = await fetchWithTimeout(
    "https://assets.upstox.com/market-quote/instruments/exchange/complete.json.gz",
    60000
  );

  if (!response.ok) {
    throw new Error(
      `Instrument download returned HTTP ${response.status}`
    );
  }

  const instruments = JSON.parse(
    gunzipSync(
      Buffer.from(await response.arrayBuffer())
    ).toString("utf8")
  );

  if (!Array.isArray(instruments)) {
    throw new Error("Invalid instrument-master response.");
  }

  const candidates = new Map();

  for (const instrument of instruments) {
    const symbol =
      instrument.trading_symbol?.trim().toUpperCase();
    const isin = instrument.isin?.trim().toUpperCase();
    const name = (
      instrument.name ||
      instrument.short_name ||
      ""
    ).trim();

    if (
      instrument.segment?.trim().toUpperCase() !== "NSE_EQ" ||
      instrument.instrument_type?.trim().toUpperCase() !== "EQ" ||
      !symbol ||
      !name ||
      name.toUpperCase() === symbol ||
      !isin ||
      isin.length !== 12 ||
      !isin.startsWith("INE") ||
      isin.slice(7, 9) !== "01" ||
      /\b(NCD|BOND|DEBENTURE|SECURED|UNSECURED)\b|%/i.test(
        `${symbol} ${name}`
      )
    ) {
      continue;
    }

    const existing = candidates.get(symbol);

    if (existing && existing.isin !== isin) {
      existing.ambiguous = true;
    } else if (!existing) {
      candidates.set(symbol, {
        symbol,
        isin,
        ambiguous: false,
      });
    }
  }

  const companies = [...candidates.values()]
    .filter((company) => !company.ambiguous)
    .sort((a, b) => a.symbol.localeCompare(b.symbol));

  if (companies.length < 100) {
    throw new Error(
      "Unexpectedly small company catalogue; saved data was not changed."
    );
  }

  // Confirm that the local server is reachable first.
  const readiness = await fetchWithTimeout(
    `${localOrigin}/company/RELIANCE`
  );

  if (!readiness.ok) {
    throw new Error(
      "Local company page is unavailable. Keep npm run dev running."
    );
  }

  const previousBySymbol = new Map(
    previous.map((company) => [company.symbol, company])
  );

  const selected = new Map();
  const failures = [];
  let cursor = 0;
  let completed = 0;

  async function worker() {
    while (cursor < companies.length) {
      const company = companies[cursor++];
      const { symbol, isin } = company;

      try {
        const page = await fetchWithTimeout(
          `${localOrigin}/company/${encodeURIComponent(symbol)}`
        );

        if (!page.ok) {
          throw new Error(`HTTP ${page.status}`);
        }

        const html = await page.text();
        const canonical =
          `${siteUrl}/company/${encodeURIComponent(symbol)}`;

        const canonicalTag = (
          html.match(/<link\b[^>]*>/gi) || []
        ).find((tag) =>
          /\brel=["']canonical["']/i.test(tag)
        );

        const hasCanonical = canonicalTag?.includes(
          `href="${canonical}"`
        );

        const headings =
          html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) || [];

        const heading = (headings[0] || "")
          .replace(/<[^>]+>/g, "")
          .trim();

        const hasNoindex = (
          html.match(/<meta\b[^>]*>/gi) || []
        ).some(
          (tag) =>
            /\bname=["'](?:robots|googlebot)["']/i.test(tag) &&
            /\bnoindex\b/i.test(tag)
        );

        const eligible =
          hasCanonical &&
          headings.length === 1 &&
          heading.length > 0 &&
          heading.toUpperCase() !== symbol &&
          !hasNoindex &&
          html.includes(
            'id="public-financial-highlights"'
          );

        if (eligible) {
          selected.set(symbol, { symbol, isin });
        } else {
          failures.push({
            symbol,
            reason: "Public-page eligibility checks did not pass.",
          });

          // A temporary identity/backend outage can remove
          // page content. Keep the last validated entry.
          const old = previousBySymbol.get(symbol);
          if (old?.isin === isin) {
            selected.set(symbol, old);
          }
        }
      } catch (error) {
        failures.push({
          symbol,
          reason: error.message,
        });

        const old = previousBySymbol.get(symbol);
        if (old?.isin === isin) {
          selected.set(symbol, old);
        }
      }

      completed++;

      if (completed % 25 === 0) {
        console.log(
          `Checked ${completed}/${companies.length}; ` +
          `selected ${selected.size}`
        );
      }
    }
  }

  // Limit load on Next.js and the financial backend.
  await Promise.all([worker(), worker()]);

  if (selected.size === 0) {
    throw new Error(
      "No eligible pages found; saved catalogue was not changed."
    );
  }

  await mkdir(outputDirectory, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    companies: [...selected.values()].sort(
      (a, b) => a.symbol.localeCompare(b.symbol)
    ),
    reviewRequired: failures,
  };

  const temporaryFile = `${outputFile}.tmp`;

  await writeFile(
    temporaryFile,
    JSON.stringify(payload, null, 2),
    "utf8"
  );

  await rename(temporaryFile, outputFile);

  console.log({
    checked: companies.length,
    sitemapCompanies: selected.size,
    reviewRequired: failures.length,
    savedTo: outputFile,
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});