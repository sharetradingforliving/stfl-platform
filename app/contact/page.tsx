import type { Metadata } from "next";

import {
  Camera,
  Mail,
  MessageCircle,
  Users,
  Video,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us | Share Trading For Living",
  description:
    "Contact Share Trading For Living for questions about stock research, market intelligence and STFL services.",
};

const contactOptions = [
  {
    title: "Email",
    value: "sharetradingforliving@gmail.com",
    href: "mailto:sharetradingforliving@gmail.com",
    icon: Mail,
    description:
      "For general enquiries, support and business communication.",
  },
  {
    title: "WhatsApp",
    value: "+91 79056 35297",
    href:
      "https://wa.me/917905635297" +
      "?text=Hello%20STFL%2C%20I%20would%20like%20to%20know%20more%20about%20your%20market%20research%20services.",
    icon: MessageCircle,
    description:
      "Message STFL for information about our research services.",
  },
  {
    title: "YouTube",
    value: "@sharetrading4living",
    href:
      "https://www.youtube.com/" +
      "@sharetrading4living",
    icon: Video,
    description:
      "Watch market outlooks, stock research and educational videos.",
  },
  {
    title: "Instagram",
    value: "@sharetradingforliving",
    href:
      "https://www.instagram.com/" +
      "sharetradingforliving/",
    icon: Camera,
    description:
      "Follow STFL for market updates and research highlights.",
  },
  {
    title: "Facebook",
    value: "Share Trading For Living",
    href:
      "https://www.facebook.com/" +
      "sharetradingforliving",
    icon: Users,
    description:
      "Connect with the Share Trading For Living community.",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
            Contact STFL
          </p>

          <h1 className="mt-4 text-3xl font-bold sm:text-5xl">
            Contact Share Trading For Living
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400 sm:text-lg">
            Have a question about STFL research,
            platform features or membership?
            Connect with us through email,
            WhatsApp or our official social-media
            channels.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {contactOptions.map((option) => {
              const Icon = option.icon;

              return (
                <a
                  key={option.title}
                  href={option.href}
                  target={
                    option.href.startsWith("http")
                      ? "_blank"
                      : undefined
                  }
                  rel={
                    option.href.startsWith("http")
                      ? "noreferrer noopener"
                      : undefined
                  }
                  className="group rounded-2xl border border-slate-800 bg-slate-950/70 p-6 transition hover:-translate-y-1 hover:border-emerald-500/60 hover:shadow-lg hover:shadow-emerald-950/30"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 transition group-hover:bg-emerald-500 group-hover:text-slate-950">
                    <Icon
                      className="h-6 w-6"
                      aria-hidden="true"
                    />
                  </div>

                  <h2 className="mt-5 text-lg font-semibold">
                    {option.title}
                  </h2>

                  <p className="mt-2 break-words font-medium text-emerald-400">
                    {option.value}
                  </p>

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {option.description}
                  </p>
                </a>
              );
            })}
          </div>

          <div className="mt-10 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
            <p className="text-sm leading-6 text-slate-300">
              STFL provides research and
              educational information. We do not
              request passwords, OTPs, trading
              credentials or access to your demat
              account through email, WhatsApp or
              social media.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}