import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-[calc(100vh-84px)] bg-[#020817] px-6 py-16 text-white">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/70 shadow-2xl lg:grid-cols-2">

        {/* Left Information Panel */}
        <section className="border-b border-slate-800 p-8 lg:border-b-0 lg:border-r lg:p-12">

          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
            Share Trading For Living
          </p>

          <h1 className="mt-6 text-4xl font-bold leading-tight md:text-5xl">
            Your research workspace,
            <span className="block text-emerald-400">
              all in one place.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-slate-400">
            Sign in to access your watchlist, portfolio intelligence,
            saved research, premium reports and personalized market
            insights.
          </p>

          <div className="mt-10 space-y-5">

            {[
              "Save stocks to your personal watchlist",
              "Track portfolio performance and risk",
              "Access personalized research insights",
              "View premium research and market ideas",
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-start gap-4"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-sm text-emerald-400">
                  ✓
                </div>

                <p className="text-sm leading-7 text-slate-300">
                  {feature}
                </p>
              </div>
            ))}

          </div>

        </section>

        {/* Login Form */}
        <section className="p-8 lg:p-12">

          <div className="mx-auto max-w-md">

            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Member Access
            </p>

            <h2 className="mt-4 text-3xl font-bold">
              Welcome back
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Enter your account details to continue to the
              STFL research platform.
            </p>

            <form className="mt-9 space-y-6">

              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-300"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="mt-3 w-full rounded-xl border border-slate-700 bg-[#020817] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">

                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-300"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-xs font-medium text-emerald-400"
                  >
                    Forgot password?
                  </button>

                </div>

                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="mt-3 w-full rounded-xl border border-slate-700 bg-[#020817] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500"
                />
              </div>

              <Link
  href="/dashboard"
  className="block w-full rounded-xl bg-emerald-500 px-5 py-4 text-center text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
>
  Preview Member Dashboard
</Link>

            </form>

            <div className="my-8 flex items-center gap-4">

              <div className="h-px flex-1 bg-slate-800" />

              <span className="text-xs uppercase tracking-wider text-slate-600">
                New to STFL?
              </span>

              <div className="h-px flex-1 bg-slate-800" />

            </div>

            <button
              type="button"
              className="w-full rounded-xl border border-slate-700 px-5 py-4 text-sm font-semibold text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400"
            >
              Create Free Account
            </button>

            <p className="mt-8 text-center text-xs leading-6 text-slate-600">
              Authentication functionality will be activated during
              the backend integration phase.
            </p>

            <Link
              href="/"
              className="mt-6 block text-center text-sm font-medium text-emerald-400"
            >
              ← Return to homepage
            </Link>

          </div>

        </section>

      </div>
    </main>
  );
}