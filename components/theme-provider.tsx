"use client";

import { createContext, useContext, useEffect, useState } from "react";

const THEMES = {
  cosmic: { accent: "#5b5cf6", accentHi: "#7b7cfa" },
  ocean:  { accent: "#0ea5e9", accentHi: "#38bdf8" },
  forest: { accent: "#16a34a", accentHi: "#22c55e" },
  ember:  { accent: "#ea580c", accentHi: "#f97316" },
  rose:   { accent: "#e11d48", accentHi: "#f43f5e" },
} as const;

type ThemeName = keyof typeof THEMES;

const ThemeContext = createContext<{
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
}>({ theme: "cosmic", setTheme: () => {} });

export function useTheme() { return useContext(ThemeContext); }

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("cosmic");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("loc-theme") as ThemeName;
      if (saved && THEMES[saved]) setThemeState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    const t = THEMES[theme];
    document.documentElement.style.setProperty("--accent", t.accent);
    document.documentElement.style.setProperty("--accent-hi", t.accentHi);
    try { localStorage.setItem("loc-theme", theme); } catch {}
  }, [theme]);

  function setTheme(t: ThemeName) { setThemeState(t); }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export { THEMES };
export type { ThemeName };
