import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Share Trading For Living collects, uses, protects and shares personal information when you use the STFL website and services.",

  alternates: {
    canonical: "/privacy-policy",
  },

  openGraph: {
    title: "Privacy Policy | Share Trading For Living",
    description:
      "Understand how STFL handles account information, analytics, cookies, advertising data and user privacy.",
    url: "https://sharetradingforliving.com/privacy-policy",
    type: "website",
  },
};

const informationCategories = [
  {
    title: "Information you provide",
    items: [
      "Name, email address and other account information provided during registration or profile management",
      "Messages and information submitted through contact forms, email or support requests",
      "Preferences, watchlists, alerts or saved-research information when these features are used",
      "Subscription and transaction references when paid services become available",
    ],
  },
  {
    title: "Information collected automatically",
    items: [
      "Internet Protocol address, browser type, device type and operating-system information",
      "Pages visited, links selected, approximate visit time, referring pages and general usage activity",
      "Authentication, security, error and diagnostic information",
      "Cookies, local storage and similar technologies used for functionality, analytics, security and advertising",
    ],
  },
  {
    title: "Information from service providers",
    items: [
      "Authentication and account information supplied through Clerk",
      "Website-usage information processed through Google Analytics",
      "Technical and delivery information provided by hosting, infrastructure and security providers",
      "Payment status and transaction references from an authorised payment processor when payment services are enabled",
    ],
  },
];

const purposes = [
  "Provide, operate and maintain the STFL website and research tools",
  "Create and secure user accounts",
  "Remember preferences and saved features",
  "Respond to questions, support requests and feedback",
  "Measure website usage and improve performance",
  "Detect errors, abuse, fraud and security incidents",
  "Develop and improve research, analytical and educational features",
  "Administer subscriptions and payments when paid services are enabled",
  "Display and measure advertising after advertising services are enabled",
  "Meet applicable legal, regulatory and contractual obligations",
];

const userChoices = [
  "Update certain account and profile information through available account settings",
  "Request correction or deletion of eligible personal information",
  "Withdraw consent where processing depends on consent",
  "Manage browser cookies and local-storage settings",
  "Use Google advertising controls to manage personalized advertising",
  "Contact STFL with a privacy question or request",
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#020817] dark:text-white">
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50 via-slate-50 to-white px-6 py-16 dark:border-slate-800 dark:from-blue-950/20 dark:via-slate-950 dark:to-[#020817]">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-700 dark:text-blue-400">
            Privacy and Data
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
            Privacy Policy
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-400">
            This policy explains what information STFL may collect, why it is
            used, when it may be shared and the choices available to users.
          </p>

          <p className="mt-5 text-sm text-slate-500">
            Last updated: 26 October 2026
          </p>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-6xl space-y-8">
          <PolicySection number="01" title="Scope of This Policy">
            <p>
              This Privacy Policy applies to the Share Trading For Living
              website, available at sharetradingforliving.com, and related STFL
              web-based research, educational and account services.
            </p>

            <p>
              Third-party websites and services linked from STFL operate under
              their own privacy policies. Users should review those policies
              before providing personal information.
            </p>
          </PolicySection>

          <PolicySection number="02" title="Information We May Collect">
            <div className="grid gap-5 lg:grid-cols-3">
              {informationCategories.map((category) => (
                <div
                  key={category.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950"
                >
                  <h3 className="font-bold">{category.title}</h3>

                  <ul className="mt-4 space-y-3">
                    {category.items.map((item) => (
                      <li
                        key={item}
                        className="flex gap-3 text-sm leading-6 text-slate-600 dark:text-slate-400"
                      >
                        <span
                          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500"
                          aria-hidden="true"
                        />

                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </PolicySection>

          <PolicySection number="03" title="How Information May Be Used">
            <div className="grid gap-3 md:grid-cols-2">
              {purposes.map((purpose) => (
                <div
                  key={purpose}
                  className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                >
                  <span
                    className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                    aria-hidden="true"
                  />

                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {purpose}
                  </p>
                </div>
              ))}
            </div>
          </PolicySection>

          <PolicySection number="04" title="Cookies and Similar Technologies">
            <p>
              STFL and its service providers may use cookies, browser storage,
              pixels, web beacons and similar technologies to operate the
              website, maintain sessions, remember preferences, measure usage,
              improve security and support advertising.
            </p>

            <p>
              Users can manage cookies through their browser settings. Blocking
              essential cookies or storage may prevent authentication,
              preferences or other website features from working correctly.
            </p>
          </PolicySection>

          <PolicySection number="05" title="Google Analytics">
            <p>
              STFL uses Google Analytics to understand how visitors interact
              with the website. Google may process information such as the page
              visited, browser and device information, approximate location
              derived from an IP address and interaction events.
            </p>

            <p>
              This information helps STFL analyse usage, diagnose problems and
              improve website performance and content.
            </p>

            <a
              href="https://policies.google.com/technologies/partner-sites"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex font-semibold text-blue-700 transition hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              How Google uses information from partner websites
            </a>
          </PolicySection>

          <PolicySection number="06" title="Advertising and Google AdSense">
            <p>
              STFL may use Google AdSense or other advertising services on
              selected public content pages. Advertising may not be active on
              every page or at every time.
            </p>

            <p>
              Third-party vendors, including Google, may place and read cookies
              on a visitor&apos;s browser or use web beacons, IP addresses and
              similar technologies as a result of advertisements being served on
              the website.
            </p>

            <p>
              Google and its advertising partners may use advertising cookies to
              serve and measure advertisements based on a visitor&apos;s use of
              STFL and other websites, subject to applicable consent and
              advertising settings.
            </p>

            <a
              href="https://adssettings.google.com/"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex font-semibold text-blue-700 transition hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Manage Google advertising preferences
            </a>
          </PolicySection>

          <PolicySection number="07" title="Authentication">
            <p>
              STFL uses Clerk to provide account registration, sign-in, session
              management and authentication functionality. Information submitted
              during these activities may be processed by Clerk according to its
              own terms and privacy practices.
            </p>

            <a
              href="https://clerk.com/legal/privacy"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex font-semibold text-blue-700 transition hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Review Clerk&apos;s privacy policy
            </a>
          </PolicySection>

          <PolicySection number="08" title="Payments">
            <p>
              If paid subscriptions or purchases are enabled, payment details
              may be collected and processed by an authorised third-party
              payment processor. STFL does not intend to store complete
              payment-card credentials on its own application servers.
            </p>

            <p>
              STFL may retain transaction identifiers, subscription status,
              payment status, invoice information and related records where
              required for service delivery, accounting, dispute resolution or
              legal compliance.
            </p>
          </PolicySection>

          <PolicySection number="09" title="When Information May Be Shared">
            <p>
              Personal information may be shared with service providers that
              support authentication, hosting, analytics, security,
              communications, advertising, databases or payments. They receive
              information only for the relevant service and remain subject to
              their applicable contractual and legal obligations.
            </p>

            <p>
              Information may also be disclosed when reasonably necessary to
              comply with law, respond to lawful requests, protect users,
              investigate fraud or security incidents, enforce applicable terms,
              or complete a legitimate business transfer.
            </p>

            <p>
              STFL does not sell personal information as a standalone commercial
              database.
            </p>
          </PolicySection>

          <PolicySection number="10" title="Data Retention">
            <p>
              Personal information is retained only for as long as reasonably
              necessary for the purpose for which it was collected, including
              account operation, security, contractual requirements, dispute
              resolution, accounting and applicable legal obligations.
            </p>

            <p>
              Retention periods may differ according to the type of information
              and the service involved. Aggregated or de-identified information
              may be retained for analytical purposes where it no longer
              identifies an individual.
            </p>
          </PolicySection>

          <PolicySection number="11" title="Security">
            <p>
              STFL uses reasonable administrative, technical and organisational
              measures intended to protect personal information against
              unauthorised access, loss, misuse, alteration or disclosure.
            </p>

            <p>
              No online system or method of storage can be guaranteed to be
              completely secure. Users should protect their account credentials
              and report suspected unauthorised access promptly.
            </p>
          </PolicySection>

          <PolicySection number="12" title="International Processing">
            <p>
              Some service providers may process information in countries other
              than the visitor&apos;s country of residence. Where applicable,
              information will be handled subject to relevant contractual
              safeguards, service-provider terms and legal requirements.
            </p>
          </PolicySection>

          <PolicySection number="13" title="User Rights and Choices">
            <div className="grid gap-3 md:grid-cols-2">
              {userChoices.map((choice) => (
                <div
                  key={choice}
                  className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                >
                  <span
                    className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500"
                    aria-hidden="true"
                  />

                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {choice}
                  </p>
                </div>
              ))}
            </div>

            <p>
              A request may require reasonable identity verification. Certain
              information may need to be retained where required or permitted by
              applicable law.
            </p>
          </PolicySection>

          <PolicySection number="14" title="Children's Privacy">
            <p>
              STFL is not designed to collect personal information from
              children. If a parent or guardian believes that a child has
              provided personal information without appropriate authorisation,
              they should contact STFL so the matter can be reviewed.
            </p>
          </PolicySection>

          <PolicySection number="15" title="Policy Updates">
            <p>
              This Privacy Policy may be updated when STFL introduces new
              services, changes its data practices, adds service providers or
              responds to legal and regulatory developments.
            </p>

            <p>
              The updated policy will be published on this page with a revised
              last-updated date.
            </p>
          </PolicySection>

          <section className="rounded-3xl border border-blue-200 bg-blue-50 p-8 dark:border-blue-500/20 dark:bg-blue-500/5 md:p-10">
            <h2 className="text-2xl font-bold">Contact STFL about privacy</h2>

            <p className="mt-4 max-w-3xl leading-8 text-slate-600 dark:text-slate-400">
              For privacy questions, requests or concerns, contact Share Trading
              For Living using the contact page or the email address below.
            </p>

            <a
              href="mailto:sharetradingforliving@gmail.com"
              className="mt-5 inline-flex font-semibold text-blue-700 transition hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
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
                href="/terms-and-conditions"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:bg-transparent dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
              >
                Terms and Conditions
              </Link>
            </div>
          </section>

          <p className="text-xs leading-6 text-slate-500">
            This policy provides general information about STFL&apos;s intended
            privacy practices. It should be reviewed periodically and updated as
            the platform, service providers and applicable requirements change.
          </p>
        </div>
      </section>
    </main>
  );
}

function PolicySection({
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
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
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
