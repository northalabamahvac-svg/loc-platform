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
type BgName = "dark" | "houston";

const DARK_BG = "linear-gradient(rgba(5,5,18,0.72),rgba(5,5,18,0.72)), linear-gradient(160deg,#0a0a1f 0%,#050510 40%,#080818 100%)";
const HOUSTON_BG = "url('/michael.jpg')";

const ThemeContext = createContext<{
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  bg: BgName;
  setBg: (b: BgName) => void;
}>({ theme: "cosmic", setTheme: () => {}, bg: "dark", setBg: () => {} });

export function useTheme() { return useContext(ThemeContext); }

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("cosmic");
  const [bg, setBgState] = useState<BgName>("dark");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("loc-theme") as ThemeName;
      if (saved && THEMES[saved]) setThemeState(saved);
      const savedBg = localStorage.getItem("loc-bg") as BgName;
      if (savedBg === "dark" || savedBg === "houston") setBgState(savedBg);
    } catch {}
  }, []);

  useEffect(() => {
    const t = THEMES[theme];
    document.documentElement.style.setProperty("--accent", t.accent);
    document.documentElement.style.setProperty("--accent-hi", t.accentHi);
    try { localStorage.setItem("loc-theme", theme); } catch {}
  }, [theme]);

  useEffect(() => {
    if (bg === "houston") {
      document.body.style.backgroundImage = HOUSTON_BG;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
      document.body.style.backgroundRepeat = "no-repeat";
      document.body.style.backgroundColor = "#000";
    } else {
      document.body.style.backgroundImage = DARK_BG;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "";
      document.body.style.backgroundAttachment = "fixed";
      document.body.style.backgroundRepeat = "";
      document.body.style.backgroundColor = "#08080f";
    }
    try { localStorage.setItem("loc-bg", bg); } catch {}
  }, [bg]);

  function setTheme(t: ThemeName) { setThemeState(t); }
  function setBg(b: BgName) { setBgState(b); }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, bg, setBg }}>
      {children}
    </ThemeContext.Provider>
  );
}

export { THEMES };
export type { ThemeName, BgName };
