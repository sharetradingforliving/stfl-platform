import { notFound } from "next/navigation";

import FundamentalCompanyResearch from "@/components/fundamental/FundamentalCompanyResearch";

type FundamentalCompanyPageProps = {
  params: Promise<{
    symbol: string;
  }>;

  searchParams: Promise<{
    exchange?: string;
    method?: string;
  }>;
};

export default async function FundamentalCompanyPage({
  params,
  searchParams,
}: FundamentalCompanyPageProps) {
  const { symbol } = await params;
  const { exchange, method } = await searchParams;

  let stockSymbol: string;

  try {
    stockSymbol = decodeURIComponent(symbol)
      .trim()
      .toUpperCase();
  } catch {
    notFound();
  }

  if (!/^[A-Z0-9&._-]{1,30}$/.test(stockSymbol)) {
    notFound();
  }

  const selectedExchange: "NSE" | "BSE" =
    exchange?.trim().toUpperCase() === "BSE"
      ? "BSE"
      : "NSE";

  const selectedMethod =
    method?.trim().toLowerCase() ?? "composite";

  return (
    <FundamentalCompanyResearch
      symbol={stockSymbol}
      exchange={selectedExchange}
      initialMethod={selectedMethod}
    />
  );
}