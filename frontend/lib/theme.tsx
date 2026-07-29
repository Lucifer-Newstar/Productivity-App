"use client";

/**
 * ThemeProvider — dark/light mode toggle.
 *
 * - Persists the user's preference in localStorage under `kaizen.theme`.
 * - On first load, prefers the system setting via `prefers-color-scheme`.
 * - Toggles the `dark` class on the <html> element so Tailwind's `darkMode: "class"`
 *   kicks in across the whole tree.
 * - Safe in SSR: renders `children` immediately; class is applied in an effect so
 *   there's no hydration mismatch (uses `suppressHydrationWarning` on <html>).
 */

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start from the stored preference, fall back to dark (Kaizen's default vibe)
  const [theme, setThemeState] = useState<Theme>("dark");

  // Hydrate from localStorage / system on mount (avoids SSR mismatch)
  useEffect(() => {
    const stored = localStorage.getItem("kaizen.theme") as Theme | null;
    if (stored === "dark" || stored === "light") {
      setThemeState(stored);
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      setThemeState("light");
    }
  }, []);

  // Apply the class to <html> whenever theme changes, and persist
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("kaizen.theme", theme);
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggle = () => setThemeState((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Consumer hook — throws if used outside ThemeProvider. */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
