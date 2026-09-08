export type NullableNumber =
  | number
  | null;

export type FinancialPeriodType =
  | "ANNUAL"
  | "QUARTERLY"
  | "TTM";

export type ValuationMethod =
  | "COMPOSITE"
  | "DCF"
  | "RELATIVE"
  | "PEER"
  | "GRAHAM";

export type ValuationLabel =
  | "SIGNIFICANTLY_UNDERVALUED"
  | "UNDERVALUED"
  | "FAIRLY_VALUED"
  | "OVERVALUED"
  | "SIGNIFICANTLY_OVERVALUED"
  | "INSUFFICIENT_DATA";

export type ScoreLabel =
  | "STRONG"
  | "GOOD"
  | "MODERATE"
  | "WEAK"
  | "INSUFFICIENT_DATA";

export type EvidenceStrength =
  | "HIGH"
  | "MODERATE"
  | "LOW"
  | "INSUFFICIENT";

export type DataSource = {
  name: string;
  documentType?: string;
  reportingDate?: string;
  sourceUrl?: string;
  fetchedAt?: string;
};

export type CompanyClassification = {
  sector: string | null;
  industry: string | null;
  subIndustry: string | null;
  marketCapCategory:
    | "LARGE_CAP"
    | "MID_CAP"
    | "SMALL_CAP"
    | "MICRO_CAP"
    | null;
};

export type FundamentalCompanyProfile = {
  symbol: string;
  companyName: string;
  exchange: "NSE" | "BSE";
  isin: string | null;
  instrumentKey: string | null;
  classification:
    CompanyClassification;
};

export type MarketSnapshot = {
  currentPrice: NullableNumber;
  previousClose: NullableNumber;
  change: NullableNumber;
  changePercent: NullableNumber;
  marketCapitalization:
    NullableNumber;
  enterpriseValue: NullableNumber;
  sharesOutstanding: NullableNumber;
  lastUpdated: string | null;
  source: string | null;
};

export type FinancialStatementPeriod = {
  period: string;
  periodType: FinancialPeriodType;
  startDate: string | null;
  endDate: string | null;
  currency: "INR";
  unit:
    | "RUPEES"
    | "THOUSANDS"
    | "LAKHS"
    | "CRORES";

  revenue: NullableNumber;
  operatingIncome: NullableNumber;
  ebitda: NullableNumber;
  ebit: NullableNumber;
  profitBeforeTax: NullableNumber;
  taxExpense: NullableNumber;
  netProfit: NullableNumber;
    epsBasic: NullableNumber;
  epsDiluted: NullableNumber;

  /*
   * Finance cost is stored in crores.
   * It enables interest-coverage
   * calculations.
   */
  financeCosts?: NullableNumber;

  totalAssets: NullableNumber;
  totalEquity: NullableNumber;
  totalDebt: NullableNumber;
  /*
 * Banking-specific balance-sheet
 * values. These remain null for
 * non-banking companies.
 */
deposits: NullableNumber;
advances: NullableNumber;

/*
 * Banking-specific asset-quality
 * and profitability ratios.
 * Values are stored as percentages,
 * for example 2.18 means 2.18%.
 */
grossNpaPercent:
  NullableNumber;

netNpaPercent:
  NullableNumber;

returnOnAssetsPercent:
  NullableNumber;
  /*
   * Equity share capital is stored in
   * crores, while face value is rupees
   * per share.
   *
   * sharesOutstanding is the actual
   * number of shares—not crore shares.
   */
  equityShareCapital?: NullableNumber;
  faceValuePerShare?: NullableNumber;
  sharesOutstanding?: NullableNumber;
  cashAndEquivalents: NullableNumber;
  currentAssets: NullableNumber;
  currentLiabilities: NullableNumber;
  inventory: NullableNumber;
  tradeReceivables: NullableNumber;
  tradePayables: NullableNumber;

  operatingCashFlow: NullableNumber;
  investingCashFlow: NullableNumber;
  financingCashFlow: NullableNumber;
  capitalExpenditure: NullableNumber;
  freeCashFlow: NullableNumber;

  dividendPerShare: NullableNumber;
  source: DataSource | null;
};

export type GrowthMetrics = {
  availableCagrYears:
    NullableNumber;

  revenueGrowth1Y:
    NullableNumber;

  revenueCagrAvailable:
    NullableNumber;

  revenueCagr3Y:
    NullableNumber;

  revenueCagr5Y:
    NullableNumber;

  revenueCagr10Y:
    NullableNumber;

  ebitdaGrowth1Y:
    NullableNumber;

  ebitdaCagrAvailable:
    NullableNumber;

  ebitdaCagr3Y:
    NullableNumber;

  ebitdaCagr5Y:
    NullableNumber;

  patGrowth1Y:
    NullableNumber;

  patCagrAvailable:
    NullableNumber;

  patCagr3Y:
    NullableNumber;

  patCagr5Y:
    NullableNumber;

  patCagr10Y:
    NullableNumber;

  epsGrowth1Y:
    NullableNumber;

  epsCagrAvailable:
    NullableNumber;

  epsCagr3Y:
    NullableNumber;

  epsCagr5Y:
    NullableNumber;
};

export type ProfitabilityMetrics = {
  grossMargin: NullableNumber;
  ebitdaMargin: NullableNumber;
  ebitMargin: NullableNumber;
  patMargin: NullableNumber;

  returnOnAssets: NullableNumber;
  returnOnEquity: NullableNumber;
  returnOnCapitalEmployed:
    NullableNumber;
  returnOnInvestedCapital:
    NullableNumber;

  assetTurnover: NullableNumber;
};

export type BalanceSheetMetrics = {
  debtToEquity: NullableNumber;
  netDebt: NullableNumber;
  netDebtToEbitda: NullableNumber;
  interestCoverage: NullableNumber;
  currentRatio: NullableNumber;
  quickRatio: NullableNumber;
  workingCapital: NullableNumber;
};

export type CashFlowMetrics = {
  operatingCashFlowToPat:
    NullableNumber;
  freeCashFlowToPat: NullableNumber;
  freeCashFlowMargin: NullableNumber;
  capitalExpenditureToRevenue:
    NullableNumber;

  cumulativeOperatingCashFlow:
    NullableNumber;

  cumulativeNetProfit:
    NullableNumber;

  cumulativeOcfToPat:
    NullableNumber;

  cashConversionLabel:
    | "STRONG"
    | "HEALTHY"
    | "MODERATE"
    | "WEAK"
    | "INSUFFICIENT_DATA";
};

export type MarketValuationMetrics = {
  earningsPerShare: NullableNumber;
  bookValuePerShare: NullableNumber;
  freeCashFlowPerShare:
    NullableNumber;

  priceToEarnings: NullableNumber;
  priceToBook: NullableNumber;
  priceToSales: NullableNumber;

  enterpriseValueToEbitda:
    NullableNumber;

  enterpriseValueToSales:
    NullableNumber;

  pegRatio: NullableNumber;
  dividendYield: NullableNumber;
};

export type BankSpecificMetrics = {
  netInterestMargin: NullableNumber;
  grossNpa: NullableNumber;
  netNpa: NullableNumber;
  returnOnAssets:  NullableNumber;
  provisionCoverageRatio:
    NullableNumber;
  capitalAdequacyRatio:
    NullableNumber;
  casaRatio: NullableNumber;
  creditGrowth: NullableNumber;
  depositGrowth: NullableNumber;
  costToIncomeRatio: NullableNumber;
  creditCost: NullableNumber;
};

export type IndustrySpecificMetrics = {
  bank?: BankSpecificMetrics;

  additionalMetrics?: Record<
    string,
    NullableNumber
  >;
};

export type FundamentalMetrics = {
  growth: GrowthMetrics;
  profitability:
    ProfitabilityMetrics;
  balanceSheet:
    BalanceSheetMetrics;
  cashFlow: CashFlowMetrics;
  valuation:
    MarketValuationMetrics;
  industrySpecific:
    IndustrySpecificMetrics;
};

export type DcfAssumptions = {
  forecastYears: number;
  revenueGrowthRate:
    NullableNumber;
  freeCashFlowGrowthRate:
    NullableNumber;
  operatingMargin:
    NullableNumber;
  taxRate: NullableNumber;
  wacc: NullableNumber;
  terminalGrowthRate:
    NullableNumber;
  netDebt: NullableNumber;
  dilutedShares:
    NullableNumber;
};

export type ValuationScenario = {
  name: "BEAR" | "BASE" | "BULL";
  fairValuePerShare:
    NullableNumber;
  upsideDownsidePercent:
    NullableNumber;
};

export type DcfValuationResult = {
  applicable: boolean;

  suitabilityReason: string;

  assumptions:
    DcfAssumptions | null;

  scenarios:
    ValuationScenario[];

  selectedFairValue:
    NullableNumber;

  marginOfSafety:
    NullableNumber;

  valuationLabel:
    ValuationLabel;
};

export type GrahamValuationResult = {
  applicable: boolean;
  suitabilityReason: string;

  fairValuePerShare:
    NullableNumber;

  upsideDownsidePercent:
    NullableNumber;

  valuationLabel:
    ValuationLabel;
};

export type RelativeValuationMultiple = {
  name:
    | "P/E"
    | "P/B"
    | "EV/EBITDA"
    | "EV/SALES"
    | "PEG";

  companyMultiple:
    NullableNumber;

  historicalMedian:
    NullableNumber;

  industryMedian:
    NullableNumber;

  impliedFairValue:
    NullableNumber;

  weight: number;
};

export type RelativeValuationResult = {
  applicable: boolean;
  suitabilityReason: string;
  multiples:
    RelativeValuationMultiple[];
  weightedFairValue:
    NullableNumber;
  upsideDownsidePercent:
    NullableNumber;
    valuationLabel:
  ValuationLabel;
};

export type PeerCompany = {
  symbol: string;
  companyName: string;

  revenueGrowth:
    NullableNumber;

  patGrowth: NullableNumber;
  ebitdaMargin:
    NullableNumber;

  returnOnEquity:
    NullableNumber;

  returnOnCapitalEmployed:
    NullableNumber;

  debtToEquity:
    NullableNumber;

  priceToEarnings:
    NullableNumber;

  priceToBook:
    NullableNumber;

  enterpriseValueToEbitda:
    NullableNumber;
};

export type PeerMultipleCoverage = {
  priceToEarnings: number;
  priceToBook: number;
  enterpriseValueToEbitda: number;
};

export type PeerValuationResult = {
  applicable: boolean;
  suitabilityReason: string;

  peers: PeerCompany[];

  peerCount: number;

  multipleCoverage:
    PeerMultipleCoverage;

  peerMedianPe:
    NullableNumber;

  peerMedianPb:
    NullableNumber;

  peerMedianEvEbitda:
    NullableNumber;

  impliedFairValue:
    NullableNumber;

  premiumDiscountToPeers:
    NullableNumber;

  valuationLabel:
    ValuationLabel;

  confidence:
    EvidenceStrength;

  outlierWarnings: string[];
};

export type CompositeMethodWeight = {
  method: Exclude<
    ValuationMethod,
    "COMPOSITE"
  >;

  applicable: boolean;
  weight: number;
  fairValue: NullableNumber;
  reason: string;
};

export type CompositeValuationResult = {
  methods: CompositeMethodWeight[];
  bearValue: NullableNumber;
  baseValue: NullableNumber;
  bullValue: NullableNumber;
  compositeFairValue:
    NullableNumber;
  upsideDownsidePercent:
    NullableNumber;
  valuationLabel: ValuationLabel;
  confidence: EvidenceStrength;
};

export type ScoreComponent = {
  name: string;
  score: NullableNumber;
  maximumScore: number;
  weight: number;
  label: ScoreLabel;
  explanation: string;
};

export type FundamentalScore = {
  growthQuality:
    ScoreComponent;
  profitability:
    ScoreComponent;
  capitalEfficiency:
    ScoreComponent;
  balanceSheetStrength:
    ScoreComponent;
  cashFlowQuality:
    ScoreComponent;
  earningsConsistency:
    ScoreComponent;
  valuationAttractiveness:
    ScoreComponent;

  financialQualityScore:
    NullableNumber;

  valuationScore: NullableNumber;

  overallFundamentalScore:
    NullableNumber;

  financialQualityLabel:
    ScoreLabel;

  valuationLabel:
    ScoreLabel;

  overallLabel: ScoreLabel;
};

export type ResearchEvidence = {
  metric: string;
  period: string | null;
  value: NullableNumber;
  comparisonValue:
    NullableNumber;
  source: DataSource | null;
};

export type AiFundamentalInsight = {
  title: string;
  category:
    | "STRENGTH"
    | "RISK"
    | "TREND"
    | "VALUATION"
    | "DATA_QUALITY";

  explanation: string;
  evidence: ResearchEvidence[];
  confidence: EvidenceStrength;
};

export type FundamentalResearchResponse = {
  status:
    | "success"
    | "partial"
    | "unavailable";

  company:
    FundamentalCompanyProfile;

  market:
    MarketSnapshot | null;

  annualFinancials:
    FinancialStatementPeriod[];

  quarterlyFinancials:
    FinancialStatementPeriod[];

  metrics:
    FundamentalMetrics | null;

  valuation: {
    selectedMethod:
      ValuationMethod;

    dcf:
      DcfValuationResult | null;

    graham:
      GrahamValuationResult | null;

    relative:
      RelativeValuationResult | null;

    peer:
      PeerValuationResult | null;

    composite:
      CompositeValuationResult | null;
  };

  score:
    FundamentalScore | null;

  aiInsights:
    AiFundamentalInsight[];

  warnings: string[];
  sources: DataSource[];
  generatedAt: string;
};