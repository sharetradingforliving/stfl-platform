import BasicCompanyDashboard from "./BasicCompanyDashboard";

type CompanyPageProps = {
  params: Promise<{
    symbol: string;
  }>;

  searchParams: Promise<{
    exchange?: string;
  }>;
};

export default async function CompanyPage({
  params,
  searchParams,
}: CompanyPageProps) {
  const { symbol } = await params;
  const { exchange } = await searchParams;

  const selectedExchange: "NSE" | "BSE" =
    exchange?.toUpperCase() === "BSE"
      ? "BSE"
      : "NSE";

  const stockSymbol = symbol.toUpperCase();

  return (
    <BasicCompanyDashboard
      symbol={stockSymbol}
      exchange={selectedExchange}
    />
  );
}