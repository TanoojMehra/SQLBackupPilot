"use client";
import React, { useEffect, useRef, useState } from "react";

const themes = [
  { value: "system", label: "System", icon: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707"/><circle cx="12" cy="12" r="5"/></svg>
  ) },
  { value: "light", label: "Light", icon: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95-6.95l-1.414 1.414M6.343 17.657l-1.414 1.414m12.728 0l-1.414-1.414M6.343 6.343L4.929 4.929"/></svg>
  ) },
  { value: "dark", label: "Dark", icon: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/></svg>
  ) },
];

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState("system");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Set theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) setTheme(saved);
    else setTheme("system");
  }, []);

  // Apply theme to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else if (theme === "system") {
      const applySystemTheme = () => {
        if (getSystemTheme() === "dark") {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      };
      applySystemTheme();
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      mql.addEventListener("change", applySystemTheme);
      return () => mql.removeEventListener("change", applySystemTheme);
    }
  }, [theme]);

  // Persist theme
  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const current = themes.find(t => t.value === theme) || themes[0];
  const tooltip = theme === "dark" ? "Switch to light mode" : theme === "light" ? "Switch to dark mode" : "Switch theme";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Theme toggle"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        tabIndex={0}
        title={tooltip}
      >
        {current.icon}
        <span className="sr-only">Theme: {current.label}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-50 transition-colors duration-300 animate-fadeIn">
          <ul className="py-1" role="listbox" aria-label="Theme options">
            {themes.map(opt => (
              <li key={opt.value}>
                <button
                  className={`flex items-center gap-2 w-full px-4 py-2 text-left rounded-lg transition-colors duration-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === opt.value ? "font-bold text-blue-600 dark:text-blue-400" : "text-zinc-700 dark:text-zinc-100"}`}
                  role="option"
                  aria-selected={theme === opt.value}
                  onClick={() => { setTheme(opt.value); setOpen(false); }}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.15s ease;
        }
      `}</style>
    </div>
  );
} 