type CompanyPageProps = {
  params: Promise<{
    symbol: string;
  }>;
};

export default async function CompanyPage({
  params,
}: CompanyPageProps) {
  const { symbol } = await params;
  const stockSymbol = symbol.toUpperCase();

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
          STFL Company Research
        </p>

        <h1 className="mt-4 text-4xl font-bold md:text-6xl">
          {stockSymbol}
        </h1>

        <p className="mt-4 text-lg text-slate-400">
          Complete company dashboard, financial analysis, valuation,
          technical signals and investment research.
        </p>
      </div>
    </main>
  );
}