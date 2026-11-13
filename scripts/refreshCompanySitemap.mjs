import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { auditPage, getNifty500 } from "./companyAuditHelpers.mjs";

const outputDirectory = path.join(process.cwd(), "data", "seo");
const outputFile = path.join(outputDirectory, "company-sitemap.json");

async function main() {
  // A failed source download never changes the catalogue.
  const { source, companies } = await getNifty500();

  let previous = { companies: [], reviewRequired: [] };

  try {
    previous = JSON.parse(await readFile(outputFile, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  if (
    !Array.isArray(previous.companies) ||
    !Array.isArray(previous.reviewRequired)
  ) {
    throw new Error("Invalid saved catalogue.");
  }

  const symbols = new Set(companies.map((company) => company.symbol));

  // Keep existing non-Nifty-500 entries unchanged.
  const selected = new Map(
    previous.companies
      .filter((company) => !symbols.has(company.symbol))
      .map((company) => [company.symbol, company])
  );

  const failures = previous.reviewRequired.filter(
    (company) => !symbols.has(company.symbol)
  );

  let passed = 0;
  let completed = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < companies.length) {
      const company = companies[cursor++];
      let audit;

      try {
        audit = await auditPage(company);
      } catch (error) {
        audit = {
          passed: false,
          reasons: [error.message],
        };
      }

      if (audit.passed) {
        selected.set(company.symbol, {
          symbol: company.symbol,
          isin: company.isin,
        });
        passed++;
      } else {
        failures.push({
          symbol: company.symbol,
          isin: company.isin,
          scope: "NIFTY_500",
          ...audit,
        });
      }

      completed++;
      if (completed % 25 === 0 || completed === companies.length) {
        console.log({
          checked: completed,
          total: companies.length,
          nifty500Passed: passed,
        });
      }
    }
  }

  await Promise.all([worker(), worker()]);

  if (passed === 0) {
    throw new Error("No Nifty 500 pages passed; catalogue unchanged.");
  }

  const generatedAt = new Date().toISOString();

  const payload = {
    generatedAt,
    nifty500Audit: {
      source,
      checkedAt: generatedAt,
      checked: companies.length,
      passed,
      reviewRequired: companies.length - passed,
    },
    companies: [...selected.values()].sort((a, b) =>
      a.symbol.localeCompare(b.symbol)
    ),
    reviewRequired: failures,
  };

  await mkdir(outputDirectory, { recursive: true });

  // Keep the previous catalogue before replacing it.
  await writeFile(
    `${outputFile}.backup`,
    JSON.stringify(previous, null, 2),
    "utf8"
  );

  const temporaryFile = `${outputFile}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(payload, null, 2), "utf8");
  await rename(temporaryFile, outputFile);

  console.log({
    ...payload.nifty500Audit,
    totalSitemapCompanies: selected.size,
    savedTo: outputFile,
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});