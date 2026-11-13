const sources = [
  "https://nsearchives.nseindia.com/content/indices/ind_nifty500list.csv",
  "https://www.niftyindices.com/IndexConstituent/ind_nifty500list.csv",
];

export const siteUrl = "https://sharetradingforliving.com";

export const origin = (
  process.env.SEO_AUDIT_ORIGIN || "http://localhost:3000"
).replace(/\/$/, "");

// Keep synchronization credentials restricted to the local server.
export function requireLocalOrigin() {
  const url = new URL(origin);

  if (
    url.protocol !== "http:" ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("Use a local HTTP origin for synchronization.");
  }
}

export async function request(url, options = {}, timeout = 60000) {
  const response = await fetch(url, {
    ...options,
    redirect: "error",
    signal: AbortSignal.timeout(timeout),
  });

  // Read the body within the timeout, too.
  const text = await response.text();

  return {
    status: response.status,
    ok: response.ok,
    headers: response.headers,
    text,
  };
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const character = text[i];

    if (character === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if (
      (character === "\n" || character === "\r") &&
      !quoted
    ) {
      if (character === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("Unclosed CSV quotation.");
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

export async function getNifty500() {
  const errors = [];

  for (const source of sources) {
    try {
      const response = await request(source);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const rows = parseCsv(response.text.replace(/^\uFEFF/, ""));
      const headers = rows.shift()?.map((value) =>
        value.trim().toLowerCase()
      );

      const symbolIndex = headers?.indexOf("symbol") ?? -1;
      const isinIndex = headers?.indexOf("isin code") ?? -1;
      const nameIndex = headers?.indexOf("company name") ?? -1;

      if ([symbolIndex, isinIndex, nameIndex].some((index) => index < 0)) {
        throw new Error("Required constituent columns are missing.");
      }

      const parsedCompanies = rows.map((row) => ({
  symbol: row[symbolIndex]?.trim().toUpperCase(),
  isin: row[isinIndex]?.trim().toUpperCase(),
  companyName: row[nameIndex]?.trim(),
}));

const companies = parsedCompanies.filter((company) => {
  const placeholder =
    company.symbol === "DUMMYHEG" &&
    company.isin === "DUM545A01024" &&
    /^Dummy\b/i.test(company.companyName || "");

  if (placeholder) {
    console.log("Excluded index placeholder:", company.symbol);
  }

  return !placeholder;
});

      for (const company of companies) {
        if (
          !/^[A-Z0-9&._-]{1,30}$/.test(company.symbol || "") ||
          !/^IN[A-Z0-9]{10}$/.test(company.isin || "") ||
          !company.companyName
        ) {
          throw new Error(
  "Invalid constituent identity: " +
  JSON.stringify({
    symbol: company.symbol,
    isin: company.isin,
    companyName: company.companyName,
    symbolValid: /^[A-Z0-9&._-]{1,30}$/.test(
      company.symbol || ""
    ),
    isinValid: /^IN[A-Z0-9]{10}$/.test(
      company.isin || ""
    ),
    namePresent: Boolean(company.companyName),
  })
);
        }
      }

      if (
        companies.length < 490 ||
        companies.length > 510 ||
        new Set(companies.map((company) => company.symbol)).size !==
          companies.length
      ) {
        throw new Error("Unexpected constituent count or duplicate symbols.");
      }

      return {
        source,
        companies: companies.sort((a, b) =>
          a.symbol.localeCompare(b.symbol)
        ),
      };
    } catch (error) {
      errors.push(`${source}: ${error.message}`);
    }
  }

  throw new Error(`Constituent download failed:\n${errors.join("\n")}`);
}

function decodeEntities(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(parseInt(code, 16))
    )
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCodePoint(Number(code))
    )
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ");
}

function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(
    /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g
  )) {
    result[match[1].toLowerCase()] = decodeEntities(
      match[2] ?? match[3]
    );
  }
  return result;
}

export async function auditPage(company) {
  const response = await request(
    `${origin}/company/${encodeURIComponent(company.symbol)}`
  );

  const reasons = [];

  if (response.status !== 200) {
    return {
      passed: false,
      http: response.status,
      reasons: [`HTTP ${response.status}`],
    };
  }

  const html = response.text;
  const canonical = `${siteUrl}/company/${encodeURIComponent(company.symbol)}`;
  const links = (html.match(/<link\b[^>]*>/gi) || []).map(attributes);
  const canonicals = links.filter((link) =>
    link.rel?.toLowerCase().split(/\s+/).includes("canonical")
  );

  if (canonicals.length !== 1 || canonicals[0].href !== canonical) {
    reasons.push("Canonical URL missing, duplicated or incorrect.");
  }

  const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  const heading = decodeEntities(
    (headings[0]?.[1] || "").replace(/<[^>]+>/g, "")
  ).trim();

  if (
    headings.length !== 1 ||
    !heading ||
    heading.toUpperCase() === company.symbol
  ) {
    reasons.push("Expected one company-name H1.");
  }

  const metaNoindex = (html.match(/<meta\b[^>]*>/gi) || [])
    .map(attributes)
    .some((meta) =>
      ["robots", "googlebot"].includes(meta.name?.toLowerCase()) &&
      /\bnoindex\b/i.test(meta.content || "")
    );

  if (
    metaNoindex ||
    /\bnoindex\b/i.test(response.headers.get("x-robots-tag") || "")
  ) {
    reasons.push("Page is marked noindex.");
  }

  if (!/\bid=["']public-financial-highlights["']/i.test(html)) {
    reasons.push("Public financial highlights missing.");
  }

  return {
    passed: reasons.length === 0,
    http: response.status,
    heading,
    reasons,
  };
}