import {
  SignIn,
} from "@clerk/nextjs";

import Link from "next/link";

const premiumFeatures = [
  "Exact future planetary-event dates and details",
  "Historical market-event research comparisons",
  "Premium market alerts and research updates",
  "Advanced STFL intelligence tools as released",
];

export default function LoginPage() {
  return (
    <main className="min-h-[calc(100vh-84px)] bg-[#020817] px-6 py-16">
      <div className="mx-auto grid w-full max-w-7xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/70 shadow-2xl lg:grid-cols-[1.15fr_0.85fr]">
        <section className="border-b border-slate-800 p-8 text-white lg:border-b-0 lg:border-r lg:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
            Share Trading For Living
          </p>

          <div className="mt-5 inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-300">
            Free account • Premium optional
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-tight md:text-5xl">
            Your research workspace,
            <span className="block text-emerald-400">
              all in one place.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-slate-400">
            Sign in to access your personal
            dashboard, saved research and STFL
            market intelligence. Start with Free
            access and upgrade whenever you are
            ready.
          </p>

          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-slate-700 bg-[#020817]/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Monthly Premium
              </p>

              <div className="mt-3 flex items-end gap-1">
                <span className="text-3xl font-bold text-white">
                  ₹299
                </span>

                <span className="pb-1 text-sm text-slate-500">
                  /month
                </span>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                Flexible monthly access with
                recurring billing.
              </p>
            </article>

            <article className="relative rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5">
              <span className="absolute right-4 top-4 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-950">
                Best Value
              </span>

              <p className="pr-20 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Annual Premium
              </p>

              <div className="mt-3 flex items-end gap-1">
                <span className="text-3xl font-bold text-white">
                  ₹2,999
                </span>

                <span className="pb-1 text-sm text-slate-400">
                  /year
                </span>
              </div>

              <p className="mt-3 text-xs leading-5 text-emerald-200/70">
                Save ₹589 compared with twelve
                monthly payments.
              </p>
            </article>
          </div>

          <div className="mt-9">
            <p className="text-sm font-semibold text-white">
              Premium includes
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {premiumFeatures.map(
                (feature) => (
                  <div
                    key={feature}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs text-emerald-400">
                      ✓
                    </div>

                    <p className="text-sm leading-6 text-slate-300">
                      {feature}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/premium-research"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
            >
              Compare Free and Premium

              <span aria-hidden="true">
                →
              </span>
            </Link>

            <p className="text-xs leading-5 text-slate-500">
              Signing in does not start a paid
              subscription.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full">
            <div className="mb-6 text-center">
              <p className="text-sm font-semibold text-white">
                Welcome back
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Sign in securely with Clerk
              </p>
            </div>

            <SignIn
              path="/login"
              routing="path"
              signUpUrl="/sign-up"
              fallbackRedirectUrl="/dashboard"
              appearance={{
                variables: {
                  colorPrimary:
                    "#10b981",
                  colorPrimaryForeground:
                    "#020817",
                  colorBackground:
                    "#07111f",
                  colorForeground:
                    "#f8fafc",
                  colorMuted:
                    "#0f172a",
                  colorMutedForeground:
                    "#94a3b8",
                  colorInput:
                    "#0f172a",
                  colorInputForeground:
                    "#f8fafc",
                  colorNeutral:
                    "#f8fafc",
                  colorBorder:
                    "#334155",
                  colorRing:
                    "#10b981",
                  colorShadow:
                    "transparent",
                  borderRadius:
                    "0.75rem",
                },

                elements: {
                  rootBox:
                    "w-full max-w-md mx-auto",

                  cardBox:
                    "!w-full !shadow-none",

                  card:
                    "!w-full !border !border-slate-800 !bg-[#07111f] !shadow-none",

                  headerTitle:
                    "!text-white",

                  headerSubtitle:
                    "!text-slate-400",

                  socialButtonsBlockButton:
                    "!border-slate-700 !bg-slate-900 !text-white hover:!border-emerald-500/50 hover:!bg-slate-800",

                  socialButtonsBlockButtonText:
                    "!text-white",

                  dividerLine:
                    "!bg-slate-700",

                  dividerText:
                    "!text-slate-400",

                  formFieldLabel:
                    "!text-slate-200",

                  formFieldInput:
                    "!border-slate-700 !bg-slate-900 !text-white placeholder:!text-slate-500 focus:!border-emerald-500",

                  formFieldInputShowPasswordButton:
                    "!text-slate-400 hover:!text-emerald-400",

                  formButtonPrimary:
                    "!bg-emerald-500 !text-slate-950 hover:!bg-emerald-400",

                  footer:
                    "!bg-[#07111f]",

                  footerActionText:
                    "!text-slate-400",

                  footerActionLink:
                    "!text-emerald-400 hover:!text-emerald-300",

                  identityPreviewText:
                    "!text-white",

                  identityPreviewEditButton:
                    "!text-emerald-400",

                  formResendCodeLink:
                    "!text-emerald-400",

                  otpCodeFieldInput:
                    "!border-slate-700 !bg-slate-900 !text-white",

                  alertText:
                    "!text-slate-200",

                  formFieldErrorText:
                    "!text-rose-300",
                },
              }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}