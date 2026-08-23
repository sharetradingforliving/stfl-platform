import IPOHero from "@/components/ipo/IPOHero";
import IPOTable from "@/components/ipo/IPOTable";

export default function Page() {
  return (
    <main className="min-h-screen bg-[#020817] text-white">

      <IPOHero />

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">

        {/* Table heading */}

        <div className="mb-8">

          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
            Live IPO Market
          </p>

          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <h2 className="text-3xl font-bold tracking-tight text-white">
                IPO Tracker
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400 md:text-base">
                Follow current and upcoming IPOs with live issue
                dates, market status, pricing and subscription
                information. Select any company to open the complete
                STFL IPO research report.
              </p>

            </div>

          </div>

        </div>

        <IPOTable />

        {/* Disclaimer */}

        <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">

          <p className="text-xs leading-6 text-amber-200/70">
            Grey Market Premium is unofficial market information
            and is not issued or endorsed by NSE, BSE or SEBI.
            STFL IPO information is provided for research and
            educational purposes and should not be considered an
            investment recommendation.
          </p>

        </div>

      </section>

    </main>
  );
}