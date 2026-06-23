"use client";

import { useState } from "react";
import { useTheme, THEMES, type ThemeName } from "./theme-provider";

const THEME_LABELS: Record<ThemeName, string> = {
  cosmic: "Cosmic",
  ocean:  "Ocean",
  forest: "Forest",
  ember:  "Ember",
  rose:   "Rose",
};

export default function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-center rounded-lg w-8 h-8 transition-opacity hover:opacity-70"
        style={{ background: "var(--surfB)", border: "1px solid var(--bdr)" }}
        title="Change theme"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted-hi)" }}>
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-10 z-50 rounded-xl p-3 w-44 space-y-1 shadow-xl"
            style={{ background: "var(--surf)", border: "1px solid var(--bdrA)" }}
          >
            <p className="text-xs font-bold uppercase tracking-wider mb-2 px-1" style={{ color: "var(--muted)" }}>
              Theme
            </p>
            {(Object.keys(THEMES) as ThemeName[]).map(t => (
              <button
                key={t}
                onClick={() => { setTheme(t); setOpen(false); }}
                className="w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-all hover:opacity-80"
                style={{
                  background: theme === t ? "var(--surfB)" : "transparent",
                  color: theme === t ? "var(--txt-hi)" : "var(--muted-hi)",
                  border: theme === t ? "1px solid var(--bdr)" : "1px solid transparent",
                }}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: THEMES[t].accent }}
                />
                {THEME_LABELS[t]}
                {theme === t && (
                  <svg className="ml-auto" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
