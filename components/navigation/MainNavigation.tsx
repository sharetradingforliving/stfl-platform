"use client";

import { SignOutButton, useAuth } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import ThemeToggle from "@/components/theme/ThemeToggle";

import HeaderIndexPrices from "./HeaderIndexPrices";

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
        label: "Market Movers",
        href: "/market-movers",
      },
      {
        label: "FII / DII Data",
        href: "/fii-dii-data",
      },
      {
        label: "News & Sentiment",
        href: "/news-sentiment",
      },
      {
        label: "Corporate Actions",
        href: "/corporate-actions",
      },
      {
        label: "Unlisted Shares",
        href: "/unlisted-shares",
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
        label: "Company Research & Valuation",
        href: "/fundamental-research",
      },
      {
        label: "Stock Discovery",
        href: "/fundamental-research/discovery",
      },
      {
        label: "Conviction Engine",
        href: "/conviction-engine",
      },
      {
        label: "Market Astrology",
        href: "/market-astrology",
      },
      {
        label: "Research Methodology",
        href: "/research-methodology",
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
      {
        label: "Portfolio Intelligence",
        href: "/portfolio-intelligence",
      },
      {
        label: "Learning Centre",
        href: "/learning-centre",
      },
    ],
  },
  {
    label: "Company",
    items: [
      {
        label: "About STFL",
        href: "/about",
      },
      {
        label: "Editorial Policy",
        href: "/editorial-policy",
      },
      {
        label: "Contact Us",
        href: "/contact",
      },
    ],
  },
];

export default function MainNavigation() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { isLoaded, isSignedIn } = useAuth();

  function closeMenu() {
    setOpenMenu(null);
    setIsMobileMenuOpen(false);
  }

  return (
    <header className="theme-header sticky top-0 z-[100] border-b border-slate-800 bg-[#020817]/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[84px] max-w-[1600px] items-center justify-between gap-4 px-4 xl:px-6">
        <div className="flex min-w-0 items-center gap-5">
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

          <div className="shrink-0">
            <HeaderIndexPrices />
          </div>
        </div>

        {/* Desktop navigation */}
        <nav
          aria-label="Main navigation"
          className="ml-4 hidden items-center gap-0 border-l border-slate-700 pl-4 lg:flex"
        >
          <Link
            href="/"
            onClick={closeMenu}
            className="rounded-xl px-3 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-emerald-400"
          >
            Home
          </Link>

          {navigationGroups.map((group) => (
            <div
              key={group.label}
              className="relative"
              onMouseEnter={() => {
                setOpenMenu(group.label);
              }}
              onMouseLeave={() => {
                setOpenMenu(null);
              }}
            >
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={openMenu === group.label}
                onClick={() => {
                  setOpenMenu(openMenu === group.label ? null : group.label);
                }}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                  openMenu === group.label
                    ? "bg-slate-800 text-emerald-400"
                    : "text-slate-300 hover:bg-slate-800 hover:text-emerald-400"
                }`}
              >
                {group.label}

                <span className="ml-2 text-xs" aria-hidden="true">
                  ▼
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

          <ThemeToggle />

          {isLoaded && !isSignedIn && (
            <Link
              href="/login"
              onClick={closeMenu}
              className="rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              Login
            </Link>
          )}

          {isLoaded && isSignedIn && (
            <SignOutButton>
              <button
                type="button"
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Logout
              </button>
            </SignOutButton>
          )}

          <Link
            href="/premium-research"
            onClick={closeMenu}
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-300 transition hover:border-amber-400 hover:bg-amber-500/20"
          >
            Premium
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => {
            setIsMobileMenuOpen((current) => !current);
          }}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          aria-label="Toggle navigation menu"
          className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300 transition hover:border-emerald-500 hover:text-emerald-400 lg:hidden"
        >
          {isMobileMenuOpen ? "× Close" : "☰ Menu"}
        </button>
      </div>

      {/* Mobile navigation */}
      {isMobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="max-h-[calc(100vh-84px)] overflow-y-auto border-t border-slate-800 bg-slate-950 px-6 py-5 lg:hidden"
        >
          <nav
            aria-label="Mobile navigation"
            className="mx-auto flex max-w-7xl flex-col gap-2"
          >
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
                className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-2"
              >
                <p className="px-3 pb-2 pt-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
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

            <div className="flex items-center justify-between rounded-xl border border-slate-800 px-4 py-3">
              <span className="text-sm font-medium text-slate-300">Theme</span>

              <ThemeToggle />
            </div>

            {isLoaded && !isSignedIn && (
              <Link
                href="/login"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Login / Member Access
              </Link>
            )}

            {isLoaded && isSignedIn && (
              <SignOutButton>
                <button
                  type="button"
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  Logout
                </button>
              </SignOutButton>
            )}

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
