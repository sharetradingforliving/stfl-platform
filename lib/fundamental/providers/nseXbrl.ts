import "server-only";

import { XMLParser } from "fast-xml-parser";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonValue[];

type JsonObject = {
  [key: string]: JsonValue;
};

export type XbrlContext = {
  id: string;
  entityIdentifier: string | null;

  periodType:
    | "DURATION"
    | "INSTANT"
    | "UNKNOWN";

  startDate: string | null;
  endDate: string | null;
  instant: string | null;

  dimensions: Record<
    string,
    string
  >;
};

export type XbrlFact = {
  name: string;
  localName: string;
  taxonomyPrefix: string | null;

  value: string;
  numericValue: number | null;

  contextRef: string;
  unitRef: string | null;
  decimals: string | null;
  scale: string | null;
};

export type XbrlUnit = {
  id: string;
  measure: string | null;
};

export type ParsedNseXbrl = {
  sourceUrl: string;
  fetchedAt: string;

  taxonomyPrefixes: string[];

  contexts: XbrlContext[];
  units: XbrlUnit[];
  facts: XbrlFact[];

  warnings: string[];
};

const ALLOWED_XBRL_HOSTS = new Set([
  "nsearchives.nseindia.com",
  "www.nsearchives.nseindia.com",
  "nseindia.com",
  "www.nseindia.com",
]);

const XML_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 " +
    "(Windows NT 10.0; Win64; x64) " +
    "AppleWebKit/537.36 " +
    "(KHTML, like Gecko) " +
    "Chrome/124.0 Safari/537.36",

  Accept:
    "application/xml,text/xml," +
    "application/xhtml+xml,*/*",

  "Accept-Language":
    "en-IN,en;q=0.9",
};

function isJsonObject(
  value: JsonValue | unknown
): value is JsonObject {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function asArray<T>(
  value: T | T[] | undefined
): T[] {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value)
    ? value
    : [value];
}

function localName(
  qualifiedName: string
): string {
  const separatorIndex =
    qualifiedName.lastIndexOf(":");

  return separatorIndex >= 0
    ? qualifiedName.slice(
        separatorIndex + 1
      )
    : qualifiedName;
}

function taxonomyPrefix(
  qualifiedName: string
): string | null {
  const separatorIndex =
    qualifiedName.indexOf(":");

  return separatorIndex > 0
    ? qualifiedName.slice(
        0,
        separatorIndex
      )
    : null;
}

function readText(
  value: JsonValue | undefined
): string | null {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value).trim();
  }

  if (isJsonObject(value)) {
    return readText(
      value["#text"]
    );
  }

  return null;
}

function readAttribute(
  value: JsonObject,
  attributeName: string
): string | null {
  const attributeValue =
    value[
      `@_${attributeName}`
    ];

  return readText(
    attributeValue
  );
}

function findDirectProperty(
  value: JsonObject,
  targetLocalName: string
): JsonValue | undefined {
  for (
    const [key, childValue]
    of Object.entries(value)
  ) {
    if (
      key.startsWith("@_") ||
      key === "#text"
    ) {
      continue;
    }

    if (
      localName(key) ===
      targetLocalName
    ) {
      return childValue;
    }
  }

  return undefined;
}

function findAllObjectsByLocalName(
  value: JsonValue,
  targetLocalName: string
): JsonObject[] {
  const matches: JsonObject[] =
    [];

  function walk(
    currentValue: JsonValue
  ) {
    if (
      Array.isArray(currentValue)
    ) {
      for (
        const item of currentValue
      ) {
        walk(item);
      }

      return;
    }

    if (
      !isJsonObject(currentValue)
    ) {
      return;
    }

    for (
      const [key, childValue]
      of Object.entries(
        currentValue
      )
    ) {
      if (
        localName(key) ===
        targetLocalName
      ) {
        const values = asArray(
          childValue
        );

        for (
          const matchedValue
          of values
        ) {
          if (
            isJsonObject(
              matchedValue
            )
          ) {
            matches.push(
              matchedValue
            );
          }
        }
      }

      walk(childValue);
    }
  }

  walk(value);

  return matches;
}

function parseNumericValue(
  value: string
): number | null {
  const trimmedValue =
    value.trim();

  if (
    trimmedValue === "" ||
    trimmedValue === "-" ||
    trimmedValue === "—"
  ) {
    return null;
  }

  const isNegative =
    trimmedValue.startsWith("(") &&
    trimmedValue.endsWith(")");

  const cleanedValue =
    trimmedValue
      .replace(/[₹,\s]/g, "")
      .replace(/^\(/, "")
      .replace(/\)$/, "");

  if (
    !/^[+-]?\d*\.?\d+$/.test(
      cleanedValue
    )
  ) {
    return null;
  }

  const parsedValue =
    Number(cleanedValue);

  if (
    !Number.isFinite(parsedValue)
  ) {
    return null;
  }

  return isNegative
    ? -Math.abs(parsedValue)
    : parsedValue;
}

function parseContext(
  context: JsonObject
): XbrlContext | null {
  const id =
    readAttribute(
      context,
      "id"
    );

  if (!id) {
    return null;
  }

  const entity =
    findDirectProperty(
      context,
      "entity"
    );

  let entityIdentifier:
    string | null = null;

  if (isJsonObject(entity)) {
    entityIdentifier =
      readText(
        findDirectProperty(
          entity,
          "identifier"
        )
      );
  }

  const period =
    findDirectProperty(
      context,
      "period"
    );

  let startDate:
    string | null = null;

  let endDate:
    string | null = null;

  let instant:
    string | null = null;

  if (isJsonObject(period)) {
    startDate =
      readText(
        findDirectProperty(
          period,
          "startDate"
        )
      );

    endDate =
      readText(
        findDirectProperty(
          period,
          "endDate"
        )
      );

    instant =
      readText(
        findDirectProperty(
          period,
          "instant"
        )
      );
  }

  const dimensions: Record<
    string,
    string
  > = {};

  const explicitMembers =
    findAllObjectsByLocalName(
      context,
      "explicitMember"
    );

  for (
    const member
    of explicitMembers
  ) {
    const dimension =
      readAttribute(
        member,
        "dimension"
      );

    const memberValue =
      readText(member);

    if (
      dimension &&
      memberValue
    ) {
      dimensions[dimension] =
        memberValue;
    }
  }

  return {
    id,
    entityIdentifier,

    periodType:
      instant
        ? "INSTANT"
        : startDate && endDate
          ? "DURATION"
          : "UNKNOWN",

    startDate,
    endDate,
    instant,
    dimensions,
  };
}

function parseUnit(
  unit: JsonObject
): XbrlUnit | null {
  const id =
    readAttribute(unit, "id");

  if (!id) {
    return null;
  }

  const measure =
    readText(
      findDirectProperty(
        unit,
        "measure"
      )
    );

  return {
    id,
    measure,
  };
}

function collectFacts(
  document: JsonValue
): XbrlFact[] {
  const facts: XbrlFact[] =
    [];

  function walk(
    currentValue: JsonValue
  ) {
    if (
      Array.isArray(currentValue)
    ) {
      for (
        const item of currentValue
      ) {
        walk(item);
      }

      return;
    }

    if (
      !isJsonObject(currentValue)
    ) {
      return;
    }

    for (
      const [key, childValue]
      of Object.entries(
        currentValue
      )
    ) {
      if (
        key.startsWith("@_") ||
        key === "#text"
      ) {
        continue;
      }

      for (
        const item
        of asArray(childValue)
      ) {
        if (isJsonObject(item)) {
          const contextRef =
            readAttribute(
              item,
              "contextRef"
            );

          const value =
            readText(item);

          if (
            contextRef &&
            value !== null
          ) {
            facts.push({
              name: key,

              localName:
                localName(key),

              taxonomyPrefix:
                taxonomyPrefix(key),

              value,

              numericValue:
                parseNumericValue(
                  value
                ),

              contextRef,

              unitRef:
                readAttribute(
                  item,
                  "unitRef"
                ),

              decimals:
                readAttribute(
                  item,
                  "decimals"
                ),

              scale:
                readAttribute(
                  item,
                  "scale"
                ),
            });
          }
        }

        walk(item);
      }
    }
  }

  walk(document);

  return facts;
}

function getTaxonomyPrefixes(
  facts: XbrlFact[]
): string[] {
  const excludedPrefixes =
    new Set([
      "xbrli",
      "xbrldi",
      "link",
      "xlink",
      "iso4217",
    ]);

  const prefixes = new Set<
    string
  >();

  for (const fact of facts) {
    if (
      fact.taxonomyPrefix &&
      !excludedPrefixes.has(
        fact.taxonomyPrefix
      )
    ) {
      prefixes.add(
        fact.taxonomyPrefix
      );
    }
  }

  return Array.from(prefixes)
    .sort();
}

function findFactValue(
  facts: XbrlFact[],
  requestedLocalName: string
): string | null {
  const normalizedRequestedName =
    requestedLocalName
      .replace(
        /[^a-z0-9]/gi,
        ""
      )
      .toLowerCase();

  const matchedFact =
    facts.find(
      (fact) =>
        fact.localName
          .replace(
            /[^a-z0-9]/gi,
            ""
          )
          .toLowerCase() ===
        normalizedRequestedName
    );

  return matchedFact
    ?.value
    .trim() || null;
}

function getQuarterStartDate(
  reportingPeriodEnd:
    string
): string | null {
  const matchedDate =
    reportingPeriodEnd.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (!matchedDate) {
    return null;
  }

  const year =
    Number(matchedDate[1]);

  const monthIndex =
    Number(matchedDate[2]) - 1;

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(
      monthIndex
    )
  ) {
    return null;
  }

  /*
   * A standalone quarter begins on
   * the first day two months before
   * its ending month:
   *
   * June -> April
   * September -> July
   * December -> October
   * March -> January
   */
  const startDate =
    new Date(
      Date.UTC(
        year,
        monthIndex - 2,
        1
      )
    );

  return startDate
    .toISOString()
    .slice(0, 10);
}

function addMissingBankingContexts(
  contexts: XbrlContext[],
  facts: XbrlFact[],
  sourceUrl: string,
  warnings: string[]
) {
  const isBankingDocument =
    sourceUrl
      .toUpperCase()
      .includes(
        "/BANKING_"
      );

  if (!isBankingDocument) {
    return;
  }

  const existingContextIds =
    new Set(
      contexts.map(
        (context) =>
          context.id
      )
    );

  const referencedContextIds =
    new Set(
      facts.map(
        (fact) =>
          fact.contextRef
      )
    );

  const reportingPeriodEnd =
    findFactValue(
      facts,
      "DateOfEndOfReportingPeriod"
    );

  const financialYearStart =
    findFactValue(
      facts,
      "DateOfStartOfFinancialYear"
    );

  const reportingQuarter =
    findFactValue(
      facts,
      "ReportingQuarter"
    );

  const entityIdentifier =
    findFactValue(
      facts,
      "Symbol"
    );

  if (!reportingPeriodEnd) {
    warnings.push(
      "BANKING XBRL referenced missing contexts, but DateOfEndOfReportingPeriod was unavailable."
    );

    return;
  }

  /*
   * Legacy NSE BANKING documents can
   * reference OneD/FourD without defining
   * either context.
   *
   * For a quarterly document:
   * OneD = the reported quarter.
   *
   * For a yearly document:
   * OneD  = the March quarter only.
   * FourD = the complete financial year.
   *
   * Reconstructing OneD as a full-year
   * duration makes the normalizer select
   * quarterly values as annual values.
   */
  const isQuarterlyReport =
    reportingQuarter !== null &&
    /quarter/i.test(
      reportingQuarter
    );

  const isAnnualReport =
    reportingQuarter !== null &&
    /(yearly|annual)/i.test(
      reportingQuarter
    );

  const quarterStartDate =
    getQuarterStartDate(
      reportingPeriodEnd
    );

  const oneDurationStartDate =
    isQuarterlyReport ||
    isAnnualReport
      ? quarterStartDate
      : financialYearStart;

  if (
    referencedContextIds.has(
      "OneD"
    ) &&
    !existingContextIds.has(
      "OneD"
    ) &&
    oneDurationStartDate
  ) {
    contexts.push({
      id:
        "OneD",

      entityIdentifier,

      periodType:
        "DURATION",

      startDate:
        oneDurationStartDate,

      endDate:
        reportingPeriodEnd,

      instant:
        null,

      dimensions: {},
    });

    warnings.push(
      `Reconstructed missing BANKING duration context OneD from verified reporting metadata (${oneDurationStartDate} to ${reportingPeriodEnd}).`
    );
  }

  /*
   * FourD carries complete financial-year
   * flow values in legacy yearly BANKING
   * result documents.
   */
  if (
    isAnnualReport &&
    referencedContextIds.has(
      "FourD"
    ) &&
    !existingContextIds.has(
      "FourD"
    ) &&
    financialYearStart
  ) {
    contexts.push({
      id:
        "FourD",

      entityIdentifier,

      periodType:
        "DURATION",

      startDate:
        financialYearStart,

      endDate:
        reportingPeriodEnd,

      instant:
        null,

      dimensions: {},
    });

    warnings.push(
      `Reconstructed missing BANKING annual duration context FourD from verified reporting metadata (${financialYearStart} to ${reportingPeriodEnd}).`
    );
  }

  /*
   * Balance-sheet facts may similarly
   * reference an omitted instant context.
   */
  if (
    referencedContextIds.has(
      "OneI"
    ) &&
    !existingContextIds.has(
      "OneI"
    )
  ) {
    contexts.push({
      id:
        "OneI",

      entityIdentifier,

      periodType:
        "INSTANT",

      startDate:
        null,

      endDate:
        null,

      instant:
        reportingPeriodEnd,

      dimensions: {},
    });

    warnings.push(
      `Reconstructed missing BANKING instant context OneI from the verified reporting-period end ${reportingPeriodEnd}.`
    );
  }

  /*
   * FourI is the matching annual instant
   * context used by some legacy BANKING
   * facts and segment disclosures.
   */
  if (
    isAnnualReport &&
    referencedContextIds.has(
      "FourI"
    ) &&
    !existingContextIds.has(
      "FourI"
    )
  ) {
    contexts.push({
      id:
        "FourI",

      entityIdentifier,

      periodType:
        "INSTANT",

      startDate:
        null,

      endDate:
        null,

      instant:
        reportingPeriodEnd,

      dimensions: {},
    });

    warnings.push(
      `Reconstructed missing BANKING annual instant context FourI from the verified reporting-period end ${reportingPeriodEnd}.`
    );
  }
}

function validateXbrlUrl(
  sourceUrl: string
): URL {
  let parsedUrl: URL;

  try {
    parsedUrl =
      new URL(sourceUrl);
  } catch {
    throw new Error(
      "The XBRL source URL is invalid"
    );
  }

  if (
    parsedUrl.protocol !==
    "https:"
  ) {
    throw new Error(
      "The XBRL source must use HTTPS"
    );
  }

  if (
    !ALLOWED_XBRL_HOSTS.has(
      parsedUrl.hostname
        .toLowerCase()
    )
  ) {
    throw new Error(
      "The XBRL source host is not allowed"
    );
  }

  return parsedUrl;
}

export function parseNseXbrl(
  xml: string,
  sourceUrl: string
): ParsedNseXbrl {
  const warnings: string[] =
    [];

  const parser =
    new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
      parseTagValue: false,
      parseAttributeValue: false,
      trimValues: true,
      allowBooleanAttributes: true,
      processEntities: true,
    });

  const parsedDocument =
    parser.parse(xml) as JsonValue;

  const contextObjects =
    findAllObjectsByLocalName(
      parsedDocument,
      "context"
    );

  const contexts =
    contextObjects
      .map(parseContext)
      .filter(
        (
          context
        ): context is XbrlContext =>
          context !== null
      );

  const unitObjects =
    findAllObjectsByLocalName(
      parsedDocument,
      "unit"
    );

  const units =
    unitObjects
      .map(parseUnit)
      .filter(
        (
          unit
        ): unit is XbrlUnit =>
          unit !== null
      );

  const facts =
    collectFacts(
      parsedDocument
    );

    addMissingBankingContexts(
  contexts,
  facts,
  sourceUrl,
  warnings
);

  if (contexts.length === 0) {
    warnings.push(
      "No XBRL contexts were detected."
    );
  }

  if (facts.length === 0) {
    warnings.push(
      "No financial facts were detected."
    );
  }

  return {
    sourceUrl,
    fetchedAt:
      new Date().toISOString(),

    taxonomyPrefixes:
      getTaxonomyPrefixes(facts),

    contexts,
    units,
    facts,
    warnings,
  };
}

export async function fetchAndParseNseXbrl(
  sourceUrl: string
): Promise<ParsedNseXbrl> {
  const validatedUrl =
    validateXbrlUrl(
      sourceUrl
    );

  const response =
    await fetch(
      validatedUrl.toString(),
      {
        method: "GET",
        headers: XML_HEADERS,
        cache: "no-store",
      }
    );

  if (!response.ok) {
    throw new Error(
      "Unable to download NSE XBRL: " +
        response.status
    );
  }

  const xml =
    await response.text();

  if (
    !xml.includes("<") ||
    xml.trim().length === 0
  ) {
    throw new Error(
      "The NSE XBRL response is empty"
    );
  }

  return parseNseXbrl(
    xml,
    validatedUrl.toString()
  );
}

export function getFactsForContext(
  document: ParsedNseXbrl,
  contextId: string
): XbrlFact[] {
  return document.facts.filter(
    (fact) =>
      fact.contextRef ===
      contextId
  );
}

export function getFactsByLocalName(
  document: ParsedNseXbrl,
  names: string[]
): XbrlFact[] {
  const normalizedNames =
    new Set(
      names.map((name) =>
        name
          .replace(/[^a-z0-9]/gi, "")
          .toLowerCase()
      )
    );

  return document.facts.filter(
    (fact) =>
      normalizedNames.has(
        fact.localName
          .replace(
            /[^a-z0-9]/gi,
            ""
          )
          .toLowerCase()
      )
  );
}
