"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";

type NavigationItem = {
  label: string;
  href: string;
};

type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

const navigationGroups: NavigationGroup[] = [
  {
    label: "Markets",
    items: [
      {
        label: "Market Intelligence",
        href: "/market-intelligence",
      },
      {
        label: "News & Sentiment",
        href: "/news-sentiment",
      },
      {
        label: "IPO Research",
        href: "/ipo-research",
      },
    ],
  },
  {
    label: "Research",
    items: [
      {
        label: "Fundamental Research",
        href: "/fundamental-research",
      },
      {
        label: "Conviction Engine",
        href: "/conviction-engine",
      },
      {
        label: "Market Astrology",
        href: "/market-astrology",
      },
    ],
  },
  {
    label: "Tools",
    items: [
      {
        label: "AI Research Assistant",
        href: "/ai-research-assistant",
      },
      {
        label: "Options Assistant",
        href: "/options-assistant",
      },
      {
        label: "Mutual Fund Research",
        href: "/mutual-fund-research",
      },
    ],
  },
];

export default function MainNavigation() {
  const [openMenu, setOpenMenu] =
    useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);

  function closeMenu() {
  setOpenMenu(null);
  setIsMobileMenuOpen(false);
}

  return (
    <header className="sticky top-0 z-[100] border-b border-slate-800 bg-[#020817]/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[84px] max-w-7xl items-center justify-between gap-6 px-6">

        <Link
  href="/"
  onClick={closeMenu}
  className="flex shrink-0 items-center"
  aria-label="Share Trading For Living Home"
>
  <Image
    src="/sharetradingforlivingwithoutbg.png"
    alt="Share Trading For Living"
    width={105}
    height={72}
    priority
    className="h-[68px] w-auto object-contain"
  />
</Link>

        <nav className="hidden items-center gap-1 lg:flex">

          <Link
            href="/"
            onClick={closeMenu}
            className="rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-emerald-400"
          >
            Home
          </Link>

          {navigationGroups.map((group) => (
            <div
              key={group.label}
              className="relative"
              onMouseEnter={() =>
                setOpenMenu(group.label)
              }
              onMouseLeave={() =>
                setOpenMenu(null)
              }
            >
              <button
                type="button"
                onClick={() =>
                  setOpenMenu(
                    openMenu === group.label
                      ? null
                      : group.label
                  )
                }
                className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                  openMenu === group.label
                    ? "bg-slate-800 text-emerald-400"
                    : "text-slate-300 hover:bg-slate-800 hover:text-emerald-400"
                }`}
              >
                {group.label}
                <span className="ml-2 text-xs">
                  ▾
                </span>
              </button>

              {openMenu === group.label && (
                <div className="absolute left-0 top-full w-72 pt-2">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-2 shadow-2xl">

                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenu}
                        className="block rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-emerald-500/10 hover:text-emerald-400"
                      >
                        {item.label}
                      </Link>
                    ))}

                  </div>
                </div>
              )}
            </div>
          ))}

          <Link
            href="/portfolio-intelligence"
            onClick={closeMenu}
            className="rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-emerald-400"
          >
            Portfolio
          </Link>

          <Link
            href="/learning-centre"
            onClick={closeMenu}
            className="rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-emerald-400"
          >
            Learn
          </Link>

<Link
  href="/login"
  onClick={closeMenu}
  className="rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-emerald-400"
>
  Login
</Link>

          <Link
            href="/premium-research"
            onClick={closeMenu}
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-300 transition hover:border-amber-400 hover:bg-amber-500/20"
          >
            Premium
          </Link>

        </nav>

        <button
  type="button"
  onClick={() =>
    setIsMobileMenuOpen((current) => !current)
  }
  aria-expanded={isMobileMenuOpen}
  aria-label="Toggle navigation menu"
  className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400 lg:hidden"
>
  {isMobileMenuOpen ? "✕ Close" : "☰ Menu"}
</button>
      </div>
      {isMobileMenuOpen && (
  <div className="border-t border-slate-800 bg-slate-950 px-6 py-5 lg:hidden">
    <nav className="mx-auto flex max-w-7xl flex-col gap-2">

      <Link
        href="/"
        onClick={closeMenu}
        className="rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-emerald-400"
      >
        Home
      </Link>

      {navigationGroups.map((group) => (
        <div
          key={group.label}
          className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3"
        >
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            {group.label}
          </p>

          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              className="block rounded-xl px-3 py-3 text-sm text-slate-300 transition hover:bg-emerald-500/10 hover:text-emerald-400"
            >
              {item.label}
            </Link>
          ))}
        </div>
      ))}

      <Link
        href="/portfolio-intelligence"
        onClick={closeMenu}
        className="rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-emerald-400"
      >
        Portfolio Intelligence
      </Link>

      <Link
        href="/learning-centre"
        onClick={closeMenu}
        className="rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-emerald-400"
      >
        Learning Centre
</Link>
        <Link
  href="/login"
  onClick={closeMenu}
  className="rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-emerald-400"
>
  Login / Member Access
      </Link>

            <Link
        href="/premium-research"
        onClick={closeMenu}
        className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm font-semibold text-amber-300"
      >
        Premium Research
      </Link>

    </nav>
  </div>
)}
    </header>
  );
}