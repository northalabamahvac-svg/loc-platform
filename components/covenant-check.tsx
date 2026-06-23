"use client";

import { useState } from "react";

const DEFAULTS = [
  { id: "no-mca",    label: "No new MCA financing" },
  { id: "financials", label: "Monthly financials submitted" },
  { id: "insurance", label: "Business insurance current" },
  { id: "standing",  label: "Business in good standing" },
  { id: "no-adverse", label: "No material adverse changes" },
];

interface Covenant { id: string; label: string; ok: boolean; }

function load(locId: string): Covenant[] {
  try {
    const r = localStorage.getItem(`loc-covenants-${locId}`);
    return r ? JSON.parse(r) : DEFAULTS.map(c => ({ ...c, ok: true }));
  } catch { return DEFAULTS.map(c => ({ ...c, ok: true })); }
}

function save(locId: string, covs: Covenant[]) {
  try { localStorage.setItem(`loc-covenants-${locId}`, JSON.stringify(covs)); } catch {}
}

export default function CovenantCheck({ locId }: { locId: string }) {
  const [covs, setCovs] = useState<Covenant[]>(() => load(locId));
  const allOk = covs.every(c => c.ok);

  function toggle(id: string) {
    const next = covs.map(c => c.id === id ? { ...c, ok: !c.ok } : c);
    save(locId, next);
    setCovs(next);
  }

  return (
    <div className="rounded-2xl p-4" style={{
      background: "var(--surf)",
      border: `1px solid ${allOk ? "var(--bdr)" : "#7f1d1d"}`,
    }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>LOC Covenants</p>
        <span className="text-xs font-bold" style={{ color: allOk ? "var(--green-t)" : "var(--red-t)" }}>
          {allOk ? "All Clear ✓" : "Violation ✕"}
        </span>
      </div>
      <div>
        {covs.map((c, i) => (
          <div
            key={c.id}
            className="flex items-center gap-3 py-2"
            style={{ borderTop: i > 0 ? "1px solid var(--bdr)" : "none" }}
          >
            <button
              onClick={() => toggle(c.id)}
              className="flex-shrink-0 flex items-center justify-center rounded-md text-sm font-bold transition-all"
              style={{
                width: 24, height: 24,
                background: c.ok ? "#065f46" : "#450a0a",
                border: `1px solid ${c.ok ? "#059669" : "#7f1d1d"}`,
                color: c.ok ? "var(--green-t)" : "var(--red-t)",
                cursor: "pointer",
              }}
            >
              {c.ok ? "✓" : "✕"}
            </button>
            <span className="text-sm" style={{ color: c.ok ? "var(--txt)" : "var(--red-t)" }}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
