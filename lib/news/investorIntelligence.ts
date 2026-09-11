import type {
  ArticleImpact,
  ArticleIntelligence,
  Impact,
  ImpactDirection,
  ImpactHorizon,
  ImpactScope,
  MarketBriefing,
  NewsArticle,
  NewsCluster,
  NewsEventType,
  SectorImpact,
  Sentiment,
  SentimentResult,
} from "./types";

type EventRule = {
  type: NewsEventType;
  phrases: string[];
  weight: number;
};

type DraftIntelligence = {
  article: NewsArticle;
  eventTypes: NewsEventType[];
  primaryEvent: NewsEventType;
  sentiment: SentimentResult;
  affectedCompanies: string[];
  affectedSectors: string[];
  affectedIndices: string[];
  sourceReliability: number;
  freshnessScore: number;
};

const EVENT_RULES: EventRule[] = [
      {
    type: "Index Inclusion",

    phrases: [
      "index inclusion",
      "included in the index",
      "included in index",
      "added to the index",
      "added to index",
      "to be included",
      "index addition",
      "msci inclusion",
      "ftse inclusion",
      "nifty inclusion",
      "sensex inclusion",
    ],

    weight: 10,
  },

  {
    type: "Index Exclusion",

    phrases: [
      "index exclusion",
      "excluded from the index",
      "excluded from index",
      "removed from the index",
      "removed from index",
      "to be excluded",
      "index deletion",
      "msci exclusion",
      "ftse exclusion",
      "nifty exclusion",
      "sensex exclusion",
    ],

    weight: 10,
  },

  {
    type: "Index Rebalance",

    phrases: [
      "index rebalance",
      "index rebalancing",
      "index reshuffle",
      "index changes",
      "weight increase",
      "weight reduction",
      "weight decrease",
      "rebalancing changes",
    ],

    weight: 9,
  },

  {
    type: "Brokerage Call",

    phrases: [
      "initiates coverage",
      "initiated coverage",
      "maintains buy",
      "maintains hold",
      "maintains sell",
      "reiterates buy",
      "reiterates hold",
      "reiterates sell",
      "target price",
      "price target",
      "overweight rating",
      "underweight rating",
      "equal-weight rating",
    ],

    weight: 8,
  },
  {
    type: "Rating Downgrade",
    phrases: [
      "rating downgrade",
      "downgraded",
      "cuts rating",
      "sell rating",
      "underperform rating",
    ],
    weight: 10,
  },
  {
    type: "Rating Upgrade",
    phrases: [
      "rating upgrade",
      "upgraded",
      "raises rating",
      "buy rating",
      "outperform rating",
    ],
    weight: 10,
  },
  {
    type: "Order Win",
    phrases: [
      "wins order",
      "bags order",
      "secures order",
      "awarded contract",
      "order worth",
      "contract worth",
      "letter of award",
    ],
    weight: 9,
  },
  {
    type: "Results",
    phrases: [
      "quarterly results",
      "financial results",
      "net profit",
      "net loss",
      "revenue rises",
      "revenue falls",
      "earnings beat",
      "earnings miss",
    ],
    weight: 9,
  },
  {
    type: "Dividend",
    phrases: [
      "interim dividend",
      "final dividend",
      "special dividend",
      "dividend declared",
      "declares dividend",
    ],
    weight: 9,
  },
  {
    type: "Buyback",
    phrases: [
      "share buyback",
      "buyback offer",
      "buyback approved",
      "buyback announced",
    ],
    weight: 9,
  },
  {
    type: "Bonus",
    phrases: ["bonus shares", "bonus issue", "bonus ratio"],
    weight: 9,
  },
  {
    type: "Split",
    phrases: [
      "stock split",
      "share split",
      "sub-division of shares",
      "face value split",
    ],
    weight: 9,
  },
  {
    type: "Acquisition",
    phrases: [
      "to acquire",
      "acquires stake",
      "acquisition of",
      "takeover offer",
    ],
    weight: 8,
  },
  {
    type: "Merger",
    phrases: [
      "merger approved",
      "merger plan",
      "scheme of amalgamation",
      "to merge with",
    ],
    weight: 8,
  },
  {
    type: "Bulk Deal",
    phrases: ["bulk deal"],
    weight: 9,
  },
  {
    type: "Block Deal",
    phrases: ["block deal"],
    weight: 9,
  },
  {
    type: "FII Activity",
    phrases: [
      "fii selling",
      "fii buying",
      "foreign institutional investors",
      "foreign portfolio investors",
    ],
    weight: 8,
  },
  {
    type: "DII Activity",
    phrases: [
      "dii buying",
      "dii selling",
      "domestic institutional investors",
    ],
    weight: 8,
  },
  {
    type: "Regulatory",
    phrases: [
      "sebi order",
      "rbi action",
      "regulatory action",
      "show cause notice",
      "regulatory penalty",
      "competition commission",
    ],
    weight: 8,
  },
  {
    type: "Litigation",
    phrases: [
      "court order",
      "lawsuit",
      "litigation",
      "legal proceedings",
      "arbitration claim",
    ],
    weight: 8,
  },
  {
    type: "Promoter",
    phrases: [
      "promoter stake",
      "promoter pledge",
      "promoter selling",
      "promoter buying",
    ],
    weight: 8,
  },
  {
    type: "Management",
    phrases: [
      "appoints ceo",
      "ceo resigns",
      "cfo resigns",
      "managing director resigns",
      "management change",
    ],
    weight: 8,
  },
  {
    type: "Guidance",
    phrases: [
      "raises guidance",
      "cuts guidance",
      "revenue guidance",
      "margin guidance",
      "management outlook",
    ],
    weight: 7,
  },
  {
    type: "Product Launch",
    phrases: [
      "launches new",
      "product launch",
      "unveils new",
      "introduces new",
    ],
    weight: 6,
  },
  {
    type: "Macro",
    phrases: [
      "rbi policy",
      "repo rate",
      "inflation rate",
      "gdp growth",
      "federal reserve",
      "interest rate decision",
      "crude oil",
      "rupee against dollar",
    ],
    weight: 7,
  },
  {
  type: "Market Movement",

  phrases: [
    "nifty rises",
    "nifty falls",
    "nifty falling",
    "nifty rising",

    "sensex rises",
    "sensex falls",
    "sensex falling",
    "sensex rising",

    "market rally",
    "market selloff",
    "stocks slide",

    "extended losses",
    "extends losses",
    "extended their decline",
    "extends its decline",

    "session lows",
    "market declines",
    "market declining",
    "market gains",

    "index falls",
    "index rises",
    "ending below",
    "closes below",

    "negative start",
    "positive start",
    "negative open",
    "positive open",

    "gap-down open",
    "gap down open",
    "gap-up open",
    "gap up open",

    "muted start",
    "flat start",
    "signals flat",
    "signals negative",
    "signals positive",

    "asian markets decline",
    "asian shares decline",
    "asian markets rise",
    "asian shares trade higher",
  ],

  weight: 6,
},
];

const POSITIVE_PHRASES: Record<string, number> = {
  "profit rises": 3,
  "profit jumps": 3,
  "record profit": 3,
  "earnings beat": 3,
  "revenue rises": 2,
  "margin expands": 2,
  "wins order": 2,
  "bags order": 2,
  "secures order": 2,
  "rating upgrade": 2,
  "debt reduced": 2,
  "buyback approved": 2,
  "raises guidance": 3,
  "inflation falls": 2,
  "crude falls": 2,
  "rupee strengthens": 2,
  "nifty rises": 2,
  "sensex rises": 2,
  "shares surge": 2,
  "shares jump": 2,
  "stock surges": 2,
  "stock jumps": 2,
  "extends gains": 2,
  "hits record high": 2,
  "upper circuit": 2,
    "positive start": 2,
  "positive open": 2,
  "gap-up open": 2,
  "gap up open": 2,
  "signals positive": 2,
  "asian markets rise": 2,
  "asian shares trade higher": 2,
    "index inclusion": 3,

  "included in the index": 3,

  "included in index": 3,

  "added to the index": 3,

  "added to index": 3,

  "msci inclusion": 3,

  "ftse inclusion": 3,

  "target price raised": 2,

  "raises target price": 2,

  "price target raised": 2,

  "maintains buy": 2,

  "reiterates buy": 2,

  "overweight rating": 2,
};

const NEGATIVE_PHRASES: Record<string, number> = {
  "profit falls": 3,
  "profit declines": 3,
  "net loss": 3,
  "earnings miss": 3,
  "revenue falls": 2,
  "margin contracts": 2,
  "rating downgrade": 2,
  "regulatory penalty": 2,
  "fraud investigation": 3,
  "cuts guidance": 3,
  "promoter pledge": 2,
  "default on": 3,
  "crude rises": 2,
  "inflation rises": 2,
  "rupee weakens": 2,
  "nifty falls": 2,
  "sensex falls": 2,
  "market selloff": 3,
  "extended losses": 3,
  "extends losses": 3,
  "under pressure": 2,
  "session lows": 2,
  "shares decline": 2,
  "shares fall": 2,
  "stock declines": 2,
  "stock falls": 2,
  "lower circuit": 2,
  "extended their decline": 3,
  "extends its decline": 3,
  "trading weak": 2,
  "stay weak": 2,
  "ending below": 2,
  "closes below": 2,
    "negative start": 2,
  "negative open": 2,
  "gap-down open": 2,
  "gap down open": 2,
  "signals negative": 2,
  "asian markets decline": 2,
  "asian shares decline": 2,
  "asian selloff": 3,
  "selloff weighs": 2,
  "yields spike": 2,
    "index exclusion": 3,

  "excluded from the index": 3,

  "excluded from index": 3,

  "removed from the index": 3,

  "removed from index": 3,

  "msci exclusion": 3,

  "ftse exclusion": 3,

  "target price cut": 2,

  "cuts target price": 2,

  "price target cut": 2,

  "maintains sell": 2,

  "reiterates sell": 2,

  "underweight rating": 2,
};

const SECTOR_KEYWORDS: Record<string, string[]> = {
  Banking: [
    "bank",
    "banking",
    "lender",
    "loan",
    "deposit",
    "nbfc",
  ],
  "Information Technology": [
    "information technology",
    "software",
    "it services",
    "technology services",
  ],
  Automobile: [
    "automobile",
    "auto sales",
    "vehicle",
    "car sales",
    "two-wheeler",
    "ev sales",
  ],
  Metals: [
    "steel",
    "aluminium",
    "copper",
    "metal",
    "mining",
  ],
  Energy: [
    "crude",
    "oil",
    "gas",
    "refinery",
    "power",
    "energy",
  ],
  Pharma: [
    "pharma",
    "drug",
    "medicine",
    "usfda",
    "healthcare",
  ],
  Realty: [
    "real estate",
    "realty",
    "housing",
    "property developer",
  ],
  FMCG: [
    "fmcg",
    "consumer goods",
    "food products",
    "personal care",
  ],
  Telecom: [
    "telecom",
    "mobile subscriber",
    "spectrum",
    "5g",
  ],
  Aviation: [
    "airline",
    "aviation",
    "air traffic",
  ],
  Infrastructure: [
    "infrastructure",
    "construction",
    "highway",
    "railway",
    "capital goods",
  ],
};

const INDEX_KEYWORDS: Record<string, string[]> = {
  "Nifty 50": ["nifty", "nifty 50"],
  Sensex: ["sensex"],
  "Bank Nifty": ["bank nifty", "nifty bank"],
  "Nifty IT": ["nifty it"],
  "Nifty Midcap": ["midcap", "mid-cap"],
  "Nifty Smallcap": ["smallcap", "small-cap"],
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "with",
  "after",
  "amid",
  "says",
  "shares",
  "stock",
]);

function articleText(article: NewsArticle): string {
  return `${article.headline} ${article.summary}`.toLowerCase();
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsExactPhrase(
  text: string,
  phrase: string
): boolean {
  const escaped = escapeRegExp(
    phrase.trim().toLowerCase()
  );

  return new RegExp(
    `(^|[^a-z0-9])${escaped}($|[^a-z0-9])`,
    "i"
  ).test(text);
}

function detectEvents(
  article: NewsArticle
): NewsEventType[] {
  const text =
    articleText(article);

  const headline =
    article.headline.toLowerCase();

  const matches = EVENT_RULES
    .map((rule) => {
      const headlineMatches =
        rule.phrases.filter((phrase) =>
          headline.includes(phrase)
        ).length;

      const fullTextMatches =
        rule.phrases.filter((phrase) =>
          text.includes(phrase)
        ).length;

      return {
        type: rule.type,

        /*
         * Headline matches receive more weight
         * than matches found only in the summary.
         */
        score:
          headlineMatches *
            rule.weight *
            2 +
          fullTextMatches *
            rule.weight,
      };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((match) => match.type);

  /*
   * Market direction in the headline should
   * take priority over secondary macro factors
   * mentioned in the article summary.
   */
  const hasMarketSubject =
    /\b(nifty|sensex|bank nifty|index|indices|market|shares?|stocks?)\b/i.test(
      headline
    );

  const hasMarketDirection =
    /\b(fall|falls|fell|falling|decline|declines|declined|declining|drop|drops|dropped|slide|slides|slid|sliding|loss|losses|loser|losers|gain|gains|gained|gainer|gainers|rise|rises|rose|rising|rally|rallies|surge|surges|jump|jumps|below|lower|higher|weak|pressure)\b/i.test(
      headline
    );

  if (
    hasMarketSubject &&
    hasMarketDirection
  ) {
    return [
      "Market Movement",
      ...matches.filter(
        (type) =>
          type !== "Market Movement"
      ),
    ];
  }

  return matches.length > 0
    ? [...new Set(matches)]
    : ["Other"];
}

function analyzeArticleSentiment(
  article: NewsArticle
): SentimentResult {
  const headline =
    article.headline.toLowerCase();

  const summary =
    article.summary.toLowerCase();

  let positive = 0;
  let negative = 0;
  let evidence = 0;

  for (
    const [phrase, weight] of
    Object.entries(POSITIVE_PHRASES)
  ) {
    if (headline.includes(phrase)) {
      positive += weight * 2;
      evidence += 1;
    } else if (summary.includes(phrase)) {
      positive += weight;
      evidence += 1;
    }
  }

  for (
    const [phrase, weight] of
    Object.entries(NEGATIVE_PHRASES)
  ) {
    if (headline.includes(phrase)) {
      negative += weight * 2;
      evidence += 1;
    } else if (summary.includes(phrase)) {
      negative += weight;
      evidence += 1;
    }
  }

  const marketSubject =
    /\b(nifty|sensex|index|market|stock|shares?)\b/i;

  const positiveMove =
    /\b(up|gain|gains|gained|gaining|rise|rises|rose|rising|rally|rallies|rallied|rallying|surge|surges|surged|surging|jump|jumps|jumped|jumping|climb|climbs|climbed|climbing)\b(?:\s+(?:by|over|nearly|almost))?\s+\d+(?:\.\d+)?\s*(?:%|per cent|points?|bps)?/i;

  const negativeMove =
    /\b(down|fall|falls|fell|falling|decline|declines|declined|declining|drop|drops|dropped|dropping|slide|slides|slid|sliding|slip|slips|slipped|slipping|tumble|tumbles|tumbled|tumbling|plunge|plunges|plunged|plunging|lose|loses|lost|losing)\b(?:\s+(?:by|over|nearly|almost))?\s+\d+(?:\.\d+)?\s*(?:%|per cent|points?|bps)?/i;

  if (
    marketSubject.test(headline) ||
    marketSubject.test(summary)
  ) {
    if (positiveMove.test(headline)) {
      positive += 4;
      evidence += 1;
    } else if (positiveMove.test(summary)) {
      positive += 2;
      evidence += 1;
    }

    if (negativeMove.test(headline)) {
      negative += 4;
      evidence += 1;
    } else if (negativeMove.test(summary)) {
      negative += 2;
      evidence += 1;
    }
  }

  const difference = positive - negative;

  let sentiment: Sentiment = "Neutral";

  if (
    positive > 0 &&
    negative > 0 &&
    Math.abs(difference) <= 2
  ) {
    sentiment = "Mixed";
  } else if (difference >= 2) {
    sentiment = "Bullish";
  } else if (difference <= -2) {
    sentiment = "Bearish";
  }

  return {
    sentiment,
    score: Math.max(
      -100,
      Math.min(100, difference * 12)
    ),
    confidence: clamp(35 + evidence * 12),
    explanation:
      evidence > 0
        ? `Contextual phrase evidence: ${positive} positive and ${negative} negative.`
        : "No strong contextual sentiment phrase was identified.",
  };
}

function detectNamedGroups(
  text: string,
  mapping: Record<string, string[]>
): string[] {
  return Object.entries(mapping)
    .filter(([, keywords]) =>
      keywords.some((keyword) =>
        containsExactPhrase(text, keyword)
      )
    )
    .map(([name]) => name);
}

function affectedCompanies(
  article: NewsArticle
): string[] {
  const symbol =
    article.symbol?.trim().toUpperCase();

  if (
    !symbol ||
    [
      "MARKET",
      "GLOBAL",
      "GENERAL",
      "N/A",
    ].includes(symbol)
  ) {
    return [];
  }

  return [symbol];
}

function sourceReliability(
  source: string
): number {
  const value = source.toLowerCase();

  if (
    value.includes("nse") ||
    value.includes("bse") ||
    value.includes("sebi") ||
    value.includes("rbi")
  ) {
    return 100;
  }

  if (
    value.includes("reuters") ||
    value.includes("bloomberg")
  ) {
    return 95;
  }

  if (
    value.includes("business standard") ||
    value.includes("businessline") ||
    value.includes("economic times")
  ) {
    return 85;
  }

  if (
    value.includes("moneycontrol") ||
    value.includes("mint")
  ) {
    return 80;
  }

  if (value.includes("times of india")) {
    return 70;
  }

  return 60;
}

function freshnessScore(
  publishedAt: string
): number {
  const time =
    new Date(publishedAt).getTime();

  if (!Number.isFinite(time)) {
    return 30;
  }

  const hours = Math.max(
    0,
    (Date.now() - time) / 3_600_000
  );

  if (hours <= 3) return 100;
  if (hours <= 8) return 90;
  if (hours <= 24) return 75;
  if (hours <= 48) return 55;
  if (hours <= 96) return 35;

  return 15;
}

function headlineTokens(
  headline: string
): Set<string> {
  return new Set(
    headline
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 2 &&
          !STOP_WORDS.has(word)
      )
  );
}

function similarity(
  left: Set<string>,
  right: Set<string>
): number {
  if (
    left.size === 0 ||
    right.size === 0
  ) {
    return 0;
  }

  const intersection =
    [...left].filter((word) =>
      right.has(word)
    ).length;

  const union =
    new Set([...left, ...right]).size;

  return union > 0
    ? intersection / union
    : 0;
}

function buildDraft(
  article: NewsArticle
): DraftIntelligence {
  const text = articleText(article);
  const events = detectEvents(article);

  return {
    article,
    eventTypes: events,
    primaryEvent: events[0],
    sentiment:
      analyzeArticleSentiment(article),
    affectedCompanies:
      affectedCompanies(article),
    affectedSectors:
      detectNamedGroups(
        text,
        SECTOR_KEYWORDS
      ),
    affectedIndices:
      detectNamedGroups(
        text,
        INDEX_KEYWORDS
      ),
    sourceReliability:
      sourceReliability(article.source),
    freshnessScore:
      freshnessScore(article.publishedAt),
  };
}

function clusterDrafts(
  drafts: DraftIntelligence[]
) {
  const groups: Array<{
    id: string;
    drafts: DraftIntelligence[];
    tokens: Set<string>;
  }> = [];

  function articleDay(
    publishedAt: string
  ): string {
    const date =
      new Date(publishedAt);

    if (
      Number.isNaN(date.getTime())
    ) {
      return "";
    }

    return date
      .toISOString()
      .slice(0, 10);
  }

  for (const draft of drafts) {
    const tokens =
      headlineTokens(
        draft.article.headline
      );

    const published =
      new Date(
        draft.article.publishedAt
      ).getTime();

    const match =
      groups.find((group) => {
        const primary =
          group.drafts[0];

        const primaryTime =
          new Date(
            primary.article.publishedAt
          ).getTime();

        const withinFourDays =
          Number.isFinite(published) &&
          Number.isFinite(primaryTime)
            ? Math.abs(
                published -
                  primaryTime
              ) <=
              96 * 3_600_000
            : true;

        if (!withinFourDays) {
          return false;
        }

        /*
         * Combine same-day broad-market reports.
         * This prevents several Nifty/Sensex
         * wrap articles occupying separate cards.
         */
        const sameDayMarketMovement =
          draft.primaryEvent ===
            "Market Movement" &&
          primary.primaryEvent ===
            "Market Movement" &&
          articleDay(
            draft.article.publishedAt
          ) ===
            articleDay(
              primary.article.publishedAt
            ) &&
          (
            draft.affectedIndices
              .length > 0 ||
            primary.affectedIndices
              .length > 0
          );

        if (sameDayMarketMovement) {
          return true;
        }

        /*
         * Other stories are grouped using
         * headline similarity.
         */
        return (
          similarity(
            tokens,
            group.tokens
          ) >= 0.42
        );
      });

    if (match) {
      match.drafts.push(draft);
    } else {
      groups.push({
        id:
          `cluster-${groups.length + 1}`,

        drafts: [draft],

        tokens,
      });
    }
  }

  return groups;
}

function baseMagnitude(
  event: NewsEventType
): number {
    if (
    [
      "Merger",
      "Acquisition",
      "Buyback",
      "Regulatory",
      "Litigation",
      "Results",
      "Index Inclusion",
      "Index Exclusion",
    ].includes(event)
  ) {
    return 70;
  }

  if (
    [
      "Order Win",
      "Rating Downgrade",
      "Rating Upgrade",
      "Guidance",
      "Promoter",
      "Index Rebalance",
"Brokerage Call",
    ].includes(event)
  ) {
    return 58;
  }

  if (
    [
      "Dividend",
      "Bonus",
      "Split",
      "Management",
      "Macro",
      "Market Movement",
    ].includes(event)
  ) {
    return 45;
  }

  return 28;
}

function magnitudeLabel(
  score: number
): Impact {
  if (score >= 85) return "Critical";
  if (score >= 65) return "High";
  if (score >= 42) return "Medium";

  return "Low";
}

function impactDirection(
  sentiment: SentimentResult
): ImpactDirection {
  if (
    sentiment.sentiment === "Bullish"
  ) {
    return "Positive";
  }

  if (
    sentiment.sentiment === "Bearish"
  ) {
    return "Negative";
  }

  if (
    sentiment.sentiment === "Mixed"
  ) {
    return "Mixed";
  }

  return "Neutral";
}

function impactScope(
  draft: DraftIntelligence
): ImpactScope {
  /*
   * Broad index news takes priority over
   * sectors mentioned only as contributing
   * market drivers.
   */
  if (
    draft.affectedIndices.length > 0
  ) {
    return "Index";
  }

  if (
    draft.affectedCompanies.length > 0
  ) {
    return "Company";
  }

  if (
    draft.affectedSectors.length > 0
  ) {
    return "Sector";
  }

  if (
    draft.article.category === "Global"
  ) {
    return "Global Market";
  }

  return "Indian Market";
}
function impactHorizon(
  event: NewsEventType
): ImpactHorizon {
  if (
    [
      "Market Movement",
      "Bulk Deal",
      "Block Deal",
      "FII Activity",
      "DII Activity",
    ].includes(event)
  ) {
    return "Immediate";
  }

    if (
    [
      "Results",
      "Dividend",
      "Bonus",
      "Split",
      "Rating Upgrade",
      "Rating Downgrade",
      "Brokerage Call",
      "Index Inclusion",
      "Index Exclusion",
      "Index Rebalance",
    ].includes(event)
  ) {
    return "Short Term";
  }

  if (
    [
      "Order Win",
      "Guidance",
      "Buyback",
      "Promoter",
      "Management",
    ].includes(event)
  ) {
    return "Medium Term";
  }

  return "Structural";
}

function whyItMatters(
  draft: DraftIntelligence
): string {
  const subject =
    draft.affectedCompanies[0] ??
    draft.affectedSectors[0] ??
    "the market";

  const templates: Partial<
    Record<NewsEventType, string>
  > = {
    Results:
      `Earnings, margins and management commentary can change expectations and valuation for ${subject}.`,

    Dividend:
      "The announcement affects shareholder cash returns, but sustainability depends on earnings and cash flow.",

    "Order Win":
      "The order may improve revenue visibility; its importance depends on size, margins and execution period.",

          "Brokerage Call":
      "The recommendation may influence near-term expectations, but investors should compare the brokerage assumptions and target price with the current valuation.",

    "Rating Upgrade":
      "The upgrade indicates improving expectations for earnings, valuation or business prospects. Review the brokerage assumptions before acting.",

    "Rating Downgrade":
      "The downgrade signals weaker earnings, valuation or risk expectations. Check the reasons and the revised target price.",

    "Index Inclusion":
      "Index inclusion may generate passive-fund buying around the effective date. Actual impact depends on estimated inflows and prior positioning.",

    "Index Exclusion":
      "Index exclusion may trigger passive-fund selling around the effective date. Actual impact depends on expected outflows and market liquidity.",

    "Index Rebalance":
      "The index change may create passive buying and selling around the effective date, affecting short-term volumes and prices.",
      Regulatory:
      "Regulatory action can affect operations, reputation, compliance costs and valuation.",

    Litigation:
      "Legal developments can create financial, operational or reputational risk.",

    Acquisition:
      `The transaction may change growth, debt and execution risk for ${subject}.`,

    Merger:
      "The proposed combination may change ownership, scale, valuation and integration risk.",

    Macro:
      "The development may influence rates, currency, liquidity and broad market risk appetite.",

    "Market Movement":
  "The index move signals the current risk environment. Market breadth, India VIX, institutional flows and important support levels should confirm whether the move is sustainable.",
  };

  return (
    templates[draft.primaryEvent] ??
    `This development may affect expectations for ${subject}; materiality requires confirmation from filings and price action.`
  );
}

function createImpact(
  draft: DraftIntelligence,
  confirmationCount: number
): ArticleImpact {
  const relevance = clamp(
    draft.article.marketRelevance
  );

  const score = clamp(
    baseMagnitude(
      draft.primaryEvent
    ) *
      0.55 +
      relevance * 0.25 +
      draft.sourceReliability * 0.1 +
      Math.min(
        100,
        confirmationCount * 20
      ) *
        0.1
  );

  return {
    direction:
      impactDirection(draft.sentiment),

    magnitude:
      magnitudeLabel(score),

    scope:
      impactScope(draft),

    horizon:
      impactHorizon(
        draft.primaryEvent
      ),

    score:
      Math.round(score),

    confidence:
      Math.round(
        clamp(
          draft.sentiment.confidence *
            0.45 +
            draft.sourceReliability *
              0.35 +
            Math.min(
              100,
              confirmationCount * 25
            ) *
              0.2
        )
      ),

    explanation:
      `${draft.primaryEvent} with ${impactScope(
        draft
      ).toLowerCase()} scope and ${confirmationCount} source article(s).`,
  };
}

function buildSectorImpact(
  intelligence: ArticleIntelligence[]
): SectorImpact[] {
  return Object.keys(SECTOR_KEYWORDS)
    .map((sector) => {
      const relevant =
        intelligence.filter((item) =>
          item.affectedSectors.includes(
            sector
          )
        );

      const positive =
        relevant.filter(
          (item) =>
            item.impact.direction ===
            "Positive"
        );

      const negative =
        relevant.filter(
          (item) =>
            item.impact.direction ===
            "Negative"
        );

      const net =
        positive.length -
        negative.length;

      const direction: ImpactDirection =
        net > 0
          ? "Positive"
          : net < 0
            ? "Negative"
            : relevant.length > 0
              ? "Mixed"
              : "Neutral";

      const score =
        relevant.length > 0
          ? Math.round(
              relevant.reduce(
                (sum, item) =>
                  sum +
                  (
                    item.impact
                      .direction ===
                    "Positive"
                      ? item.priorityScore
                      : item.impact
                            .direction ===
                          "Negative"
                        ? -item.priorityScore
                        : 0
                  ),
                0
              ) / relevant.length
            )
          : 0;

      return {
        sector,
        direction,
        score,
        positiveEvents:
          positive.length,
        negativeEvents:
          negative.length,
        importantHeadlines:
          relevant
            .slice(0, 3)
            .map(
              (item) =>
                item.article.headline
            ),
        affectedCompanies: [
          ...new Set(
            relevant.flatMap(
              (item) =>
                item.affectedCompanies
            )
          ),
        ],
      };
    })
    .filter(
      (sector) =>
        sector.positiveEvents +
          sector.negativeEvents >
        0
    )
    .sort(
      (a, b) =>
        Math.abs(b.score) -
        Math.abs(a.score)
    );
}

function buildBriefing(
  intelligence: ArticleIntelligence[]
): MarketBriefing {
  const ranked =
    intelligence.slice(0, 10);

  const signedScore =
    ranked.length > 0
      ? ranked.reduce(
          (sum, item) =>
            sum +
            (
              item.impact.direction ===
              "Positive"
                ? item.priorityScore
                : item.impact
                      .direction ===
                    "Negative"
                  ? -item.priorityScore
                  : 0
            ),
          0
        ) / ranked.length
      : 0;

  const label =
    signedScore >= 18
      ? "Positive"
      : signedScore <= -18
        ? "Negative"
        : Math.abs(signedScore) < 5
          ? "Neutral"
          : "Mixed";

  const positives =
    ranked.filter(
      (item) =>
        item.impact.direction ===
        "Positive"
    );

  const negatives =
    ranked.filter(
      (item) =>
        item.impact.direction ===
        "Negative"
    );

  return {
    label,

    score:
      Math.round(
        clamp(
          50 + signedScore / 2
        )
      ),

    confidence:
      Math.round(
        ranked.length > 0
          ? ranked.reduce(
              (sum, item) =>
                sum +
                item.impact.confidence,
              0
            ) / ranked.length
          : 0
      ),

    headline:
      `${label} investor-news environment from ${ranked.length} high-priority event cluster(s).`,

    summary:
      `${positives.length} supportive and ${negatives.length} negative high-priority developments were identified. News signals should be confirmed with market breadth, price action, India VIX and institutional flows.`,

    keyPositives:
      positives
        .slice(0, 3)
        .map(
          (item) =>
            item.article.headline
        ),

    keyNegatives:
      negatives
        .slice(0, 3)
        .map(
          (item) =>
            item.article.headline
        ),

    keyRisks:
      negatives
        .filter((item) =>
          [
            "High",
            "Critical",
          ].includes(
            item.impact.magnitude
          )
        )
        .slice(0, 3)
        .map(
          (item) =>
            item.whyItMatters
        ),

    opportunities:
      positives
        .filter((item) =>
          [
            "Medium",
            "High",
            "Critical",
          ].includes(
            item.impact.magnitude
          )
        )
        .slice(0, 3)
        .map(
          (item) =>
            item.whyItMatters
        ),

    generatedBy:
      "STFL_RULE_ENGINE",

    generatedAt:
      new Date().toISOString(),
  };
}

export function buildInvestorIntelligence(
  articles: NewsArticle[]
) {
  const drafts =
    articles.map(buildDraft);

  const grouped =
    clusterDrafts(drafts);

  const intelligence:
    ArticleIntelligence[] = [];

  const clusters:
    NewsCluster[] = [];

  for (const group of grouped) {
    const sources = [
      ...new Set(
        group.drafts.map(
          (draft) =>
            draft.article.source
        )
      ),
    ];

    const confirmationCount =
      sources.length;

    const groupIntelligence =
      group.drafts.map((draft) => {
        const impact =
          createImpact(
            draft,
            confirmationCount
          );

        const priorityScore =
          Math.round(
            clamp(
              clamp(
                draft.article
                  .marketRelevance
              ) *
                0.3 +
                impact.score *
                  0.25 +
                draft.freshnessScore *
                  0.2 +
                draft.sourceReliability *
                  0.15 +
                Math.min(
                  100,
                  confirmationCount *
                    25
                ) *
                  0.1
            )
          );

        return {
          article: draft.article,
          eventTypes:
            draft.eventTypes,
          primaryEvent:
            draft.primaryEvent,
          sentiment:
            draft.sentiment,
          impact,
          affectedCompanies:
            draft.affectedCompanies,
          affectedSectors:
            draft.affectedSectors,
          affectedIndices:
            draft.affectedIndices,
          whyItMatters:
            whyItMatters(draft),
          priorityScore,
          sourceReliability:
            draft.sourceReliability,
          freshnessScore:
            draft.freshnessScore,
          confirmationCount,
          clusterId: group.id,
        } satisfies ArticleIntelligence;
      });

    groupIntelligence.sort(
      (a, b) =>
        b.priorityScore -
        a.priorityScore
    );

    intelligence.push(
      ...groupIntelligence
    );

    const primary =
      groupIntelligence[0];

    clusters.push({
      id: group.id,
      primaryHeadline:
        primary.article.headline,
      primaryArticleId:
        primary.article.id,
      articleIds:
        groupIntelligence.map(
          (item) =>
            item.article.id
        ),
      sources,
      publishedAt:
        primary.article.publishedAt,
      primaryEvent:
        primary.primaryEvent,
      affectedCompanies: [
        ...new Set(
          groupIntelligence.flatMap(
            (item) =>
              item.affectedCompanies
          )
        ),
      ],
      affectedSectors: [
        ...new Set(
          groupIntelligence.flatMap(
            (item) =>
              item.affectedSectors
          )
        ),
      ],
      impactDirection:
        primary.impact.direction,
      impactMagnitude:
        primary.impact.magnitude,
      priorityScore:
        primary.priorityScore,
      confirmationCount,
    });
  }

  intelligence.sort(
    (a, b) =>
      b.priorityScore -
      a.priorityScore
  );

  clusters.sort(
    (a, b) =>
      b.priorityScore -
      a.priorityScore
  );

    const primaryIds =
    new Set(
      clusters.map(
        (cluster) =>
          cluster.primaryArticleId
      )
    );

  function getArticleAgeHours(
    publishedAt: string
  ): number {
    const publishedTime =
      new Date(
        publishedAt
      ).getTime();

    if (
      !Number.isFinite(
        publishedTime
      )
    ) {
      return Number.POSITIVE_INFINITY;
    }

    return Math.max(
      0,
      (
        Date.now() -
        publishedTime
      ) /
        3_600_000
    );
  }

  function isFreshForCurrentView(
    item: ArticleIntelligence
  ): boolean {
    const ageHours =
      getArticleAgeHours(
        item.article.publishedAt
      );

    /*
     * Intraday market movements and
     * technical news become stale quickly.
     */
        if (
      item.impact.horizon ===
      "Immediate"
    ) {
      const publishedTime =
        new Date(
          item.article.publishedAt
        ).getTime();

      if (
        !Number.isFinite(
          publishedTime
        )
      ) {
        return false;
      }

      /*
       * Convert UTC timestamps to IST before
       * comparing calendar dates.
       */
      const istOffset =
        5.5 * 60 * 60 * 1000;

      const currentIstDate =
        new Date(
          Date.now() + istOffset
        )
          .toISOString()
          .slice(0, 10);

      const articleIstDate =
        new Date(
          publishedTime + istOffset
        )
          .toISOString()
          .slice(0, 10);

      return (
        articleIstDate ===
        currentIstDate
      );
    }

    /*
     * Results, dividends and ratings.
     */
    if (
      item.impact.horizon ===
      "Short Term"
    ) {
      return ageHours <= 72;
    }

    /*
     * Orders, management changes
     * and other medium-term events.
     */
    if (
      item.impact.horizon ===
      "Medium Term"
    ) {
      return ageHours <= 120;
    }

    /*
     * Merger, regulation, litigation
     * and other structural developments.
     */
    return ageHours <= 168;
  }

  const whatMattersNow =
    intelligence
      .filter(
        (item) =>
          primaryIds.has(
            item.article.id
          ) &&
          isFreshForCurrentView(
            item
          )
      )
      .slice(0, 10);

  return {
    /*
     * All relevant articles remain
     * available for news browsing.
     */
    intelligence,

    clusters,

    /*
     * Only fresh developments influence
     * Market Mood and Investor Briefing.
     */
    whatMattersNow,

    sectorImpact:
      buildSectorImpact(
        whatMattersNow
      ),

    marketBriefing:
      buildBriefing(
        whatMattersNow
      ),
  };
}