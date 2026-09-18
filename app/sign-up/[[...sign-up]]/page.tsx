import {
  SignUp,
} from "@clerk/nextjs";
import Link from "next/link";


const freeFeatures = [
  "Secure personal STFL account",
  "Member research dashboard",
  "Public planetary positions",
  "Historical market summaries",
];


const premiumFeatures = [
  "Exact future planetary-event dates",
  "Detailed event research",
  "Historical research comparisons",
  "Premium alerts and intelligence tools",
];


export default function SignUpPage() {
  return (
    <main className="min-h-[calc(100vh-84px)] bg-[#020817] px-6 py-16">
      <div className="mx-auto grid w-full max-w-7xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/70 shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="border-b border-slate-800 p-8 text-white lg:border-b-0 lg:border-r lg:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
            STFL Membership
          </p>

          <div className="mt-5 inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-300">
            Start free • Upgrade later
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-tight md:text-5xl">
            Create your personal
            <span className="block text-emerald-400">
              research workspace.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-slate-400">
            Create a secure STFL account and
            begin with Free access. A paid
            subscription is optional and can be
            activated later from your dashboard.
          </p>

          <div className="mt-9 grid gap-5 sm:grid-cols-2">
            <article className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Free Membership
              </p>

              <p className="mt-3 text-3xl font-bold text-white">
                ₹0
              </p>

              <p className="mt-2 text-sm text-slate-400">
                No payment required
              </p>

              <div className="mt-6 space-y-4">
                {freeFeatures.map(
                  (feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-3"
                    >
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-xs text-cyan-300">
                        ✓
                      </div>

                      <p className="text-sm leading-6 text-slate-300">
                        {feature}
                      </p>
                    </div>
                  ),
                )}
              </div>
            </article>

            <article className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Premium Membership
              </p>

              <div className="mt-3 flex items-end gap-1">
                <span className="text-3xl font-bold text-white">
                  ₹299
                </span>

                <span className="pb-1 text-sm text-slate-400">
                  /month
                </span>
              </div>

              <p className="mt-2 text-sm text-emerald-200/70">
                Or ₹2,999 annually
              </p>

              <div className="mt-6 space-y-4">
                {premiumFeatures.map(
                  (feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-3"
                    >
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs text-emerald-300">
                        ✓
                      </div>

                      <p className="text-sm leading-6 text-slate-300">
                        {feature}
                      </p>
                    </div>
                  ),
                )}
              </div>
            </article>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-[#020817]/70 p-5">
            <p className="text-sm font-semibold text-white">
              No automatic payment
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Creating an account gives you Free
              membership. Premium begins only
              after you deliberately select a
              plan and complete Razorpay payment.
            </p>
          </div>

          <div className="mt-7">
            <Link
              href="/premium-research"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 transition hover:text-emerald-300"
            >
              Compare all membership benefits
              <span aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </section>

        <section className="flex items-center justify-center bg-[#020817]/40 p-6 sm:p-8 lg:p-12">
          <div className="w-full">
            <div className="mb-7 text-center">
              <p className="text-sm font-semibold text-white">
                Create your Free account
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Secured through Clerk
              </p>
            </div>

            <SignUp
              path="/sign-up"
              routing="path"
              signInUrl="/login"
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
      "#0f1b2d",
    colorMutedForeground:
      "#94a3b8",

    colorInput:
      "#0f1b2d",
    colorInputForeground:
      "#f8fafc",

    colorNeutral:
      "#64748b",
    colorBorder:
      "#334155",
    colorRing:
      "#10b981",
    colorShadow:
      "#000000",

    colorDanger:
      "#fb7185",
    colorSuccess:
      "#34d399",
    colorWarning:
      "#fbbf24",

    borderRadius:
      "0.75rem",
    fontFamily:
      "inherit",
    fontFamilyButtons:
      "inherit",
  },

  elements: {
    rootBox:
      "w-full max-w-md mx-auto",

    card:
      "!border !border-slate-700 !bg-[#07111f] !text-white shadow-2xl shadow-black/30",

    headerTitle:
      "!text-white",

    headerSubtitle:
      "!text-slate-400",

    socialButtonsBlockButton:
      "!border-slate-700 !bg-slate-900 !text-slate-100 hover:!border-emerald-500 hover:!bg-slate-800",

    socialButtonsBlockButtonText:
      "!text-slate-100",

    dividerLine:
      "!bg-slate-700",

    dividerText:
      "!text-slate-400",

    formFieldLabel:
      "!text-slate-200",

    formFieldInput:
      "!border-slate-700 !bg-slate-900 !text-white placeholder:!text-slate-500 focus:!border-emerald-500 focus:!ring-emerald-500",

    formFieldInputShowPasswordButton:
      "!text-slate-400 hover:!text-emerald-400",

    formButtonPrimary:
      "!bg-emerald-500 !font-bold !text-slate-950 hover:!bg-emerald-400",

    footer:
      "!border-t !border-slate-800 !bg-[#07111f]",

    footerActionText:
      "!text-slate-400",

    footerActionLink:
      "!text-emerald-400 hover:!text-emerald-300",

    identityPreviewText:
      "!text-white",

    identityPreviewEditButton:
      "!text-emerald-400",

    formFieldAction:
      "!text-emerald-400",

    alertText:
      "!text-slate-200",

    formResendCodeLink:
      "!text-emerald-400",

    otpCodeFieldInput:
      "!border-slate-700 !bg-slate-900 !text-white",

    footerPages:
      "!bg-[#07111f]",

    footerPagesLink:
      "!text-slate-500",
  },
}}            />
          </div>
        </section>
      </div>
    </main>
  );
}