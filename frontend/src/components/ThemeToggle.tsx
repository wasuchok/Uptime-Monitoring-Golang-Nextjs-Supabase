"use client";

import { useEffect, useState } from "react";

const applyTheme = (theme: "light" | "dark") => {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
};

const getInitialTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
      className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] uppercase tracking-[0.3em] text-slate-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700"
    >
      <span
        className={`h-2 w-2 rounded-full ${
          theme === "light" ? "bg-amber-400" : "bg-emerald-400"
        }`}
      />
      {theme === "light" ? "โหมดสว่าง" : "โหมดมืด"}
    </button>
  );
}
