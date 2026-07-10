export type CompanyData = {
  symbol: string;
  companyName: string;
  sector: string;
  exchange: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  marketCap: string;
  peRatio: number;
  roe: number;
  dividendYield: number;
  week52High: number;
  week52Low: number;
};
export const companies: Record<string, CompanyData> = {
  RELIANCE: {
    symbol: "RELIANCE",
    companyName: "Reliance Industries Limited",
    sector: "Diversified",
    exchange: "NSE",
    currentPrice: 1528.4,
    change: 18.75,
    changePercent: 1.24,
    marketCap: "₹20.68 Lakh Cr",
    peRatio: 24.85,
    roe: 9.72,
    dividendYield: 0.36,
    week52High: 1608.8,
    week52Low: 1114.85,
  },

  TCS: {
    symbol: "TCS",
    companyName: "Tata Consultancy Services Limited",
    sector: "Information Technology",
    exchange: "NSE",
    currentPrice: 3428.7,
    change: 19.1,
    changePercent: 0.56,
    marketCap: "₹12.41 Lakh Cr",
    peRatio: 25.6,
    roe: 51.2,
    dividendYield: 1.75,
    week52High: 4592.25,
    week52Low: 3056.05,
  },

  INFY: {
    symbol: "INFY",
    companyName: "Infosys Limited",
    sector: "Information Technology",
    exchange: "NSE",
    currentPrice: 1612.3,
    change: -13.95,
    changePercent: -0.86,
    marketCap: "₹6.69 Lakh Cr",
    peRatio: 24.1,
    roe: 29.8,
    dividendYield: 2.65,
    week52High: 2006.8,
    week52Low: 1307.0,
  },
};