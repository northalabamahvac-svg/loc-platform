import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { calcLoc } from "@/lib/calc";
import { Plus, TrendingUp } from "lucide-react";
import SignOutButton from "@/components/sign-out-button";

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get all LOCs the user is a member of, including their role
  const { data: memberships } = await supabase
    .from("loc_members")
    .select("role, locs(id, name, borrower_name, lender_name, ceiling_cents, apr, start_date)")
    .eq("user_id", user.id) as any;

  // For each LOC, fetch transactions and compute balance
  const locData = await Promise.all(
    (memberships ?? []).map(async (m: any) => {
      const loc = m.locs;
      const { data: txs } = await supabase
        .from("transactions")
        .select("id, type, amount_cents, date, note")
        .eq("loc_id", loc.id)
        .order("date") as any;
      const result = calcLoc(txs ?? [], loc.apr);
      return { loc, role: m.role, result };
    })
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">LOC Platform</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{user.email}</span>
          <SignOutButton />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Lines of Credit</h2>
          <Link
            href="/locs/new"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> New LOC
          </Link>
        </div>

        {locData.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <TrendingUp className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No lines of credit yet.</p>
            <Link href="/locs/new" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
              Create your first LOC
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {locData.map(({ loc, role, result }) => (
              <Link
                key={loc.id}
                href={`/locs/${loc.id}`}
                className="block bg-white rounded-2xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{loc.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{loc.borrower_name} · {loc.lender_name}</p>
                  </div>
                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                    role === "owner" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {role}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Balance owed</span>
                    <span className="font-semibold text-gray-900">{fmt(result.totalOwed)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Principal</span>
                    <span className="text-gray-700">{fmt(result.principal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Accrued interest</span>
                    <span className="text-gray-700">{fmt(result.accruedInterest)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Daily interest</span>
                    <span className="text-gray-700">{fmt(result.dailyInterest)}/day</span>
                  </div>
                  <div className="mt-2 pt-2 border-t flex justify-between text-xs text-gray-400">
                    <span>Ceiling: {fmt(loc.ceiling_cents)}</span>
                    <span>APR: {(loc.apr * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
