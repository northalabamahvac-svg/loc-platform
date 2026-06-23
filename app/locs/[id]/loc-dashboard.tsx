"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CalcResult, Transaction } from "@/lib/calc";
import { calcLoc } from "@/lib/calc";
import { TrendingDown, Users } from "lucide-react";
import DocsTab from "@/components/docs-tab";
import AmortizationModal from "@/components/amortization-modal";
import DebtScore from "@/components/debt-score";
import CreditLinks from "@/components/credit-links";
import EasterEggGames from "@/components/games";

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

type Tab = "overview" | "history" | "docs" | "members" | "settings";

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

  function refreshCalc(newTxs: Transaction[]) {
    setTxs(newTxs);
    setResult(calcLoc(newTxs, loc.apr));
  }

  const usedPct = Math.min(100, (result.principal / loc.ceiling_cents) * 100);
  const available = Math.max(0, loc.ceiling_cents - result.principal);

  return (
    <main className="max-w-3xl mx-auto px-4 py-5 space-y-4">
      {/* Games launcher — floating bottom right */}
      <div className="fixed bottom-6 right-4 z-30">
        <EasterEggGames />
      </div>

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
        {(role === "owner"
        ? (["overview", "history", "docs", "members", "settings"] as Tab[])
        : (["overview", "history", "docs", "members"] as Tab[])
      ).map(t => (
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
      {tab === "settings" && role === "owner" && (
        <SettingsTab loc={loc} />
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
  const [warning, setWarning] = useState("");
  const supabase = createClient();

  const recent = [...txs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const available = Math.max(0, loc.ceiling_cents - result.principal);
  const amtCents = Math.round(parseFloat(amount) * 100) || 0;

  // Live projection for payments
  const afterPaymentOwed = mode === "payment"
    ? Math.max(0, result.totalOwed - amtCents)
    : null;

  function validate(): string | null {
    if (!amount || isNaN(parseFloat(amount))) return "Please enter an amount.";
    if (amtCents <= 0) return "Amount must be greater than $0.";
    const today = new Date().toISOString().slice(0, 10);
    if (date > today) return "Date cannot be in the future.";
    if (mode === "draw") {
      if (amtCents < 100) return "Minimum draw is $1.00.";
      if (amtCents > available) return `Draw exceeds available credit. Available: ${fmt(available)}.`;
    }
    if (mode === "payment") {
      if (result.totalOwed === 0) return "There is no outstanding balance to pay.";
      if (amtCents > result.totalOwed) return `Payment exceeds total owed (${fmt(result.totalOwed)}). Use ${fmt(result.totalOwed)} to pay in full.`;
    }
    return null;
  }

  function getWarning(): string {
    if (mode === "draw" && amtCents > 0 && amtCents > loc.ceiling_cents * 0.5)
      return `⚠ Large draw — ${((amtCents / loc.ceiling_cents) * 100).toFixed(0)}% of your credit ceiling.`;
    if (mode === "draw" && amtCents >= 500000 && !note)
      return "⚠ Draws over $5,000 should include a note for your records.";
    return "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!mode) return;
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError(""); setWarning(""); setLoading(true);
    const { data, error: err } = await supabase
      .from("transactions")
      .insert({ loc_id: loc.id, type: mode, amount_cents: amtCents, date, note: note || null })
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
            {/* Live payment projection */}
            {mode === "payment" && amtCents > 0 && afterPaymentOwed !== null && (
              <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(5,150,105,0.1)", border: "1px solid rgba(5,150,105,0.2)" }}>
                <span style={{ color: "var(--muted-hi)" }}>Remaining after payment: </span>
                <span className="font-bold" style={{ color: afterPaymentOwed === 0 ? "var(--green-t)" : "var(--txt-hi)" }}>
                  {afterPaymentOwed === 0 ? "PAID IN FULL 🎉" : fmt(afterPaymentOwed)}
                </span>
              </div>
            )}
            {/* Live draw check */}
            {mode === "draw" && amtCents > 0 && amtCents <= available && (
              <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.2)" }}>
                <span style={{ color: "var(--muted-hi)" }}>Available after draw: </span>
                <span className="font-bold" style={{ color: "var(--amber-t)" }}>{fmt(available - amtCents)}</span>
              </div>
            )}
            {getWarning() && (
              <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(217,119,6,0.12)", color: "var(--amber-t)" }}>{getWarning()}</p>
            )}
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

      <DebtScore
        transactions={txs}
        principal={result.principal / 100}
        totalDrawn={txs.filter(t => t.type === "draw").reduce((s, t) => s + t.amount_cents, 0) / 100}
      />

      {role === "viewer" && <CreditLinks />}

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
function MembersTab({ members: initialMembers, locId, role, currentUserId }: {
  members: Member[]; locId: string; role: string; currentUserId: string;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [names, setNames] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "viewer">("viewer");
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [resending, setResending] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<{ email: string; link: string } | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const supabase = createClient();

  // Fetch display names once on mount
  useEffect(() => {
    const ids = initialMembers.map(m => m.user_id).join(",");
    if (!ids) return;
    fetch(`/api/profiles?ids=${ids}`)
      .then(r => r.json())
      .then(data => setNames(data))
      .catch(() => {});
  }, []);

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

  async function removeMember(memberId: string) {
    if (!window.confirm("Remove this member from the LOC?")) return;
    setRemoving(memberId);
    await supabase.from("loc_members").delete().eq("id", memberId);
    setMembers(ms => ms.filter(m => m.id !== memberId));
    setRemoving(null);
  }

  async function resendInvite(userId: string) {
    setResending(userId); setMessage(""); setError(""); setResetLink(null);
    const res = await fetch("/api/resend-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, locId }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Failed to resend"); }
    else if (json.link) { setResetLink({ email: json.email, link: json.link }); }
    else { setMessage(`Reset email sent to ${json.email}`); }
    setResending(null);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "var(--txt-hi)" }}>
          <Users className="h-4 w-4" /> Members
        </h3>
        {error && <p className="text-xs rounded-lg px-3 py-2 mb-3" style={{ background: "rgba(220,38,38,0.15)", color: "var(--red-t)" }}>{error}</p>}
        {message && <p className="text-xs rounded-lg px-3 py-2 mb-3" style={{ background: "rgba(5,150,105,0.15)", color: "var(--green-t)" }}>{message}</p>}
        {resetLink && (
          <div className="rounded-lg px-3 py-3 mb-3 space-y-2" style={{ background: "rgba(91,92,246,0.1)", border: "1px solid rgba(91,92,246,0.3)" }}>
            <p className="text-xs font-bold" style={{ color: "var(--accent-hi)" }}>
              Setup link for {resetLink.email} — copy and send manually:
            </p>
            <p className="text-xs break-all rounded px-2 py-1.5 select-all" style={{ background: "var(--surfB)", color: "var(--txt)", fontFamily: "monospace" }}>
              {resetLink.link}
            </p>
            <button
              onClick={() => { navigator.clipboard.writeText(resetLink.link); setMessage("Link copied!"); setResetLink(null); }}
              className="text-xs font-bold rounded-lg px-3 py-1.5 transition-opacity hover:opacity-80"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Copy Link
            </button>
          </div>
        )}
        <div className="space-y-2">
          {members.map((m, i) => (
            <div key={m.id} className="flex items-center justify-between py-2" style={{ borderTop: i > 0 ? "1px solid var(--bdr)" : "none" }}>
              <span className="text-sm" style={{ color: "var(--txt)" }}>
                {m.user_id === currentUserId
                  ? `You (${names[m.user_id] || "…"})`
                  : names[m.user_id] || m.user_id.slice(0, 8) + "…"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs rounded-full px-2 py-0.5 font-semibold" style={{
                  background: m.role === "owner" ? "rgba(91,92,246,0.15)" : "rgba(71,85,105,0.15)",
                  color: m.role === "owner" ? "var(--accent-hi)" : "var(--muted-hi)",
                }}>
                  {m.role}
                </span>
                {role === "owner" && m.user_id !== currentUserId && (
                  <>
                    <button
                      onClick={() => resendInvite(m.user_id)}
                      disabled={resending === m.user_id}
                      className="text-xs transition-opacity hover:opacity-70 disabled:opacity-30"
                      style={{ color: "var(--accent-hi)" }}
                    >
                      {resending === m.user_id ? "Sending…" : "Resend Link"}
                    </button>
                    <button
                      onClick={() => removeMember(m.id)}
                      disabled={removing === m.id}
                      className="text-xs transition-opacity hover:opacity-70 disabled:opacity-30"
                      style={{ color: "var(--red-t)" }}
                    >
                      {removing === m.id ? "…" : "Remove"}
                    </button>
                  </>
                )}
              </div>
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

// ─── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab({ loc }: { loc: Loc }) {
  const supabase = createClient();
  const [name, setName] = useState(loc.name);
  const [borrower, setBorrower] = useState(loc.borrower_name);
  const [lender, setLender] = useState(loc.lender_name);
  const [ceiling, setCeiling] = useState((loc.ceiling_cents / 100).toFixed(2));
  const [apr, setApr] = useState((loc.apr * 100).toFixed(2));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSaving(true); setSaved(false);
    const ceilingCents = Math.round(parseFloat(ceiling) * 100);
    const aprVal = parseFloat(apr) / 100;
    if (isNaN(ceilingCents) || ceilingCents <= 0) { setError("Enter a valid ceiling amount."); setSaving(false); return; }
    if (isNaN(aprVal) || aprVal < 0 || aprVal > 2) { setError("APR must be between 0% and 200%."); setSaving(false); return; }
    if (!name.trim()) { setError("LOC name cannot be empty."); setSaving(false); return; }
    const { error: err } = await supabase.from("locs").update({
      name: name.trim(),
      borrower_name: borrower.trim(),
      lender_name: lender.trim(),
      ceiling_cents: ceilingCents,
      apr: aprVal,
    }).eq("id", loc.id);
    if (err) { setError(err.message); } else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: "var(--txt-hi)" }}>LOC Settings</h3>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: "var(--muted-hi)" }}>LOC Name</label>
            <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="e.g. Business Line of Credit" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: "var(--muted-hi)" }}>Borrower</label>
              <input value={borrower} onChange={e => setBorrower(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: "var(--muted-hi)" }}>Lender</label>
              <input value={lender} onChange={e => setLender(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: "var(--muted-hi)" }}>Credit Ceiling ($)</label>
              <input type="number" step="0.01" min="1" value={ceiling} onChange={e => setCeiling(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: "var(--muted-hi)" }}>APR (%)</label>
              <input type="number" step="0.01" min="0" max="200" value={apr} onChange={e => setApr(e.target.value)} style={inputStyle} />
            </div>
          </div>
          {error && <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(220,38,38,0.15)", color: "var(--red-t)" }}>{error}</p>}
          {saved && <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(5,150,105,0.15)", color: "var(--green-t)" }}>✓ Changes saved successfully.</p>}
          <button type="submit" disabled={saving}
            className="w-full rounded-lg py-2.5 text-sm font-bold transition-opacity disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#fff" }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
