"use client";

import { useState, useMemo } from "react";

const MONO = 'ui-monospace,"SF Mono",Menlo,monospace';

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n ?? 0);
}

interface Props {
  principal: number;
  accruedInterest: number;
  dailyInterest: number;
  apr: number;
  lenderName: string;
  borrowerName: string;
  onClose: () => void;
}

export default function AmortizationModal({ principal, accruedInterest, dailyInterest, apr, lenderName, borrowerName, onClose }: Props) {
  const DR = apr / 365;
  const minMonthly = dailyInterest * 30.44;
  const [monthly, setMonthly] = useState(() => Math.ceil((minMonthly || 0) / 100) * 100 + 200);

  const rows = useMemo(() => {
    const result: { mo: number; date: string; pmt: number; int: number; prin: number; bal: number }[] = [];
    let p = principal, acc = accruedInterest, mo = 0;
    const now = new Date();
    while ((p + acc) > 0.01 && mo < 360) {
      mo++;
      const d = new Date(now.getFullYear(), now.getMonth() + mo, 1);
      const int = p * DR * 30.44;
      acc += int;
      const pmt = Math.min(monthly, p + acc);
      const iA = Math.min(pmt, acc); acc -= iA;
      const pA = Math.min(pmt - iA, p); p = Math.max(0, p - pA);
      result.push({
        mo, pmt, int: iA, prin: pA, bal: p + acc,
        date: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      });
      if (p + acc < 0.01) break;
    }
    return result;
  }, [monthly, principal, accruedInterest, DR]);

  function exportAm() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Amortization</title>
<style>
body{font-family:system-ui,sans-serif;max-width:800px;margin:30px auto;padding:20px}
h2{margin-bottom:4px}p{color:#6b7280;font-size:13px;margin-bottom:20px}
table{width:100%;border-collapse:collapse}
th{background:#f9fafb;padding:8px;text-align:right;font-size:12px;border-bottom:2px solid #e5e7eb}
th:first-child,th:nth-child(2){text-align:left}
td{padding:7px 8px;font-size:12px;border-bottom:1px solid #f3f4f6;text-align:right;font-family:monospace}
td:first-child,td:nth-child(2){text-align:left;font-family:system-ui}
button{margin-top:20px;background:#111;color:#fff;border:none;border-radius:8px;padding:10px 20px;cursor:pointer}
@media print{button{display:none}}
</style></head><body>
<h2>Amortization Schedule</h2>
<p>${lenderName} → ${borrowerName} · ${(apr * 100).toFixed(1)}% APR · ${fmt(monthly)}/mo</p>
<table><thead><tr><th>#</th><th>Date</th><th>Payment</th><th>Interest</th><th>Principal</th><th>Balance</th></tr></thead>
<tbody>${rows.map(r => `<tr><td>${r.mo}</td><td>${r.date}</td><td>${fmt(r.pmt)}</td><td style="color:#d97706">${fmt(r.int)}</td><td style="color:#059669">${fmt(r.prin)}</td><td>${fmt(r.bal)}</td></tr>`).join("")}</tbody></table>
<button onclick="window.print()">Print / Save PDF</button>
</body></html>`);
    win.document.close();
  }

  if (principal <= 0) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 970, display: "flex", flexDirection: "column" }}>
      <div style={{ background: "var(--bg)", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", maxWidth: 600, margin: "0 auto", width: "100%" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--bdr)", flexShrink: 0 }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: "var(--txt-hi)" }}>Amortization Schedule</p>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--muted-hi)", fontSize: 24, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {/* Controls */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--bdr)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "var(--txt)" }}>Monthly payment</span>
            <span style={{ fontFamily: MONO, fontSize: 14, color: "var(--accent-hi)", fontWeight: 800 }}>{fmt(monthly)}</span>
          </div>
          <input
            type="range"
            min={Math.max(1, Math.ceil(minMonthly))}
            max={Math.min(principal + accruedInterest, Math.ceil(minMonthly) * 15 + 5000)}
            step={100}
            value={monthly}
            onChange={e => setMonthly(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--accent)" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <p style={{ fontSize: 12, color: "var(--muted)" }}>
              Payoff in <span style={{ color: "var(--green-t)", fontWeight: 700 }}>{rows.length} months</span>
            </p>
            <button onClick={exportAm} style={{ background: "transparent", border: "1px solid var(--bdrA)", borderRadius: 8, padding: "4px 12px", color: "var(--accent-hi)", fontSize: 12, cursor: "pointer" }}>
              Export PDF
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "var(--surfB)", position: "sticky", top: 0 }}>
                {["#", "Date", "Payment", "Interest", "Principal", "Balance"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: h === "#" || h === "Date" ? "left" : "right", color: "var(--muted-hi)", fontWeight: 700, fontSize: 11, letterSpacing: "0.06em", borderBottom: "1px solid var(--bdr)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.mo} style={{ borderBottom: "1px solid var(--bdr)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                  <td style={{ padding: "7px 12px", color: "var(--muted)", fontFamily: MONO }}>{r.mo}</td>
                  <td style={{ padding: "7px 12px", color: "var(--txt)" }}>{r.date}</td>
                  <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: MONO, color: "var(--txt)" }}>{fmt(r.pmt)}</td>
                  <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: MONO, color: "var(--amber-t)" }}>{fmt(r.int)}</td>
                  <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: MONO, color: "var(--green-t)" }}>{fmt(r.prin)}</td>
                  <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: MONO, color: "var(--txt-hi)", fontWeight: 700 }}>{fmt(r.bal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
