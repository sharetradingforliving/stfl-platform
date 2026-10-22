"use client";

import {
  Moon,
  Sun,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

type ThemeMode = "light" | "dark";

export default function ThemeToggle() {
  const [
    theme,
    setTheme,
  ] = useState<ThemeMode>("dark");

  const [
    isReady,
    setIsReady,
  ] = useState(false);

  useEffect(() => {
    const savedTheme =
      window.localStorage.getItem(
        "stfl-theme"
      ) as ThemeMode | null;

    const systemPrefersDark =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

    const initialTheme =
      savedTheme ??
      (systemPrefersDark
        ? "dark"
        : "light");

    setTheme(initialTheme);

    document.documentElement.classList.toggle(
      "light",
      initialTheme === "light"
    );

    document.documentElement.classList.toggle(
      "dark",
      initialTheme === "dark"
    );

    setIsReady(true);
  }, []);

  function toggleTheme() {
    const nextTheme: ThemeMode =
      theme === "dark"
        ? "light"
        : "dark";

    setTheme(nextTheme);

    window.localStorage.setItem(
      "stfl-theme",
      nextTheme
    );

    document.documentElement.classList.toggle(
      "light",
      nextTheme === "light"
    );

    document.documentElement.classList.toggle(
      "dark",
      nextTheme === "dark"
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={theme === "dark"}
      aria-label={
        theme === "dark"
          ? "Switch to light theme"
          : "Switch to dark theme"
      }
      title={
        theme === "dark"
          ? "Switch to light theme"
          : "Switch to dark theme"
      }
      className="theme-toggle relative flex h-9 w-[70px] shrink-0 items-center rounded-full border p-1 transition"
    >
      <Sun
        className="absolute left-2 h-4 w-4 text-amber-500"
        aria-hidden="true"
      />

      <Moon
        className="absolute right-2 h-4 w-4 text-cyan-300"
        aria-hidden="true"
      />

      <span
        className={`relative z-10 h-7 w-7 rounded-full shadow-md transition-transform duration-300 ${
          isReady &&
          theme === "dark"
            ? "translate-x-[32px] bg-slate-700"
            : "translate-x-0 bg-white"
        }`}
      />
    </button>
  );
}