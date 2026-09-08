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
  const { exchange, method } =
    await searchParams;

  const stockSymbol =
    symbol.trim().toUpperCase();

  const selectedExchange:
    | "NSE"
    | "BSE" =
    exchange?.toUpperCase() === "BSE"
      ? "BSE"
      : "NSE";

  const selectedMethod =
    method?.trim().toLowerCase() ??
    "composite";

  return (
    <FundamentalCompanyResearch
      symbol={stockSymbol}
      exchange={selectedExchange}
      initialMethod={selectedMethod}
    />
  );
}