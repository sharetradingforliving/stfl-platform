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
  revenue: string;
revenueGrowth: number;
ebitda: string;
ebitdaGrowth: number;
netProfit: string;
netProfitGrowth: number;
eps: number;
epsGrowth: number;
industryPe: number;
priceToBook: number;
evToEbitda: number;
pegRatio: number;
intrinsicValue: number;
valuationSignal: string;
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
    revenue: "₹10.72 Lakh Cr",
revenueGrowth: 7.1,
ebitda: "₹1.83 Lakh Cr",
ebitdaGrowth: 5.4,
netProfit: "₹81,309 Cr",
netProfitGrowth: 2.9,
eps: 60.12,
epsGrowth: 3.2,
industryPe: 27.4,
priceToBook: 2.18,
evToEbitda: 12.64,
pegRatio: 1.42,
intrinsicValue: 1640,
valuationSignal: "Fairly Valued",
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
    revenue: "₹2.55 Lakh Cr",
revenueGrowth: 6.0,
ebitda: "₹67,300 Cr",
ebitdaGrowth: 5.8,
netProfit: "₹48,553 Cr",
netProfitGrowth: 5.8,
eps: 134.19,
epsGrowth: 6.1,
industryPe: 26.8,
priceToBook: 12.75,
evToEbitda: 18.9,
pegRatio: 2.15,
intrinsicValue: 3200,
valuationSignal: "Fairly Valued",
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
    revenue: "₹1.63 Lakh Cr",
revenueGrowth: 6.1,
ebitda: "₹39,100 Cr",
ebitdaGrowth: 4.7,
netProfit: "₹26,750 Cr",
netProfitGrowth: 6.5,
eps: 64.4,
epsGrowth: 7.0,
industryPe: 26.8,
priceToBook: 7.15,
evToEbitda: 16.4,
pegRatio: 1.85,
intrinsicValue: 1725,
valuationSignal: "Fairly Valued",
  },
};