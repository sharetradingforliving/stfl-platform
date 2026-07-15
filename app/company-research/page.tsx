import Link from "next/link";
import CompanySearch from "@/components/search/CompanySearch";

const popularCompanies = [
  {
    name: "Reliance Industries",
    symbol: "RELIANCE",
    sector: "Energy & Diversified",
  },
  {
    name: "Tata Consultancy Services",
    symbol: "TCS",
    sector: "Information Technology",
  },
  {
    name: "HDFC Bank",
    symbol: "HDFCBANK",
    sector: "Banking",
  },
  {
    name: "ICICI Bank",
    symbol: "ICICIBANK",
    sector: "Banking",
  },
  {
    name: "Infosys",
    symbol: "INFY",
    sector: "Information Technology",
  },
  {
    name: "Bharti Airtel",
    symbol: "BHARTIARTL",
    sector: "Telecommunication",
  },
];

const researchCapabilities = [
  "Company Overview",
  "Live Market Data",
  "Financial Statements",
  "Fundamental Ratios",
  "Valuation Analysis",
  "Peer Comparison",
  "Shareholding Pattern",
  "Technical Analysis",
  "Corporate Actions",
  "News & Sentiment",
  "AI Research Summary",
  "STFL Conviction Score",
];

export default function CompanyResearchPage() {
  return (
    <main className="min-h-screen bg-[#020817] px-6 py-14 text-white">
      <div className="mx-auto max-w-7xl">

        {/* Hero Section */}
        <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-8 md:p-12">

          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
            STFL Company Intelligence
          </p>

          <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            Research Indian companies from one intelligent dashboard.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
            Search NSE and BSE companies and study market data,
            financial performance, valuation, technical trends,
            ownership, corporate actions and research insights.
          </p>

          <div className="mt-10">
  <CompanySearch
    title="Find a Company"
    description="Search any available NSE or BSE company by its name or stock symbol and open the complete STFL Company Research Dashboard."
  />
</div>
              
        </section>

        {/* Popular Companies */}
        <section className="mt-12">

          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Quick Research Access
          </p>

          <h2 className="mt-3 text-3xl font-bold">
            Popular Companies
          </h2>

          <p className="mt-3 text-slate-400">
            Open the existing STFL Company Dashboard for selected companies.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {popularCompanies.map((company) => (
              <Link
                key={company.symbol}
                href={`/company/${company.symbol.toLowerCase()}?exchange=NSE`}
                className="group rounded-2xl border border-slate-800 bg-slate-950/60 p-6 transition hover:-translate-y-1 hover:border-emerald-500/50"
              >

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <p className="text-sm font-semibold text-emerald-400">
                      {company.symbol}
                    </p>

                    <h3 className="mt-3 text-xl font-bold transition group-hover:text-emerald-400">
                      {company.name}
                    </h3>

                  </div>

                  <span className="text-xl text-slate-600 transition group-hover:translate-x-1 group-hover:text-emerald-400">
                    →
                  </span>

                </div>

                <p className="mt-5 text-sm text-slate-500">
                  {company.sector}
                </p>

              </Link>
            ))}

          </div>

        </section>

        {/* Research Capabilities */}
        <section className="mt-12 rounded-3xl border border-slate-800 bg-slate-950/60 p-8 md:p-10">

          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-400">
            Integrated Research Framework
          </p>

          <h2 className="mt-3 text-3xl font-bold">
            One company. Multiple research perspectives.
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            {researchCapabilities.map((capability, index) => (
              <div
                key={capability}
                className="rounded-2xl border border-slate-800 bg-[#020817] p-5"
              >

                <p className="text-xs font-bold text-emerald-400">
                  {String(index + 1).padStart(2, "0")}
                </p>

                <p className="mt-3 font-semibold">
                  {capability}
                </p>

              </div>
            ))}

          </div>

        </section>

        {/* Development Note */}
        <section className="mt-10 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-7">

          <p className="font-semibold text-cyan-400">
            Company Research Development Status
          </p>

          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-400">
            The Company Dashboard and professional chart are already
            under development. Universal company search, complete
            financial research, peer comparison, valuation intelligence
            and AI research capabilities will be connected progressively.
          </p>

        </section>

      </div>
    </main>
  );
}