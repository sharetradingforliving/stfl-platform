/**
 * ================================================================
 * STFL IPO Prospectus Provider
 * File: providers/prospectus.ts
 *
 * Purpose:
 *
 * Automatically locate the most relevant SEBI
 * RHP / DRHP / UDRHP / Prospectus filing for an IPO.
 *
 * Search strategy:
 *
 * 1. Search current SEBI Public Issues page.
 * 2. If not found, paginate older Public Issues records
 *    through SEBI's getnewslistinfo.jsp endpoint.
 * 3. Stop as soon as good company candidates are found.
 * 4. Inspect candidate filing pages.
 * 5. Detect actual prospectus type from title/page/PDF.
 * 6. Prefer RHP > Prospectus > UDRHP > DRHP.
 *
 * No company-specific URLs are hard-coded.
 * ================================================================
 */

export type ProspectusType =
  | "RHP"
  | "DRHP"
  | "UDRHP"
  | "Prospectus"
  | "Unknown";


export interface IPOProspectus {
  companyName: string;

  type: ProspectusType;

  title: string;

  filingUrl: string;

  pdfUrl?: string;

  filingDate?: string;

  source: "SEBI";
}


/**
 * ================================================================
 * SEBI ENDPOINTS
 * ================================================================
 */

const SEBI_PUBLIC_ISSUES_URL =
  "https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListing=yes&sid=3&ssid=15";


const SEBI_PAGINATION_URL =
  "https://www.sebi.gov.in/sebiweb/ajax/home/getnewslistinfo.jsp";


/**
 * Maximum number of older SEBI result pages to inspect.
 *
 * 120 pages × 25 records ≈ 3,000 records.
 *
 * This gives substantial historical coverage while preventing
 * an uncontrolled request loop.
 */
const MAX_SEBI_PAGES =
  120;


/**
 * Delay between SEBI pagination requests.
 *
 * Keeps traversal polite and avoids hammering the site.
 */
const PAGE_DELAY_MS =
  250;


/**
 * ================================================================
 * NORMALIZE COMPANY NAME
 * ================================================================
 */

function normalizeCompanyName(
  value: string
): string {

  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(
      /\b(limited|ltd|private|pvt|india|company|co)\b/g,
      ""
    )
    .replace(
      /[^a-z0-9]/g,
      ""
    )
    .trim();
}


/**
 * ================================================================
 * COMPANY TOKENS
 * ================================================================
 */

function companyTokens(
  value: string
): string[] {

  const ignored =
    new Set([
      "limited",
      "ltd",
      "private",
      "pvt",
      "india",
      "company",
      "co",
      "the",
      "and",
    ]);


  return value
    .toLowerCase()

    .replace(
      /&/g,
      " and "
    )

    .replace(
      /[^a-z0-9 ]/g,
      " "
    )

    .split(
      /\s+/
    )

    .map(
      (
        token
      ) =>
        token.trim()
    )

    .filter(
      (
        token
      ) =>
        token.length >= 3 &&
        !ignored.has(
          token
        )
    );
}


/**
 * ================================================================
 * COMPANY MATCH SCORE
 * ================================================================
 */

function companyMatchScore(
  companyName: string,
  candidateTitle: string
): number {

  const target =
    normalizeCompanyName(
      companyName
    );


  const candidate =
    normalizeCompanyName(
      candidateTitle
    );


  if (
    !target ||
    !candidate
  ) {
    return 0;
  }


  /**
   * Exact normalized match.
   */
  if (
    target ===
    candidate
  ) {
    return 100;
  }


  /**
   * Filing title normally contains:
   *
   * Company name + "RHP" / "Prospectus"
   */
  if (
    candidate.includes(
      target
    )
  ) {
    return 95;
  }


  if (
    target.includes(
      candidate
    ) &&
    candidate.length >= 6
  ) {
    return 80;
  }


  /**
   * Token-overlap fallback.
   *
   * Useful for:
   *
   * Tempsens Instruments (India) Limited
   *
   * vs
   *
   * Tempsens Instruments India Limited - DRHP
   */
  const targetTokens =
    companyTokens(
      companyName
    );


  if (
    targetTokens.length ===
    0
  ) {
    return 0;
  }


  const candidateLower =
    candidateTitle
      .toLowerCase();


  const matched =
    targetTokens.filter(
      (
        token
      ) =>
        candidateLower.includes(
          token
        )
    );


  const ratio =
    matched.length /
    targetTokens.length;


  if (
    ratio === 1
  ) {
    return 75;
  }


  if (
    ratio >= 0.75
  ) {
    return 65;
  }


  if (
    ratio >= 0.6
  ) {
    return 45;
  }


  return 0;
}


/**
 * ================================================================
 * DETECT PROSPECTUS TYPE
 * ================================================================
 */

function detectProspectusType(
  value: string
): ProspectusType {

  const text =
    value
      .toLowerCase();


  /**
   * Order matters because UDRHP includes "DRHP".
   */

  if (
    text.includes(
      "udrhp"
    ) ||
    text.includes(
      "updated draft red herring prospectus"
    )
  ) {
    return "UDRHP";
  }


  if (
    text.includes(
      "drhp"
    ) ||
    text.includes(
      "draft red herring prospectus"
    ) ||
    text.includes(
      "draft offer document"
    )
  ) {
    return "DRHP";
  }


  if (
    text.includes(
      "rhp"
    ) ||
    text.includes(
      "red herring prospectus"
    )
  ) {
    return "RHP";
  }


  if (
    text.includes(
      "prospectus"
    )
  ) {
    return "Prospectus";
  }


  return "Unknown";
}


/**
 * ================================================================
 * PRIORITY
 * ================================================================
 */

function prospectusPriority(
  type: ProspectusType
): number {

  switch (
    type
  ) {

    case "RHP":
      return 1;

    case "Prospectus":
      return 2;

    case "UDRHP":
      return 3;

    case "DRHP":
      return 4;

    default:
      return 99;
  }
}


/**
 * ================================================================
 * ABSOLUTE SEBI URL
 * ================================================================
 */

function makeAbsoluteSEBIUrl(
  href: string
): string {

  if (
    href.startsWith(
      "http://"
    ) ||
    href.startsWith(
      "https://"
    )
  ) {
    return href;
  }


  if (
    href.startsWith(
      "/"
    )
  ) {
    return (
      `https://www.sebi.gov.in${href}`
    );
  }


  return (
    `https://www.sebi.gov.in/${href}`
  );
}


/**
 * ================================================================
 * DECODE HTML
 * ================================================================
 */

function decodeHtml(
  value: string
): string {

  return value

    .replace(
      /&amp;/g,
      "&"
    )

    .replace(
      /&quot;/g,
      "\""
    )

    .replace(
      /&#39;|&#x27;/g,
      "'"
    )

    .replace(
      /&nbsp;/g,
      " "
    )

    .replace(
      /&ndash;|&mdash;/g,
      "-"
    )

    .replace(
      /<br\s*\/?>/gi,
      "\n"
    )

    .replace(
      /<[^>]*>/g,
      ""
    )

    .replace(
      /\s+/g,
      " "
    )

    .trim();
}


/**
 * ================================================================
 * DELAY
 * ================================================================
 */

function delay(
  ms: number
): Promise<void> {

  return new Promise(
    (
      resolve
    ) => {

      setTimeout(
        resolve,
        ms
      );
    }
  );
}


/**
 * ================================================================
 * FETCH HTML
 * ================================================================
 */

async function fetchHTML(
  url: string
): Promise<string | null> {

  try {

    const response =
      await fetch(
        url,
        {
          method:
            "GET",

          headers: {

            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",

            Accept:
              "text/html,application/xhtml+xml",

            "Accept-Language":
              "en-US,en;q=0.9",

            Referer:
              "https://www.sebi.gov.in/",
          },

          cache:
            "no-store",
        }
      );


    if (
      !response.ok
    ) {

      console.error(
        "SEBI request failed:",
        response.status,
        response.statusText,
        url
      );


      return null;
    }


    return await response.text();

  } catch (
    error
  ) {

    console.error(
      "Unable to fetch SEBI page:",
      url,
      error
    );


    return null;
  }
}


/**
 * ================================================================
 * FETCH PAGINATED SEBI PUBLIC-ISSUE PAGE
 * ================================================================
 */

async function fetchSEBIPublicIssuePage(
  nextValue: number
): Promise<string | null> {

  try {

    const body =
      new URLSearchParams();


    /**
     * Parameters captured from the SEBI website's
     * getnewslistinfo.jsp XHR request.
     */

    body.set(
      "nextValue",
      String(
        nextValue
      )
    );

    body.set(
      "next",
      "n"
    );

    body.set(
      "search",
      ""
    );

    body.set(
      "fromDate",
      ""
    );

    body.set(
      "toDate",
      ""
    );

    body.set(
      "fromYear",
      ""
    );

    body.set(
      "toYear",
      ""
    );

    body.set(
      "deptId",
      "-1"
    );

    body.set(
      "sid",
      "3"
    );

    body.set(
      "ssid",
      "15"
    );

    body.set(
      "smid",
      "-1"
    );

    body.set(
      "ssidhidden",
      "15"
    );

    body.set(
      "intmid",
      "-1"
    );

    body.set(
      "sText",
      "Filings"
    );

    body.set(
      "ssText",
      "Public Issues"
    );

    body.set(
      "smText",
      "-- All Sub Section List --"
    );


    const response =
      await fetch(
        SEBI_PAGINATION_URL,
        {
          method:
            "POST",

          headers: {

            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",

            Accept:
              "text/html,*/*",

            "Accept-Language":
              "en-US,en;q=0.9",

            "Content-Type":
              "application/x-www-form-urlencoded; charset=UTF-8",

            "X-Requested-With":
              "XMLHttpRequest",

            Referer:
              SEBI_PUBLIC_ISSUES_URL,
          },

          body:
            body.toString(),

          cache:
            "no-store",
        }
      );


    if (
      !response.ok
    ) {

      console.error(
        "SEBI pagination request failed:",
        nextValue,
        response.status,
        response.statusText
      );


      return null;
    }


    return await response.text();

  } catch (
    error
  ) {

    console.error(
      "SEBI pagination request error:",
      nextValue,
      error
    );


    return null;
  }
}


/**
 * ================================================================
 * EXTRACT LINKS
 * ================================================================
 */

function extractLinks(
  html: string
): {
  title: string;
  href: string;
}[] {

  const links:
    {
      title: string;
      href: string;
    }[] = [];


  const regex =
    /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;


  let match:
    RegExpExecArray | null;


  while (
    (
      match =
        regex.exec(
          html
        )
    ) !== null
  ) {

    const href =
      match[1]
        ?.trim();


    const title =
      decodeHtml(
        match[2] ||
        ""
      );


    if (
      href &&
      title
    ) {

      links.push({
        href,
        title,
      });
    }
  }


  return links;
}


/**
 * ================================================================
 * FIND COMPANY CANDIDATES
 * ================================================================
 */

interface ProspectusCandidate {

  title: string;

  filingUrl: string;

  matchScore: number;

  initialType:
    ProspectusType;
}


function findCompanyCandidates(
  html: string,
  companyName: string
): ProspectusCandidate[] {

  const links =
    extractLinks(
      html
    );


  return links

    .map(
      (
        link
      ): ProspectusCandidate => {

        return {

          title:
            link.title,

          filingUrl:
            makeAbsoluteSEBIUrl(
              link.href
            ),

          matchScore:
            companyMatchScore(
              companyName,
              link.title
            ),

          initialType:
            detectProspectusType(
              `${link.title} ${link.href}`
            ),
        };
      }
    )

    .filter(
      (
        candidate
      ) => {

        if (
          candidate.matchScore <=
          0
        ) {
          return false;
        }


        /**
         * Public Issue filing URLs usually contain:
         *
         * /filings/public-issues/
         */
        if (
          candidate.filingUrl.includes(
            "/filings/public-issues/"
          )
        ) {
          return true;
        }


        /**
         * Some listing responses may still expose
         * useful links whose title clearly identifies
         * an offer document.
         */
        return (
          candidate.initialType !==
          "Unknown"
        );
      }
    );
}


/**
 * ================================================================
 * DEDUPLICATE CANDIDATES
 * ================================================================
 */

function deduplicateCandidates(
  candidates:
    ProspectusCandidate[]
): ProspectusCandidate[] {

  const map =
    new Map<
      string,
      ProspectusCandidate
    >();


  for (
    const candidate
    of candidates
  ) {

    const existing =
      map.get(
        candidate.filingUrl
      );


    if (
      !existing ||
      candidate.matchScore >
        existing.matchScore
    ) {

      map.set(
        candidate.filingUrl,
        candidate
      );
    }
  }


  return Array.from(
    map.values()
  );
}


/**
 * ================================================================
 * EXTRACT FILING DATE
 * ================================================================
 */

function extractFilingDate(
  text: string
): string | undefined {

  const patterns = [

    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s+20\d{2}\b/i,

    /\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+20\d{2}\b/i,

  ];


  for (
    const pattern
    of patterns
  ) {

    const match =
      text.match(
        pattern
      );


    if (
      match
    ) {
      return match[0];
    }
  }


  return undefined;
}


/**
 * ================================================================
 * SELECT BEST PDF
 * ================================================================
 */

function selectBestPDF(
  links: {
    title: string;
    href: string;
  }[]
): {
  title: string;
  href: string;
  type: ProspectusType;
} | null {

  const pdfs =
    links

      .filter(
        (
          link
        ) =>
          link.href
            .toLowerCase()
            .includes(
              ".pdf"
            )
      )

      .map(
        (
          link
        ) => {

          const combined =
            `${link.title} ${link.href}`;


          return {

            title:
              link.title,

            href:
              link.href,

            type:
              detectProspectusType(
                combined
              ),
          };
        }
      );


  if (
    pdfs.length ===
    0
  ) {
    return null;
  }


  /**
   * Prefer PDF links whose title/path explicitly
   * identifies a prospectus.
   */

  pdfs.sort(
    (
      a,
      b
    ) =>
      prospectusPriority(
        a.type
      ) -
      prospectusPriority(
        b.type
      )
  );


  return pdfs[0];
}

/**
 * ================================================================
 * FIND EMBEDDED PDF URL
 *
 * Some SEBI filing pages use an embedded PDF.js viewer
 * instead of exposing the PDF through a normal <a> tag.
 *
 * Example:
 *
 * /sebi_data/attachdocs/oct-2025/1759908607630_992.pdf
 * ================================================================
 */

/**
 * ================================================================
 * FIND EMBEDDED PDF URL
 *
 * Handles:
 *
 * 1. Direct absolute PDF URLs
 * 2. Relative /sebi_data/...pdf URLs
 * 3. SEBI PDF viewer links:
 *
 *    /web/?file=https%3A%2F%2F...
 *
 * ================================================================
 */

function findEmbeddedPDFUrl(
  html: string
): string | undefined {

  const normalized =
    html
      .replace(/\\\//g, "/")
      .replace(/&amp;/g, "&");


  /**
   * ------------------------------------------------
   * METHOD 1
   * SEBI viewer URL containing ?file=
   *
   * Example:
   *
   * /web/?file=https%3A%2F%2Fwww.sebi.gov.in%2F...
   * ------------------------------------------------
   */

  const viewerMatch =
    normalized.match(
      /(?:https?:\/\/(?:www\.)?sebi\.gov\.in)?\/web\/\?file=([^"'<> ]+)/i
    );


  if (
    viewerMatch?.[1]
  ) {

    try {

      const decoded =
        decodeURIComponent(
          viewerMatch[1]
        );


      if (
        decoded
          .toLowerCase()
          .includes(".pdf")
      ) {

        return decoded;
      }

    } catch {

      /**
       * Ignore malformed encoded URL
       * and continue to other methods.
       */

    }
  }


  /**
   * ------------------------------------------------
   * METHOD 2
   * Absolute SEBI PDF URL
   * ------------------------------------------------
   */

  const absoluteMatch =
    normalized.match(
      /https?:\/\/(?:www\.)?sebi\.gov\.in\/[^"'<> ]+\.pdf(?:\?[^"'<> ]*)?/i
    );


  if (
    absoluteMatch?.[0]
  ) {

    return absoluteMatch[0];
  }


  /**
   * ------------------------------------------------
   * METHOD 3
   * Relative SEBI attachment PDF
   * ------------------------------------------------
   */

  const relativeMatch =
    normalized.match(
      /\/sebi_data\/[^"'<> ]+\.pdf(?:\?[^"'<> ]*)?/i
    );


  if (
    relativeMatch?.[0]
  ) {

    return makeAbsoluteSEBIUrl(
      relativeMatch[0]
    );
  }


  /**
   * ------------------------------------------------
   * METHOD 4
   * Generic quoted PDF fallback
   * ------------------------------------------------
   */

  const genericMatch =
    normalized.match(
      /["']([^"']+\.pdf(?:\?[^"']*)?)["']/i
    );


  if (
    genericMatch?.[1]
  ) {

    return makeAbsoluteSEBIUrl(
      genericMatch[1]
    );
  }


  return undefined;
}

/**
 * ================================================================
 * INSPECT FILING PAGE
 * ================================================================
 */

async function inspectFilingPage(
  filingUrl: string,
  fallbackTitle: string
): Promise<{
  type: ProspectusType;
  pdfUrl?: string;
  filingDate?: string;
}> {

  const html =
    await fetchHTML(
      filingUrl
    );


  if (
    !html
  ) {

    return {

      type:
        detectProspectusType(
          fallbackTitle
        ),
    };
  }


  const pageText =
    decodeHtml(
      html
    );


  /**
   * ------------------------------------------------
   * Detect offer-document type from:
   *
   * - listing title
   * - filing page content
   *
   * This handles SEBI pages whose title contains only
   * the company name.
   * ------------------------------------------------
   */

  let type =
    detectProspectusType(
      `${fallbackTitle} ${pageText}`
    );


  /**
   * ------------------------------------------------
   * METHOD 1
   * Standard <a href="...pdf"> link
   * ------------------------------------------------
   */

  const links =
    extractLinks(
      html
    );


  const bestPDF =
    selectBestPDF(
      links
    );


  let pdfUrl:
    string | undefined;


  if (
    bestPDF
  ) {

    pdfUrl =
      makeAbsoluteSEBIUrl(
        bestPDF.href
      );


    if (
      bestPDF.type !==
      "Unknown"
    ) {

      type =
        bestPDF.type;
    }
  }


  /**
   * ------------------------------------------------
   * METHOD 2
   * Embedded PDF.js viewer fallback
   *
   * Some SEBI pages do not expose the PDF through
   * a normal hyperlink.
   * ------------------------------------------------
   */

  if (
    !pdfUrl
  ) {

    pdfUrl =
      findEmbeddedPDFUrl(
        html
      );
  }


  /**
   * ------------------------------------------------
   * If PDF URL itself contains document terminology,
   * use it as another type signal.
   * ------------------------------------------------
   */

  if (
    pdfUrl
  ) {

    const pdfType =
      detectProspectusType(
        pdfUrl
      );


    if (
      pdfType !==
      "Unknown"
    ) {

      type =
        pdfType;
    }
  }


  return {

    type,

    pdfUrl,

    filingDate:
      extractFilingDate(
        pageText
      ),
  };
}

/**
 * ================================================================
 * FIND CANDIDATES THROUGH PAGINATION
 * ================================================================
 */

async function searchPaginatedSEBI(
  companyName: string
): Promise<
  ProspectusCandidate[]
> {

  console.log(
    "Starting SEBI historical pagination search:",
    companyName
  );


  for (
    let page = 1;
    page <= MAX_SEBI_PAGES;
    page++
  ) {

    console.log(
      `SEBI historical page ${page}`
    );


    const html =
      await fetchSEBIPublicIssuePage(
        page
      );


    if (
      !html
    ) {

      /**
       * One failed page should not produce an
       * infinite search.
       */

      console.warn(
        "Stopping SEBI pagination because page fetch failed:",
        page
      );


      break;
    }


    const candidates =
      findCompanyCandidates(
        html,
        companyName
      );


    if (
      candidates.length >
      0
    ) {

      console.log(
        "Company candidate found on SEBI historical page:",
        page,
        candidates.map(
          (
            item
          ) =>
            item.title
        )
      );


      return deduplicateCandidates(
        candidates
      );
    }


    /**
     * Empty response usually means no more records.
     */

    const links =
      extractLinks(
        html
      );


    if (
      links.length ===
      0
    ) {

      console.log(
        "No further SEBI records detected. Stopping at page:",
        page
      );


      break;
    }


    await delay(
      PAGE_DELAY_MS
    );
  }


  return [];
}


/**
 * ================================================================
 * FIND IPO PROSPECTUS
 * ================================================================
 */

export async function findIPOProspectus(
  companyName: string
): Promise<
  IPOProspectus | null
> {

  try {

    console.log(
      "========================================"
    );

    console.log(
      "Searching SEBI prospectus:",
      companyName
    );


    /**
     * ------------------------------------------------
     * STEP 1
     * Search the current SEBI Public Issues page.
     *
     * Recent IPOs such as Augmont should usually
     * resolve here without pagination.
     * ------------------------------------------------
     */

    const currentHTML =
      await fetchHTML(
        SEBI_PUBLIC_ISSUES_URL
      );


    let candidates:
      ProspectusCandidate[] =
      [];


    if (
      currentHTML
    ) {

      candidates =
        findCompanyCandidates(
          currentHTML,
          companyName
        );
    }


    /**
     * ------------------------------------------------
     * STEP 2
     * Historical pagination fallback.
     * ------------------------------------------------
     */

    if (
      candidates.length ===
      0
    ) {

      candidates =
        await searchPaginatedSEBI(
          companyName
        );
    }


    candidates =
      deduplicateCandidates(
        candidates
      );


    if (
      candidates.length ===
      0
    ) {

      console.log(
        "No SEBI prospectus candidate found:",
        companyName
      );


      return null;
    }


    /**
     * ------------------------------------------------
     * STEP 3
     * Rank candidate filing links.
     * ------------------------------------------------
     */

    candidates.sort(
      (
        a,
        b
      ) => {

        const companyDifference =
          b.matchScore -
          a.matchScore;


        if (
          companyDifference !==
          0
        ) {
          return companyDifference;
        }


        return (
          prospectusPriority(
            a.initialType
          ) -
          prospectusPriority(
            b.initialType
          )
        );
      }
    );


    /**
     * ------------------------------------------------
     * STEP 4
     * Inspect strongest candidates.
     *
     * Avoid fetching dozens of filing pages.
     * ------------------------------------------------
     */

    const inspected:
      {
        title: string;
        filingUrl: string;
        matchScore: number;
        type: ProspectusType;
        pdfUrl?: string;
        filingDate?: string;
      }[] = [];


    for (
      const candidate
      of candidates.slice(
        0,
        8
      )
    ) {

      const details =
        await inspectFilingPage(
          candidate.filingUrl,
          candidate.title
        );


      inspected.push({

        title:
          candidate.title,

        filingUrl:
          candidate.filingUrl,

        matchScore:
          candidate.matchScore,

        type:
          details.type,

        pdfUrl:
          details.pdfUrl,

        filingDate:
          details.filingDate,
      });
    }


    /**
     * ------------------------------------------------
     * STEP 5
     * Keep usable offer-document candidates.
     * ------------------------------------------------
     */

    const valid =
      inspected.filter(
        (
          candidate
        ) =>
          candidate.type !==
            "Unknown" ||
          candidate.pdfUrl !==
            undefined
      );


    if (
      valid.length ===
      0
    ) {

      console.log(
        "Company filing found but prospectus document could not be identified:",
        companyName
      );


      return null;
    }


    /**
     * ------------------------------------------------
     * STEP 6
     * Final ranking.
     *
     * Strong company match first.
     * Then actual PDF availability.
     * Then prospectus type.
     * ------------------------------------------------
     */

    valid.sort(
      (
        a,
        b
      ) => {

        const companyDifference =
          b.matchScore -
          a.matchScore;


        if (
          companyDifference !==
          0
        ) {
          return companyDifference;
        }


        if (
          Boolean(
            a.pdfUrl
          ) !==
          Boolean(
            b.pdfUrl
          )
        ) {

          return a.pdfUrl
            ? -1
            : 1;
        }


        return (
          prospectusPriority(
            a.type
          ) -
          prospectusPriority(
            b.type
          )
        );
      }
    );


    const best =
      valid[0];


    const prospectus:
      IPOProspectus = {

      companyName,

      type:
        best.type,

      title:
        best.title,

      filingUrl:
        best.filingUrl,

      pdfUrl:
        best.pdfUrl,

      filingDate:
        best.filingDate,

      source:
        "SEBI",
    };


    console.log(
      "SEBI Prospectus Found:",
      prospectus
    );

    console.log(
      "========================================"
    );


    return prospectus;

  } catch (
    error
  ) {

    console.error(
      "Prospectus discovery error:",
      error
    );


    return null;
  }
}