"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CalcResult, Transaction } from "@/lib/calc";
import { calcLoc } from "@/lib/calc";
import { TrendingDown, Users } from "lucide-react";
import DocsTab from "@/components/docs-tab";
import AmortizationModal from "@/components/amortization-modal";

const MONO = 'ui-monospace,"SF Mono",Menlo,monospace';

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

interface Loc {
  id: string;
  name: string;
  borrower_name: string;
  lender_name: string;
  ceiling_cents: number;
  apr: number;
  start_date: string;
}

interface Member {
  id: string;
  role: string;
  user_id: string;
}

interface Props {
  loc: Loc;
  transactions: Transaction[];
  result: CalcResult;
  role: "owner" | "viewer";
  members: Member[];
  userId: string;
}

type Tab = "overview" | "history" | "docs" | "members";

const inputStyle: React.CSSProperties = {
  background: "var(--surfB)",
  border: "1px solid var(--bdr)",
  color: "var(--txt)",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 13,
  width: "100%",
  outline: "none",
};

export default function LocDashboard({ loc, transactions, result: initialResult, role, members, userId }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [txs, setTxs] = useState(transactions);
  const [result, setResult] = useState(initialResult);
  const [showAmort, setShowAmort] = useState(false);
  const supabase = createClient();

  function refreshCalc(newTxs: Transaction[]) {
    setTxs(newTxs);
    setResult(calcLoc(newTxs, loc.apr));
  }

  const usedPct = Math.min(100, (result.principal / loc.ceiling_cents) * 100);
  const available = Math.max(0, loc.ceiling_cents - result.principal);

  return (
    <main className="max-w-3xl mx-auto px-4 py-5 space-y-4">
      {showAmort && (
        <AmortizationModal
          principal={result.principal / 100}
          accruedInterest={result.accruedInterest / 100}
          dailyInterest={result.dailyInterest / 100}
          apr={loc.apr}
          lenderName={loc.lender_name}
          borrowerName={loc.borrower_name}
          onClose={() => setShowAmort(false)}
        />
      )}

      {/* Balance card */}
      <div className="rounded-2xl p-5" style={{
        background: "linear-gradient(145deg,#12122a 0%,#0c0c1e 100%)",
        border: "1px solid var(--bdrA)",
      }}>
        <p className="text-xs font-bold tracking-[0.12em] uppercase mb-1" style={{ color: "var(--muted-hi)" }}>
          Total Owed
        </p>
        <p className="text-4xl font-black tracking-tight" style={{ fontFamily: MONO, color: "var(--red-t)" }}>
          {fmt(result.totalOwed)}
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3">
          {[
            ["Principal", fmt(result.principal), "var(--txt)"],
            ["Accrued Interest", fmt(result.accruedInterest), "var(--amber-t)"],
            ["Daily Interest", fmt(result.dailyInterest) + "/day", "var(--muted-hi)"],
          ].map(([label, value, color]) => (
            <div key={label as string}>
              <p className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>{label}</p>
              <p className="text-sm font-bold" style={{ fontFamily: MONO, color: color as string }}>{value}</p>
            </div>
          ))}
        </div>
        {/* Utilization bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1" style={{ color: "var(--muted)" }}>
            <span>{fmt(result.principal)} used</span>
            <span>{fmt(available)} available</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bdr)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${usedPct}%`, background: "var(--accent)" }} />
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {fmt(loc.ceiling_cents)} ceiling · {(loc.apr * 100).toFixed(1)}% APR
            </p>
            {result.principal > 0 && (
              <button
                onClick={() => setShowAmort(true)}
                className="text-xs font-semibold hover:opacity-70 transition-opacity"
                style={{ color: "var(--accent-hi)" }}
              >
                Amortization →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl p-1" style={{ background: "var(--surfB)" }}>
        {(["overview", "history", "docs", "members"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 rounded-lg py-2 text-xs font-semibold capitalize transition-all"
            style={{
              background: tab === t ? "var(--surf)" : "transparent",
              color: tab === t ? "var(--txt-hi)" : "var(--muted)",
              border: tab === t ? "1px solid var(--bdr)" : "1px solid transparent",
            }}
          >
            {t === "docs" ? "Docs" : t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <OverviewTab loc={loc} result={result} txs={txs} role={role} onRefresh={refreshCalc} />
      )}
      {tab === "history" && (
        <HistoryTab txs={txs} role={role} locId={loc.id} onRefresh={refreshCalc} apr={loc.apr} />
      )}
      {tab === "docs" && (
        <DocsTab locId={loc.id} role={role} />
      )}
      {tab === "members" && (
        <MembersTab members={members} locId={loc.id} role={role} currentUserId={userId} />
      )}
    </main>
  );
}

// ─── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ loc, result, txs, role, onRefresh }: {
  loc: Loc; result: CalcResult; txs: Transaction[]; role: string;
  onRefresh: (txs: Transaction[]) => void;
}) {
  const [mode, setMode] = useState<"draw" | "payment" | null>(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const recent = [...txs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!mode) return;
    setError(""); setLoading(true);
    const cents = Math.round(parseFloat(amount) * 100);
    const { data, error: err } = await supabase
      .from("transactions")
      .insert({ loc_id: loc.id, type: mode, amount_cents: cents, date, note: note || null })
      .select() as any;
    if (err) { setError(err.message); setLoading(false); return; }
    onRefresh([...txs, data[0]]);
    setAmount(""); setNote(""); setMode(null); setLoading(false);
  }

  return (
    <div className="space-y-4">
      {/* Payoff projection */}
      <div className="rounded-2xl p-4" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
        <p className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: "var(--muted-hi)" }}>
          <TrendingDown className="h-3.5 w-3.5" />
          Payoff at {fmt(result.dailyInterest * 2)}/day (2× daily interest)
        </p>
        {result.principal > 0 ? (() => {
          const dailyPayment = result.dailyInterest * 2;
          const daysToPayoff = dailyPayment > result.dailyInterest
            ? Math.ceil(result.totalOwed / (dailyPayment - result.dailyInterest))
            : null;
          const payoffDate = daysToPayoff
            ? new Date(Date.now() + daysToPayoff * 86400000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
            : null;
          return (
            <p className="text-sm" style={{ color: "var(--txt)" }}>
              {payoffDate ? `Payoff by ${payoffDate} (${daysToPayoff} days)` : "Increase payment to cover interest"}
            </p>
          );
        })() : <p className="text-sm" style={{ color: "var(--muted)" }}>No outstanding balance.</p>}
      </div>

      {role === "owner" && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode(mode === "draw" ? null : "draw")}
            className="rounded-xl py-3 text-sm font-bold transition-all"
            style={{
              background: mode === "draw" ? "var(--amber)" : "rgba(217,119,6,0.12)",
              color: mode === "draw" ? "#fff" : "var(--amber-t)",
              border: `1px solid ${mode === "draw" ? "var(--amber)" : "rgba(217,119,6,0.3)"}`,
            }}
          >
            + Add Draw
          </button>
          <button
            onClick={() => setMode(mode === "payment" ? null : "payment")}
            className="rounded-xl py-3 text-sm font-bold transition-all"
            style={{
              background: mode === "payment" ? "var(--green)" : "rgba(5,150,105,0.12)",
              color: mode === "payment" ? "#fff" : "var(--green-t)",
              border: `1px solid ${mode === "payment" ? "var(--green)" : "rgba(5,150,105,0.3)"}`,
            }}
          >
            − Add Payment
          </button>
        </div>
      )}

      {mode && (
        <div className="rounded-2xl p-4" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: "var(--txt-hi)" }}>
            {mode === "draw" ? "New Draw" : "Record Payment"}
          </h3>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: "var(--muted-hi)" }}>Amount ($)</label>
                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: "var(--muted-hi)" }}>Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={inputStyle} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: "var(--muted-hi)" }}>Note (optional)</label>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="What is this for?" style={inputStyle} />
            </div>
            {error && (
              <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(220,38,38,0.15)", color: "var(--red-t)" }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-2.5 text-sm font-bold transition-opacity disabled:opacity-50"
              style={{ background: mode === "draw" ? "var(--amber)" : "var(--green)", color: "#fff" }}
            >
              {loading ? "Saving…" : mode === "draw" ? "Record Draw" : "Record Payment"}
            </button>
          </form>
        </div>
      )}

      {recent.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
          <p className="text-xs font-bold px-4 pt-4 pb-2 uppercase tracking-wide" style={{ color: "var(--muted)" }}>Recent Activity</p>
          <div>
            {recent.map((tx, i) => (
              <div key={tx.id} className="px-4 py-3 flex items-center justify-between" style={{ borderTop: i > 0 ? "1px solid var(--bdr)" : "none" }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--txt)" }}>
                    {tx.type === "draw" ? "Draw" : "Payment"}
                    {tx.note && <span className="font-normal" style={{ color: "var(--muted)" }}> · {tx.note}</span>}
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {new Date(tx.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <span className="text-sm font-bold" style={{ fontFamily: MONO, color: tx.type === "draw" ? "var(--amber-t)" : "var(--green-t)" }}>
                  {tx.type === "draw" ? "+" : "−"}{fmt(tx.amount_cents)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── History Tab ───────────────────────────────────────────────────────────────
function HistoryTab({ txs, role, locId, onRefresh, apr }: {
  txs: Transaction[]; role: string; locId: string;
  onRefresh: (txs: Transaction[]) => void; apr: number;
}) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const supabase = createClient();
  const sorted = [...txs].sort((a, b) => b.date.localeCompare(a.date));

  async function deleteTx(id: string) {
    setDeleting(id);
    await supabase.from("transactions").delete().eq("id", id);
    onRefresh(txs.filter(t => t.id !== id));
    setDeleting(null);
  }

  if (sorted.length === 0) {
    return <p className="text-center text-sm py-12" style={{ color: "var(--muted)" }}>No transactions yet.</p>;
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
      {sorted.map((tx, i) => (
        <div key={tx.id} className="px-4 py-3 flex items-center gap-3" style={{ borderTop: i > 0 ? "1px solid var(--bdr)" : "none" }}>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold capitalize" style={{ color: "var(--txt)" }}>
              {tx.type}
              {tx.note && <span className="font-normal" style={{ color: "var(--muted)" }}> · {tx.note}</span>}
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {new Date(tx.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <span className="text-sm font-bold flex-shrink-0" style={{ fontFamily: MONO, color: tx.type === "draw" ? "var(--amber-t)" : "var(--green-t)" }}>
            {tx.type === "draw" ? "+" : "−"}{fmt(tx.amount_cents)}
          </span>
          {role === "owner" && (
            <button onClick={() => deleteTx(tx.id)} disabled={deleting === tx.id}
              className="text-xs flex-shrink-0 transition-opacity hover:opacity-80 disabled:opacity-30"
              style={{ color: "var(--red-t)" }}>
              {deleting === tx.id ? "…" : "Delete"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Members Tab ───────────────────────────────────────────────────────────────
function MembersTab({ members, locId, role, currentUserId }: {
  members: Member[]; locId: string; role: string; currentUserId: string;
}) {
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "viewer">("viewer");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setMessage(""); setLoading(true);
    const res = await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role: inviteRole, locId }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Failed"); }
    else { setMessage(`Invite sent to ${email}`); setEmail(""); }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "var(--txt-hi)" }}>
          <Users className="h-4 w-4" /> Members
        </h3>
        <div className="space-y-2">
          {members.map((m, i) => (
            <div key={m.id} className="flex items-center justify-between py-2" style={{ borderTop: i > 0 ? "1px solid var(--bdr)" : "none" }}>
              <span className="text-sm" style={{ color: "var(--txt)" }}>
                {m.user_id === currentUserId ? "You" : m.user_id.slice(0, 8) + "…"}
              </span>
              <span className="text-xs rounded-full px-2 py-0.5 font-semibold" style={{
                background: m.role === "owner" ? "rgba(91,92,246,0.15)" : "rgba(71,85,105,0.15)",
                color: m.role === "owner" ? "var(--accent-hi)" : "var(--muted-hi)",
              }}>
                {m.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {role === "owner" && (
        <div className="rounded-2xl p-4" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: "var(--txt-hi)" }}>Invite someone</h3>
          <form onSubmit={invite} className="space-y-3">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="their@email.com" required style={inputStyle} />
            <div className="flex gap-2">
              {(["viewer", "owner"] as const).map(r => (
                <button key={r} type="button" onClick={() => setInviteRole(r)}
                  className="flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition-all"
                  style={{
                    background: inviteRole === r ? "var(--accent)" : "var(--surfB)",
                    color: inviteRole === r ? "#fff" : "var(--muted-hi)",
                    border: `1px solid ${inviteRole === r ? "var(--accent)" : "var(--bdr)"}`,
                  }}>
                  {r}
                </button>
              ))}
            </div>
            {error && <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(220,38,38,0.15)", color: "var(--red-t)" }}>{error}</p>}
            {message && <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(5,150,105,0.15)", color: "var(--green-t)" }}>{message}</p>}
            <button type="submit" disabled={loading}
              className="w-full rounded-lg py-2.5 text-sm font-bold transition-opacity disabled:opacity-50"
              style={{ background: "var(--accent)", color: "#fff" }}>
              {loading ? "Sending…" : "Send Invite"}
            </button>
          </form>
          <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
            They&apos;ll receive an email to set a password and will automatically have access to this LOC.
          </p>
        </div>
      )}
    </div>
  );
}
