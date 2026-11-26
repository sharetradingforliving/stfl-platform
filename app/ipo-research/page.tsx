import IPOHero from "@/components/ipo/IPOHero";
import IPOTable from "@/components/ipo/IPOTable";

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#020817] dark:text-white">
      <IPOHero />

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700 dark:text-teal-300">
            IPO Market
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            IPO Tracker
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300 md:text-base">
            Explore current and upcoming IPOs, including issue dates,
            status, pricing and available subscription information.
            Select a company to open its STFL IPO research report.
          </p>
        </div>

        <IPOTable />

        <aside
          aria-label="IPO research information"
          className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 dark:border-blue-800 dark:bg-blue-950"
        >
          <p className="text-sm leading-6 text-blue-900 dark:text-blue-100">
            IPO information is provided for research and educational
            purposes and is not an investment recommendation. Verify
            issue details against the official prospectus and exchange
            announcements.
          </p>
        </aside>
      </section>
    </main>
  );
}