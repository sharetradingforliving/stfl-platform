import "server-only";

export type Nifty500Constituent = {
  companyName: string;
  industry: string;
  symbol: string;
  series: string;
  isin: string;
};

const NIFTY_500_CSV_URL =
  "https://www.niftyindices.com/IndexConstituent/ind_nifty500list.csv";

const CACHE_DURATION =
  24 * 60 * 60 * 1000;

let cachedConstituents:
  | Nifty500Constituent[]
  | null = null;

let cacheTimestamp = 0;

let downloadPromise:
  | Promise<Nifty500Constituent[]>
  | null = null;

function parseCsvLine(line: string): string[] {
  const values: string[] = [];

  let currentValue = "";
  let insideQuotes = false;

  for (
    let index = 0;
    index < line.length;
    index += 1
  ) {
    const character = line[index];

    if (character === '"') {
      const nextCharacter =
        line[index + 1];

      if (
        insideQuotes &&
        nextCharacter === '"'
      ) {
        currentValue += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    if (
      character === "," &&
      !insideQuotes
    ) {
      values.push(currentValue.trim());
      currentValue = "";
      continue;
    }

    currentValue += character;
  }

  values.push(currentValue.trim());

  return values;
}

function normalizeHeader(
  header: string
): string {
  return header
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function parseNifty500Csv(
  csvText: string
): Nifty500Constituent[] {
  const normalizedText = csvText
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  if (
    normalizedText.startsWith("<!DOCTYPE") ||
    normalizedText.startsWith("<html")
  ) {
    throw new Error(
      "Nifty Indices returned an HTML page instead of the constituent CSV"
    );
  }

  const lines = normalizedText
    .split("\n")
    .filter(
      (line) => line.trim().length > 0
    );

  if (lines.length < 2) {
    throw new Error(
      "The Nifty 500 constituent file is empty"
    );
  }

  const headers = parseCsvLine(
    lines[0]
  ).map(normalizeHeader);

  const companyNameIndex =
    headers.indexOf("companyname");

  const industryIndex =
    headers.indexOf("industry");

  const symbolIndex =
    headers.indexOf("symbol");

  const seriesIndex =
    headers.indexOf("series");

  const isinIndex =
    headers.findIndex(
      (header) =>
        header === "isin" ||
        header === "isincode"
    );

  if (
    companyNameIndex === -1 ||
    symbolIndex === -1 ||
    isinIndex === -1
  ) {
    throw new Error(
      `Unexpected Nifty 500 CSV headers: ${headers.join(
        ", "
      )}`
    );
  }

  const constituents = lines
    .slice(1)
    .map((line) => {
      const values =
        parseCsvLine(line);

      return {
        companyName:
          values[companyNameIndex]?.trim() ??
          "",

        industry:
          industryIndex >= 0
            ? values[industryIndex]?.trim() ??
              ""
            : "",

        symbol:
          values[symbolIndex]
            ?.trim()
            .toUpperCase() ?? "",

        series:
          seriesIndex >= 0
            ? values[seriesIndex]
                ?.trim()
                .toUpperCase() ?? ""
            : "",

        isin:
          values[isinIndex]
            ?.trim()
            .toUpperCase() ?? "",
      };
    })
    .filter(
      (constituent) =>
        constituent.symbol.length > 0 &&
        constituent.isin.length > 0
    );

  return constituents;
}

async function downloadNifty500Constituents(): Promise<
  Nifty500Constituent[]
> {
  const response = await fetch(
    NIFTY_500_CSV_URL,
    {
      headers: {
        Accept:
          "text/csv,application/csv,application/octet-stream,*/*",

        "User-Agent":
          "Mozilla/5.0 STFL-Market-Intelligence/1.0",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Unable to download the Nifty 500 constituent list: ${response.status}`
    );
  }

  const csvText = await response.text();

  const constituents =
    parseNifty500Csv(csvText);

  if (constituents.length < 480) {
    throw new Error(
      `Only ${constituents.length} Nifty 500 constituents were parsed`
    );
  }

  return constituents;
}

export async function getNifty500Constituents(): Promise<
  Nifty500Constituent[]
> {
  const now = Date.now();

  const cacheIsValid =
    cachedConstituents !== null &&
    now - cacheTimestamp <
      CACHE_DURATION;

  if (
    cacheIsValid &&
    cachedConstituents
  ) {
    return cachedConstituents;
  }

  if (!downloadPromise) {
    downloadPromise =
      downloadNifty500Constituents();
  }

  try {
    const constituents =
      await downloadPromise;

    cachedConstituents =
      constituents;

    cacheTimestamp = Date.now();

    return constituents;
  } catch (error) {
    if (cachedConstituents) {
      return cachedConstituents;
    }

    throw error;
  } finally {
    downloadPromise = null;
  }
}