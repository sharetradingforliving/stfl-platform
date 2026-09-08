import "server-only";

export type DirectBusinessPeerGroup = {
  id: string;
  sector: string;
  industry: string;
  peerGroup: string;
  symbols: string[];
};

export const DIRECT_BUSINESS_PEER_GROUPS:
  DirectBusinessPeerGroup[] = [
  /*
   * BANKING AND FINANCIAL SERVICES
   */
  {
    id: "PRIVATE_BANKS",
    sector: "Financial Services",
    industry: "Banking",
    peerGroup: "Private Sector Banks",
    symbols: [
      "HDFCBANK",
      "ICICIBANK",
      "AXISBANK",
      "KOTAKBANK",
      "INDUSINDBK",
      "FEDERALBNK",
      "IDFCFIRSTB",
      "YESBANK",
      "BANDHANBNK",
      "RBLBANK",
      "KARURVYSYA",
      "CUB",
      "SOUTHBANK",
      "DCBBANK",
      "CSBBANK",
    ],
  },

  {
    id: "PUBLIC_BANKS",
    sector: "Financial Services",
    industry: "Banking",
    peerGroup: "Public Sector Banks",
    symbols: [
      "SBIN",
      "BANKBARODA",
      "PNB",
      "CANBK",
      "UNIONBANK",
      "INDIANB",
      "BANKINDIA",
      "MAHABANK",
      "CENTRALBK",
      "UCOBANK",
      "IOB",
      "PSB",
    ],
  },

  {
    id: "NBFC_CONSUMER_FINANCE",
    sector: "Financial Services",
    industry: "NBFC",
    peerGroup: "Consumer Finance NBFCs",
    symbols: [
      "BAJFINANCE",
      "CHOLAFIN",
      "SHRIRAMFIN",
      "M&MFIN",
      "SUNDARMFIN",
      "LTF",
      "POONAWALLA",
    ],
  },

  {
    id: "HOUSING_FINANCE",
    sector: "Financial Services",
    industry: "Housing Finance",
    peerGroup: "Housing Finance Companies",
    symbols: [
      "BAJAJHFL",
      "LICHSGFIN",
      "PNBHOUSING",
      "AAVAS",
      "APTUS",
      "HOMEFIRST",
      "CANFINHOME",
      "REPCOHOME",
    ],
  },

  {
    id: "LIFE_INSURANCE",
    sector: "Financial Services",
    industry: "Insurance",
    peerGroup: "Life Insurance",
    symbols: [
      "LICI",
      "HDFCLIFE",
      "SBILIFE",
      "ICICIPRULI",
    ],
  },

  {
    id: "GENERAL_HEALTH_INSURANCE",
    sector: "Financial Services",
    industry: "Insurance",
    peerGroup: "General and Health Insurance",
    symbols: [
      "ICICIGI",
      "STARHEALTH",
      "NIACL",
      "GICRE",
    ],
  },

  {
    id: "ASSET_MANAGEMENT",
    sector: "Financial Services",
    industry: "Asset Management",
    peerGroup: "Asset Management Companies",
    symbols: [
      "HDFCAMC",
      "NAM-INDIA",
      "ABSLAMC",
      "UTIAMC",
    ],
  },

  {
    id: "BROKING_CAPITAL_MARKETS",
    sector: "Financial Services",
    industry: "Capital Markets",
    peerGroup: "Broking and Capital Markets",
    symbols: [
      "ANGELONE",
      "NUVAMA",
      "IIFL",
      "MOTILALOFS",
      "360ONE",
      "JMFINANCIL",
      "BSE",
      "MCX",
      "CDSL",
    ],
  },

  /*
   * INFORMATION TECHNOLOGY
   */
  {
    id: "LARGE_CAP_IT_SERVICES",
    sector: "Information Technology",
    industry: "IT Services",
    peerGroup: "Large-Cap IT Services",
    symbols: [
      "TCS",
      "INFY",
      "HCLTECH",
      "WIPRO",
      "TECHM",
      "LTIM",
    ],
  },

  {
    id: "MID_CAP_IT_SERVICES",
    sector: "Information Technology",
    industry: "IT Services",
    peerGroup: "Mid-Cap IT Services",
    symbols: [
      "PERSISTENT",
      "COFORGE",
      "MPHASIS",
      "LTTS",
      "KPITTECH",
      "TATAELXSI",
      "CYIENT",
      "ZENSARTECH",
      "SONATSOFTW",
      "BSOFT",
    ],
  },

  {
    id: "SOFTWARE_PRODUCTS",
    sector: "Information Technology",
    industry: "Software Products",
    peerGroup: "Enterprise Software Products",
    symbols: [
      "OFSS",
      "NEWGEN",
      "INTELLECT",
      "RATEGAIN",
      "MAPMYINDIA",
      "TANLA",
      "HAPPSTMNDS",
    ],
  },

  /*
   * AUTOMOBILES
   */
  {
    id: "PASSENGER_VEHICLES",
    sector: "Automobile",
    industry: "Automobile Manufacturers",
    peerGroup: "Passenger Vehicles",
    symbols: [
      "MARUTI",
      "M&M",
      "TMPV",
    ],
  },

  {
    id: "TWO_WHEELERS",
    sector: "Automobile",
    industry: "Automobile Manufacturers",
    peerGroup: "Two-Wheelers",
    symbols: [
      "HEROMOTOCO",
      "BAJAJ-AUTO",
      "TVSMOTOR",
      "EICHERMOT",
    ],
  },

  {
    id: "COMMERCIAL_VEHICLES",
    sector: "Automobile",
    industry: "Automobile Manufacturers",
    peerGroup: "Commercial Vehicles",
    symbols: [
      "TMCV",
      "ASHOKLEY",
      "SMLISUZU",
      "VSTTILLERS",
      "FORCEMOT",
    ],
  },

  {
    id: "TYRES",
    sector: "Automobile",
    industry: "Auto Components",
    peerGroup: "Tyre Manufacturers",
    symbols: [
      "MRF",
      "APOLLOTYRE",
      "BALKRISIND",
      "CEATLTD",
      "JKTYRE",
      "TVSSRICHAK",
    ],
  },

  {
    id: "AUTO_COMPONENTS",
    sector: "Automobile",
    industry: "Auto Components",
    peerGroup: "Diversified Auto Components",
    symbols: [
      "MOTHERSON",
      "BOSCHLTD",
      "BHARATFORG",
      "UNOMINDA",
      "ENDURANCE",
      "SONACOMS",
      "ZFCommercial",
      "CRAFTSMAN",
      "SUPRAJIT",
      "JAMNAAUTO",
    ],
  },

  {
    id: "AUTO_BATTERIES",
    sector: "Automobile",
    industry: "Auto Components",
    peerGroup: "Automotive Batteries",
    symbols: [
      "EXIDEIND",
      "AMARAJABAT",
      "HBLENGINE",
    ],
  },

  /*
   * FMCG AND CONSUMER STAPLES
   */
  {
    id: "PACKAGED_FOODS",
    sector: "Consumer Staples",
    industry: "FMCG",
    peerGroup: "Packaged Foods",
    symbols: [
      "NESTLEIND",
      "BRITANNIA",
      "BIKAJI",
      "BECTORFOOD",
      "ZYDUSWELL",
      "PRATAAP",
    ],
  },

  {
    id: "PERSONAL_HOME_CARE",
    sector: "Consumer Staples",
    industry: "FMCG",
    peerGroup: "Personal and Home Care",
    symbols: [
      "HINDUNILVR",
      "DABUR",
      "MARICO",
      "GODREJCP",
      "COLPAL",
      "EMAMILTD",
      "JYOTHYLAB",
      "HONASA",
    ],
  },

  {
    id: "TEA_COFFEE_BEVERAGES",
    sector: "Consumer Staples",
    industry: "FMCG",
    peerGroup: "Tea, Coffee and Consumer Beverages",
    symbols: [
      "TATACONSUM",
      "CCL",
      "AVANTIFEED",
      "VBL",
    ],
  },

  {
    id: "EDIBLE_OILS",
    sector: "Consumer Staples",
    industry: "FMCG",
    peerGroup: "Edible Oils and Food Processing",
    symbols: [
      "AWL",
      "PATANJALI",
      "GOKULAGRO",
      "KRBL",
      "LTFOODS",
    ],
  },

  {
    id: "TOBACCO",
    sector: "Consumer Staples",
    industry: "Tobacco",
    peerGroup: "Tobacco Products",
    symbols: [
      "ITC",
      "GODFRYPHLP",
      "VSTIND",
      "NILKAMAL",
    ],
  },

  {
    id: "ALCOHOLIC_BEVERAGES",
    sector: "Consumer Staples",
    industry: "Beverages",
    peerGroup: "Alcoholic Beverages",
    symbols: [
      "UNITDSPR",
      "UBL",
      "RADICO",
      "SULA",
      "GLOBUSSPR",
      "TILAKNAGAR",
      "ALLIEDBLEND",
    ],
  },

  /*
   * CONSUMER DISCRETIONARY
   */
  {
    id: "FOOTWEAR",
    sector: "Consumer Discretionary",
    industry: "Footwear",
    peerGroup: "Footwear",
    symbols: [
      "BATAINDIA",
      "RELAXO",
      "METROBRAND",
      "CAMPUS",
      "LIBERTSHOE",
    ],
  },

  {
    id: "JEWELLERY",
    sector: "Consumer Discretionary",
    industry: "Jewellery",
    peerGroup: "Jewellery Retailers",
    symbols: [
      "TITAN",
      "KALYANKJIL",
      "SENCO",
      "TBZ",
      "THANGAMAYL",
      "PNGJL",
    ],
  },

  {
    id: "PAINTS",
    sector: "Consumer Discretionary",
    industry: "Paints",
    peerGroup: "Decorative Paints",
    symbols: [
      "ASIANPAINT",
      "BERGEPAINT",
      "KANSAINER",
      "INDIGOPNTS",
      "AKZOINDIA",
    ],
  },

  {
    id: "CONSUMER_ELECTRICALS",
    sector: "Consumer Discretionary",
    industry: "Consumer Durables",
    peerGroup: "Consumer Electricals",
    symbols: [
      "HAVELLS",
      "CROMPTON",
      "VGUARD",
      "BAJAJELEC",
      "ORIENTELEC",
      "POLYCAB",
      "KEI",
      "FINCABLES",
    ],
  },

  {
    id: "ROOM_AIR_CONDITIONERS",
    sector: "Consumer Discretionary",
    industry: "Consumer Durables",
    peerGroup: "Air Conditioners and Cooling",
    symbols: [
      "VOLTAS",
      "BLUESTARCO",
      "AMBER",
      "EPACK",
    ],
  },

  {
    id: "ELECTRONICS_MANUFACTURING",
    sector: "Consumer Discretionary",
    industry: "Electronics Manufacturing",
    peerGroup: "Electronics Manufacturing Services",
    symbols: [
      "DIXON",
      "KAYNES",
      "SYRMA",
      "PGEL",
      "AVALON",
      "ELIN",
    ],
  },

  /*
   * DEFENCE
   */
  {
    id: "DEFENCE_ELECTRONICS",
    sector: "Industrials",
    industry: "Defence",
    peerGroup: "Defence Electronics",
    symbols: [
      "BEL",
      "DATAPATTNS",
      "ASTRAMICRO",
      "PARAS",
      "DCXINDIA",
      "IDEAFORGE",
    ],
  },

  {
    id: "DEFENCE_AEROSPACE",
    sector: "Industrials",
    industry: "Defence",
    peerGroup: "Defence Aerospace and Missiles",
    symbols: [
      "HAL",
      "BDL",
      "MIDHANI",
      "MTARTECH",
      "DYNAMATECH",
    ],
  },

  {
    id: "DEFENCE_SHIPBUILDING",
    sector: "Industrials",
    industry: "Defence",
    peerGroup: "Defence Shipbuilding",
    symbols: [
      "MAZDOCK",
      "GRSE",
      "COCHINSHIP",
    ],
  },

  /*
   * PHARMACEUTICALS AND HEALTHCARE
   */
  {
    id: "LARGE_CAP_PHARMA",
    sector: "Healthcare",
    industry: "Pharmaceuticals",
    peerGroup: "Large-Cap Pharmaceuticals",
    symbols: [
      "SUNPHARMA",
      "DRREDDY",
      "CIPLA",
      "DIVISLAB",
      "LUPIN",
      "AUROPHARMA",
      "ZYDUSLIFE",
      "TORNTPHARM",
      "ALKEM",
      "MANKIND",
    ],
  },

  {
    id: "API_CRAMS",
    sector: "Healthcare",
    industry: "Pharmaceuticals",
    peerGroup: "API, CDMO and CRAMS",
    symbols: [
      "DIVISLAB",
      "LAURUSLABS",
      "GLAND",
      "SYNGENE",
      "PIRAMALPHAR",
      "NEULANDLAB",
    ],
  },

  {
    id: "HOSPITALS",
    sector: "Healthcare",
    industry: "Hospitals",
    peerGroup: "Hospital Operators",
    symbols: [
      "APOLLOHOSP",
      "MAXHEALTH",
      "FORTIS",
      "NARAYANA",
      "KIMS",
      "MEDANTA",
      "RAINBOW",
      "ASTERDM",
      "YATHARTH",
    ],
  },

  {
    id: "DIAGNOSTICS",
    sector: "Healthcare",
    industry: "Diagnostics",
    peerGroup: "Diagnostics and Pathology",
    symbols: [
      "LALPATHLAB",
      "METROPOLIS",
      "VIJAYA",
      "THYROCARE",
      "KRSNAA",
    ],
  },

  /*
   * OIL, GAS AND ENERGY
   */
  {
    id: "OIL_GAS_PRODUCERS",
    sector: "Energy",
    industry: "Oil and Gas",
    peerGroup: "Oil and Gas Producers",
    symbols: [
      "ONGC",
      "OIL",
      "HINDOILEXP",
      "SELAN",
    ],
  },

  {
    id: "OIL_REFINING_MARKETING",
    sector: "Energy",
    industry: "Oil and Gas",
    peerGroup: "Oil Refining and Marketing",
    symbols: [
      "IOC",
      "BPCL",
      "HINDPETRO",
      "MRPL",
      "CHENNPETRO",
    ],
  },

  {
    id: "CITY_GAS_DISTRIBUTION",
    sector: "Energy",
    industry: "Gas Distribution",
    peerGroup: "City Gas Distribution",
    symbols: [
      "IGL",
      "MGL",
      "GUJGASLTD",
      "ATGL",
    ],
  },

  {
    id: "GAS_TRANSMISSION_LNG",
    sector: "Energy",
    industry: "Gas Infrastructure",
    peerGroup: "Gas Transmission and LNG",
    symbols: [
      "GAIL",
      "PETRONET",
      "GSPL",
      "AEGISLOG",
    ],
  },

  {
    id: "INTEGRATED_ENERGY_CONGLOMERATES",
    sector: "Energy",
    industry: "Diversified Energy",
    peerGroup: "Integrated Energy Conglomerates",
    symbols: [
      "RELIANCE",
      "ONGC",
      "IOC",
      "BPCL",
      "GAIL",
    ],
  },

  /*
   * POWER AND UTILITIES
   */
  {
    id: "POWER_GENERATION",
    sector: "Utilities",
    industry: "Power",
    peerGroup: "Power Generation",
    symbols: [
      "NTPC",
      "TATAPOWER",
      "JSWENERGY",
      "NHPC",
      "SJVN",
      "NLCINDIA",
      "CESC",
      "TORNTPOWER",
    ],
  },

  {
    id: "POWER_TRANSMISSION_FINANCE",
    sector: "Utilities",
    industry: "Power",
    peerGroup: "Power Transmission and Finance",
    symbols: [
      "POWERGRID",
      "PFC",
      "RECLTD",
      "IEX",
    ],
  },

  {
    id: "RENEWABLE_ENERGY",
    sector: "Utilities",
    industry: "Renewable Energy",
    peerGroup: "Renewable Energy",
    symbols: [
      "ADANIGREEN",
      "INOXWIND",
      "SUZLON",
      "WAAREEENER",
      "BORORENEW",
      "KPIGREEN",
    ],
  },

  /*
   * METALS, CEMENT AND MATERIALS
   */
  {
    id: "STEEL",
    sector: "Materials",
    industry: "Metals",
    peerGroup: "Steel Producers",
    symbols: [
      "TATASTEEL",
      "JSWSTEEL",
      "SAIL",
      "JINDALSTEL",
      "NMDCSTEEL",
      "APLAPOLLO",
    ],
  },

  {
    id: "ALUMINIUM_NONFERROUS",
    sector: "Materials",
    industry: "Metals",
    peerGroup: "Aluminium and Non-Ferrous Metals",
    symbols: [
      "HINDALCO",
      "VEDL",
      "NATIONALUM",
      "HINDZINC",
      "HINDCOPPER",
    ],
  },

  {
    id: "MINING",
    sector: "Materials",
    industry: "Mining",
    peerGroup: "Mining Companies",
    symbols: [
      "COALINDIA",
      "NMDC",
      "MOIL",
      "GMDC",
    ],
  },

  {
    id: "CEMENT",
    sector: "Materials",
    industry: "Cement",
    peerGroup: "Cement Manufacturers",
    symbols: [
      "ULTRACEMCO",
      "AMBUJACEM",
      "SHREECEM",
      "DALBHARAT",
      "JKCEMENT",
      "RAMCOCEM",
      "ACC",
      "NUVOCO",
      "INDIACEM",
    ],
  },

  {
    id: "SPECIALTY_CHEMICALS",
    sector: "Materials",
    industry: "Chemicals",
    peerGroup: "Specialty Chemicals",
    symbols: [
      "SRF",
      "AARTIIND",
      "DEEPAKNTR",
      "NAVINFLUOR",
      "FLUOROCHEM",
      "CLEAN",
      "TATACHEM",
      "ATUL",
      "ALKYLAMINE",
      "FINEORG",
    ],
  },

  {
    id: "AGROCHEMICALS",
    sector: "Materials",
    industry: "Chemicals",
    peerGroup: "Agrochemicals",
    symbols: [
      "UPL",
      "PIIND",
      "SUMICHEM",
      "RALLIS",
      "DHANUKA",
      "BAYERCROP",
      "SHARDACROP",
    ],
  },

  /*
   * INDUSTRIALS AND INFRASTRUCTURE
   */
  {
    id: "EPC_INFRASTRUCTURE",
    sector: "Industrials",
    industry: "Engineering and Construction",
    peerGroup: "EPC and Infrastructure",
    symbols: [
      "LT",
      "KEC",
      "KALPATPOWR",
      "NCC",
      "HGINFRA",
      "PNCINFRA",
      "KNRCON",
      "GRINFRA",
    ],
  },

  {
    id: "CAPITAL_GOODS",
    sector: "Industrials",
    industry: "Capital Goods",
    peerGroup: "Industrial Capital Goods",
    symbols: [
      "SIEMENS",
      "ABB",
      "CUMMINSIND",
      "THERMAX",
      "BHEL",
      "CGPOWER",
      "SCHNEIDER",
      "TRITURBINE",
    ],
  },

  {
    id: "LOGISTICS",
    sector: "Industrials",
    industry: "Logistics",
    peerGroup: "Logistics and Express Delivery",
    symbols: [
      "DELHIVERY",
      "BLUEDART",
      "TCIEXP",
      "VRLLOG",
      "TCI",
      "MAHLOG",
      "GATEWAY",
    ],
  },

  {
    id: "PORTS",
    sector: "Industrials",
    industry: "Transport Infrastructure",
    peerGroup: "Ports and Terminals",
    symbols: [
      "ADANIPORTS",
      "JSWINFRA",
      "GPPL",
    ],
  },

  /*
   * TELECOM AND DIGITAL INFRASTRUCTURE
   */
  {
    id: "TELECOM_OPERATORS",
    sector: "Communication Services",
    industry: "Telecommunication",
    peerGroup: "Telecom Operators",
    symbols: [
      "BHARTIARTL",
      "IDEA",
      "MTNL",
    ],
  },

  {
    id: "TELECOM_EQUIPMENT",
    sector: "Communication Services",
    industry: "Telecommunication Equipment",
    peerGroup: "Telecom Equipment",
    symbols: [
      "TEJASNET",
      "HFCL",
      "ITI",
      "STLTECH",
      "RAILTEL",
    ],
  },

  /*
   * REAL ESTATE
   */
  {
    id: "RESIDENTIAL_REAL_ESTATE",
    sector: "Real Estate",
    industry: "Real Estate",
    peerGroup: "Residential Real Estate Developers",
    symbols: [
      "DLF",
      "GODREJPROP",
      "OBEROIRLTY",
      "PRESTIGE",
      "SOBHA",
      "BRIGADE",
      "LODHA",
      "SUNTECK",
      "SIGNATURE",
    ],
  },

  /*
   * HOTELS AND TRAVEL
   */
  {
    id: "HOTELS",
    sector: "Consumer Discretionary",
    industry: "Hotels",
    peerGroup: "Hotel Operators",
    symbols: [
      "INDHOTEL",
      "EIHOTEL",
      "CHALET",
      "LEMONTREE",
      "SAMHI",
      "PARKHOTELS",
    ],
  },

  {
    id: "AVIATION",
    sector: "Consumer Discretionary",
    industry: "Aviation",
    peerGroup: "Airlines",
    symbols: [
      "INDIGO",
      "SPICEJET",
    ],
  },
];

/*
 * A symbol may appear in more than one
 * group when it operates across multiple
 * business segments.
 *
 * The first matching group is used as
 * the default. A future UI can allow the
 * user to choose another applicable group.
 */
export function findDirectBusinessPeerGroup(
  requestedSymbol: string
): DirectBusinessPeerGroup | null {
  const symbol =
    requestedSymbol
      .trim()
      .toUpperCase();

  if (!symbol) {
    return null;
  }

  return (
    DIRECT_BUSINESS_PEER_GROUPS.find(
      (group) =>
        group.symbols.some(
          (groupSymbol) =>
            groupSymbol
              .trim()
              .toUpperCase() ===
            symbol
        )
    ) ?? null
  );
}

export function getDirectPeerSymbols(
  requestedSymbol: string
): string[] {
  const symbol =
    requestedSymbol
      .trim()
      .toUpperCase();

  const group =
    findDirectBusinessPeerGroup(
      symbol
    );

  if (!group) {
    return [];
  }

  return group.symbols
    .map(
      (groupSymbol) =>
        groupSymbol
          .trim()
          .toUpperCase()
    )
    .filter(
      (groupSymbol) =>
        groupSymbol !== symbol
    );
}