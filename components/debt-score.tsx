"use client";

import type { Transaction } from "@/lib/calc";

const MONO = 'ui-monospace,"SF Mono",Menlo,monospace';

interface Props {
  transactions: Transaction[];
  principal: number;
  totalDrawn: number;
}

export default function DebtScore({ transactions, principal, totalDrawn }: Props) {
  const payments = transactions.filter(t => t.type === "payment");
  const principalPaidPct = Math.min(1, Math.max(0, (totalDrawn - principal) / Math.max(1, totalDrawn)));
  const score = Math.min(850, Math.round(560 + principalPaidPct * 140 + Math.min(payments.length, 15) * 10));
  const color = score >= 750 ? "var(--green-t)" : score >= 650 ? "var(--amber-t)" : "var(--red-t)";
  const label = score >= 750 ? "Excellent" : score >= 700 ? "Good" : score >= 650 ? "Fair" : "Needs Work";
  const pct = (score - 300) / 550;

  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
      <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>
        LOC Health Score
      </p>
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontFamily: MONO, fontSize: 40, fontWeight: 800, color }}>{score}</span>
        <div className="text-right">
          <p className="text-sm font-bold" style={{ color }}>{label}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>300 – 850 scale</p>
        </div>
      </div>
      {/* Gradient bar */}
      <div className="relative h-2.5 rounded-full mb-3" style={{ background: "linear-gradient(90deg,#f87171 0%,#fbbf24 50%,#34d399 100%)" }}>
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2"
          style={{ left: `calc(${pct * 100}% - 8px)`, background: "#fff", borderColor: color, boxShadow: "0 2px 6px rgba(0,0,0,0.4)" }}
        />
      </div>
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        {payments.length === 0
          ? "Make your first payment to improve your score."
          : `${payments.length} payment${payments.length !== 1 ? "s" : ""} made · ${Math.round(principalPaidPct * 100)}% principal paid down`}
      </p>
    </div>
  );
}
