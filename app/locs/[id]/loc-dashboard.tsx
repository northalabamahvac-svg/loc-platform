"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { CalcResult, Transaction } from "@/lib/calc";
import { calcLoc } from "@/lib/calc";
import { Plus, Minus, Users, History, TrendingDown } from "lucide-react";

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

type Tab = "overview" | "history" | "members";

export default function LocDashboard({ loc, transactions, result: initialResult, role, members, userId }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [txs, setTxs] = useState(transactions);
  const [result, setResult] = useState(initialResult);
  const supabase = createClient();
  const router = useRouter();

  function refreshCalc(newTxs: Transaction[]) {
    setTxs(newTxs);
    setResult(calcLoc(newTxs, loc.apr));
  }

  const usedPct = Math.min(100, (result.principal / loc.ceiling_cents) * 100);
  const available = Math.max(0, loc.ceiling_cents - result.principal);

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      {/* Balance card */}
      <div className="bg-blue-600 rounded-2xl p-5 text-white">
        <p className="text-blue-200 text-xs font-medium mb-1">Total Owed</p>
        <p className="text-4xl font-bold tracking-tight">{fmt(result.totalOwed)}</p>
        <div className="flex gap-6 mt-3 text-sm">
          <div>
            <p className="text-blue-200 text-xs">Principal</p>
            <p className="font-semibold">{fmt(result.principal)}</p>
          </div>
          <div>
            <p className="text-blue-200 text-xs">Accrued Interest</p>
            <p className="font-semibold">{fmt(result.accruedInterest)}</p>
          </div>
          <div>
            <p className="text-blue-200 text-xs">Daily Interest</p>
            <p className="font-semibold">{fmt(result.dailyInterest)}/day</p>
          </div>
        </div>
        {/* Utilization bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-blue-200 mb-1">
            <span>{fmt(result.principal)} used</span>
            <span>{fmt(available)} available</span>
          </div>
          <div className="h-2 bg-blue-500 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${usedPct}%` }} />
          </div>
          <p className="text-xs text-blue-200 mt-1">{fmt(loc.ceiling_cents)} ceiling · {(loc.apr * 100).toFixed(1)}% APR</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {(["overview", "history", "members"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors ${
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <OverviewTab
          loc={loc}
          result={result}
          txs={txs}
          role={role}
          onRefresh={refreshCalc}
        />
      )}
      {tab === "history" && <HistoryTab txs={txs} role={role} locId={loc.id} onRefresh={refreshCalc} apr={loc.apr} />}
      {tab === "members" && <MembersTab members={members} locId={loc.id} role={role} currentUserId={userId} />}
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
    const newTxs = [...txs, data[0]];
    onRefresh(newTxs);
    setAmount(""); setNote(""); setMode(null); setLoading(false);
  }

  return (
    <div className="space-y-4">
      {/* Payoff projection */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
          <TrendingDown className="h-3.5 w-3.5" /> Payoff at {fmt(result.dailyInterest * 2)}/day (2× daily interest)
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
            <p className="text-sm text-gray-700">
              {payoffDate ? `Payoff by ${payoffDate} (${daysToPayoff} days)` : "Increase payment to cover interest"}
            </p>
          );
        })() : <p className="text-sm text-gray-500">No outstanding balance.</p>}
      </div>

      {role === "owner" && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode(mode === "draw" ? null : "draw")}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors ${
              mode === "draw" ? "bg-orange-600 text-white" : "bg-orange-50 text-orange-700 border border-orange-200"
            }`}
          >
            <Plus className="h-4 w-4" /> Add Draw
          </button>
          <button
            onClick={() => setMode(mode === "payment" ? null : "payment")}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors ${
              mode === "payment" ? "bg-green-600 text-white" : "bg-green-50 text-green-700 border border-green-200"
            }`}
          >
            <Minus className="h-4 w-4" /> Add Payment
          </button>
        </div>
      )}

      {mode && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 capitalize">{mode === "draw" ? "New Draw" : "Record Payment"}</h3>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Note (optional)</label>
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="What is this for?"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-colors ${
                mode === "draw" ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loading ? "Saving…" : mode === "draw" ? "Record draw" : "Record payment"}
            </button>
          </form>
        </div>
      )}

      {/* Recent activity */}
      {recent.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <p className="text-xs font-semibold text-gray-500 px-4 pt-4 pb-2">Recent Activity</p>
          <div className="divide-y divide-gray-100">
            {recent.map(tx => (
              <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {tx.type === "draw" ? "Draw" : "Payment"}
                    {tx.note && <span className="text-gray-400 font-normal"> · {tx.note}</span>}
                  </p>
                  <p className="text-xs text-gray-400">{new Date(tx.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
                <span className={`text-sm font-semibold tabular-nums ${tx.type === "draw" ? "text-orange-600" : "text-green-600"}`}>
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
    const newTxs = txs.filter(t => t.id !== id);
    onRefresh(newTxs);
    setDeleting(null);
  }

  if (sorted.length === 0) {
    return <p className="text-center text-sm text-gray-400 py-12">No transactions yet.</p>;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="divide-y divide-gray-100">
        {sorted.map(tx => (
          <div key={tx.id} className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 capitalize">
                {tx.type}
                {tx.note && <span className="text-gray-400 font-normal"> · {tx.note}</span>}
              </p>
              <p className="text-xs text-gray-400">{new Date(tx.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
            </div>
            <span className={`text-sm font-semibold tabular-nums flex-shrink-0 ${tx.type === "draw" ? "text-orange-600" : "text-green-600"}`}>
              {tx.type === "draw" ? "+" : "−"}{fmt(tx.amount_cents)}
            </span>
            {role === "owner" && (
              <button
                onClick={() => deleteTx(tx.id)}
                disabled={deleting === tx.id}
                className="text-xs text-red-400 hover:text-red-600 flex-shrink-0 disabled:opacity-40"
              >
                {deleting === tx.id ? "…" : "Delete"}
              </button>
            )}
          </div>
        ))}
      </div>
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
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Users className="h-4 w-4" /> Members
        </h3>
        <div className="space-y-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between py-1">
              <span className="text-sm text-gray-700">
                {m.user_id === currentUserId ? "You" : m.user_id.slice(0, 8) + "…"}
              </span>
              <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                m.role === "owner" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
              }`}>
                {m.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {role === "owner" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Invite someone</h3>
          <form onSubmit={invite} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="their@email.com"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              {(["viewer", "owner"] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setInviteRole(r)}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors ${
                    inviteRole === r ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            {message && <p className="text-xs text-green-600">{message}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Sending…" : "Send invite"}
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-2">
            They'll get an email to create their account and will automatically have access to this LOC.
          </p>
        </div>
      )}
    </div>
  );
}
