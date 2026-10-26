import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description:
    "Read the terms governing access to and use of Share Trading For Living, its market data, research tools, accounts and subscription services.",

  alternates: {
    canonical: "/terms-and-conditions",
  },

  openGraph: {
    title: "Terms and Conditions | Share Trading For Living",
    description:
      "Terms governing access to STFL research, market information, analytical tools and account services.",
    url: "https://sharetradingforliving.com/terms-and-conditions",
    type: "website",
  },
};

const acceptableUse = [
  "Use STFL for lawful personal, educational and research purposes",
  "Maintain the confidentiality of account credentials",
  "Provide accurate information when creating or managing an account",
  "Independently verify important financial and market information",
  "Respect intellectual-property, privacy and security rights",
];

const prohibitedUse = [
  "Attempting to gain unauthorised access to accounts, servers, databases or restricted services",
  "Using automated systems to scrape, copy or extract substantial website content without written permission",
  "Interfering with website operation, security, data delivery or another user's access",
  "Reproducing or commercially redistributing STFL content without authorisation",
  "Using the website for unlawful, fraudulent, deceptive or abusive activity",
  "Misrepresenting STFL research as a guaranteed result or personalized recommendation",
];

export default function TermsAndConditionsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#020817] dark:text-white">
      <section className="border-b border-slate-200 bg-gradient-to-b from-slate-100 via-slate-50 to-white px-6 py-16 dark:border-slate-800 dark:from-slate-800 dark:via-slate-950 dark:to-[#020817]">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700 dark:text-emerald-400">
            Website Terms
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
            Terms and Conditions
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-400">
            These terms govern access to and use of Share Trading For Living,
            including its public content, research tools and account-based
            services.
          </p>

          <p className="mt-5 text-sm text-slate-500">
            Last updated: 26 October 2026
          </p>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-500/20 dark:bg-emerald-500/5">
            <h2 className="text-xl font-bold">Acceptance of these terms</h2>

            <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">
              By accessing or using STFL, you agree to these Terms and
              Conditions and the policies referenced within them. If you do not
              agree, you should discontinue use of the website.
            </p>
          </div>

          <TermsSection number="01" title="About STFL">
            <p>
              Share Trading For Living, also referred to as STFL, provides
              financial information, market-data displays, analytical tools,
              research content and educational material.
            </p>

            <p>
              Features may be introduced, changed, restricted, suspended or
              discontinued as the platform develops.
            </p>
          </TermsSection>

          <TermsSection number="02" title="Eligibility">
            <p>
              You must be legally capable of accepting these terms. If you use
              STFL on behalf of an organisation, you represent that you have
              authority to accept these terms on its behalf.
            </p>

            <p>
              Account, subscription or payment features may have additional
              eligibility requirements communicated during registration or
              purchase.
            </p>
          </TermsSection>

          <TermsSection number="03" title="User Accounts">
            <p>
              Certain features may require an account. You are responsible for
              providing accurate information, protecting your credentials and
              activities conducted through your account.
            </p>

            <p>
              Notify STFL promptly if you suspect unauthorised access. STFL may
              require reasonable verification before assisting with account
              access or personal-data requests.
            </p>
          </TermsSection>

          <TermsSection number="04" title="Acceptable Use">
            <div className="grid gap-3 md:grid-cols-2">
              {acceptableUse.map((item) => (
                <ListItem key={item} item={item} tone="positive" />
              ))}
            </div>
          </TermsSection>

          <TermsSection number="05" title="Prohibited Use">
            <div className="grid gap-3 md:grid-cols-2">
              {prohibitedUse.map((item) => (
                <ListItem key={item} item={item} tone="negative" />
              ))}
            </div>
          </TermsSection>

          <TermsSection number="06" title="Financial Information and Research">
            <p>
              STFL content is provided for general education, information and
              research. It does not account for an individual user&apos;s
              financial circumstances, objectives, investment horizon, liquidity
              needs or risk tolerance.
            </p>

            <p>
              Scores, classifications, technical bias, trend, momentum, support,
              resistance, valuation estimates and AI-assisted summaries are
              analytical outputs. They are not guarantees, trade instructions or
              promises of future performance.
            </p>

            <p>
              Users remain responsible for conducting independent research and
              obtaining appropriately qualified professional advice when
              required.
            </p>
          </TermsSection>

          <TermsSection number="07" title="Market Data and Availability">
            <p>
              Market data, company information, financial statements, exchange
              data, corporate actions and other information may originate from
              third-party providers or public sources.
            </p>

            <p>
              STFL does not guarantee that information will always be complete,
              current, uninterrupted, adjusted or error-free. Prices displayed
              on STFL may differ from executable market prices.
            </p>

            <p>
              Service availability may be affected by maintenance,
              infrastructure issues, provider interruptions, market closures or
              events beyond reasonable control.
            </p>
          </TermsSection>

          <TermsSection number="08" title="Intellectual Property">
            <p>
              Unless otherwise stated, STFL website design, branding, original
              text, analytical presentation, software, databases, calculations
              and other original content are protected by applicable
              intellectual-property laws.
            </p>

            <p>
              Limited personal use does not transfer ownership or grant
              permission to reproduce, republish, sell, license, scrape or
              commercially redistribute content.
            </p>

            <p>
              Third-party trademarks, company names, logos, datasets and content
              remain the property of their respective owners.
            </p>
          </TermsSection>

          <TermsSection number="09" title="Subscriptions and Payments">
            <p>
              STFL may offer free and paid services. Prices, billing periods,
              included features and applicable conditions will be presented
              before a purchase or subscription.
            </p>

            <p>
              Payments may be processed by an authorised third-party payment
              provider. Additional payment-provider terms may apply.
            </p>

            <p>
              Renewal, cancellation, refund and access conditions will be
              disclosed with the relevant plan. Nothing in these terms limits
              rights that cannot lawfully be excluded.
            </p>
          </TermsSection>

          <TermsSection number="10" title="Advertising and External Links">
            <p>
              Selected public pages may display advertisements, sponsored
              content or links to external services. Advertising does not
              constitute an STFL endorsement or guarantee.
            </p>

            <p>
              Third-party websites operate independently and may have different
              terms, security and privacy practices. STFL is not responsible for
              their content, availability or transactions.
            </p>
          </TermsSection>

          <TermsSection number="11" title="User Submissions">
            <p>
              If you submit feedback, questions, error reports or other content,
              you confirm that you have the right to provide it and that it does
              not violate applicable law or another person&apos;s rights.
            </p>

            <p>
              STFL may use feedback to improve the platform without identifying
              you publicly, unless separate permission has been obtained.
            </p>
          </TermsSection>

          <TermsSection number="12" title="Suspension and Termination">
            <p>
              STFL may restrict, suspend or terminate access when reasonably
              necessary to address security risks, unlawful activity, material
              violations of these terms, non-payment or misuse of the platform.
            </p>

            <p>
              Where appropriate and reasonably practicable, users may be
              notified or given an opportunity to address the issue.
            </p>
          </TermsSection>

          <TermsSection number="13" title="Disclaimer of Warranties">
            <p>
              STFL is provided on an &quot;as available&quot; and &quot;as
              is&quot; basis to the extent permitted by applicable law.
            </p>

            <p>
              STFL does not warrant that every feature, calculation, dataset,
              forecast or analytical output will be continuously available,
              complete, accurate or suitable for a particular purpose.
            </p>
          </TermsSection>

          <TermsSection number="14" title="Limitation of Responsibility">
            <p>
              To the extent permitted by applicable law, STFL and its
              contributors will not be responsible for indirect, incidental or
              consequential losses arising from use of, inability to use, or
              reliance on website content, third-party data or analytical
              outputs.
            </p>

            <p>
              Nothing in these terms excludes responsibility that cannot legally
              be excluded or restricted.
            </p>
          </TermsSection>

          <TermsSection number="15" title="Privacy">
            <p>
              The collection and handling of personal information is described
              in the STFL Privacy Policy. By using account-based services, you
              acknowledge that relevant information may be processed as
              described there.
            </p>

            <Link
              href="/privacy-policy"
              className="inline-flex font-semibold text-emerald-700 transition hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Read the Privacy Policy
            </Link>
          </TermsSection>

          <TermsSection number="16" title="Changes to These Terms">
            <p>
              STFL may update these terms to reflect platform, commercial,
              operational or legal changes. The revised terms will be published
              on this page with an updated effective date.
            </p>

            <p>
              Continued use after an updated version becomes effective
              constitutes acceptance to the extent permitted by applicable law.
            </p>
          </TermsSection>

          <TermsSection number="17" title="Applicable Law">
            <p>
              These terms are governed by the laws of India, subject to any
              mandatory rights and protections available under applicable law.
            </p>

            <p>
              Disputes that cannot be resolved amicably will be subject to the
              jurisdiction of the competent courts in India.
            </p>
          </TermsSection>

          <section className="rounded-3xl border border-cyan-200 bg-cyan-50 p-8 dark:border-cyan-500/20 dark:bg-cyan-500/5 md:p-10">
            <h2 className="text-2xl font-bold">Contact</h2>

            <p className="mt-4 max-w-3xl leading-8 text-slate-600 dark:text-slate-400">
              Contact STFL if you have a question about these Terms and
              Conditions.
            </p>

            <a
              href="mailto:sharetradingforliving@gmail.com"
              className="mt-5 inline-flex font-semibold text-cyan-700 transition hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300"
            >
              sharetradingforliving@gmail.com
            </a>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Contact STFL
              </Link>

              <Link
                href="/disclaimer"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:bg-transparent dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
              >
                Financial Disclaimer
              </Link>
            </div>
          </section>

          <p className="text-xs leading-6 text-slate-500">
            These terms provide a general framework for use of STFL and should
            be professionally reviewed before enabling commercial subscriptions,
            regulated services or payment collection.
          </p>
        </div>
      </section>
    </main>
  );
}

function TermsSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-none md:p-8">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          {number}
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold">{title}</h2>

          <div className="mt-4 space-y-4 leading-8 text-slate-600 dark:text-slate-400">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

function ListItem({
  item,
  tone,
}: {
  item: string;
  tone: "positive" | "negative";
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
      <span
        className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
          tone === "positive" ? "bg-emerald-500" : "bg-red-500"
        }`}
        aria-hidden="true"
      />

      <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
        {item}
      </p>
    </div>
  );
}
