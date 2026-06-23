import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { calcLoc } from "@/lib/calc";
import SignOutButton from "@/components/sign-out-button";
import ThemePicker from "@/components/theme-picker";

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("loc_members")
    .select("role, locs(id, name, borrower_name, lender_name, ceiling_cents, apr, start_date)")
    .eq("user_id", user.id) as any;

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
    <div className="min-h-screen">
      <header className="px-6 py-4 flex items-center justify-between" style={{
        background: "rgba(15,15,30,0.85)",
        borderBottom: "1px solid var(--bdr)",
        backdropFilter: "blur(8px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div>
          <p className="text-xs font-bold tracking-[0.12em] uppercase" style={{ color: "var(--muted)" }}>
            Blossomwood Building
          </p>
          <h1 className="text-base font-bold" style={{ color: "var(--txt-hi)" }}>LOC Platform</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs hidden sm:block" style={{ color: "var(--muted)" }}>{user.email}</span>
          <ThemePicker />
          <Link
            href="/profile"
            className="text-xs font-semibold rounded-lg px-3 py-1.5 transition-opacity hover:opacity-70"
            style={{ color: "var(--muted-hi)", border: "1px solid var(--bdr)", background: "var(--surfB)" }}
          >
            Profile
          </Link>
          <SignOutButton />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* CamFolder shortcut */}
        <Link href="/camfolder" className="flex items-center gap-4 rounded-2xl p-4 mb-6 transition-all hover:opacity-90"
          style={{ background: "var(--surf)", border: "1px solid var(--bdr)", textDecoration: "none" }}>
          <div className="flex items-center justify-center rounded-xl text-2xl" style={{ width: 48, height: 48, background: "rgba(91,92,246,0.15)", flexShrink: 0 }}>
            📷
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: "var(--txt-hi)" }}>CamFolder</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Job site photos, AI daily logs &amp; field reports</p>
          </div>
          <span className="text-sm font-bold flex-shrink-0" style={{ color: "var(--accent-hi)" }}>Open →</span>
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: "var(--txt-hi)" }}>Lines of Credit</h2>
          <Link
            href="/locs/new"
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-opacity hover:opacity-80"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            + New LOC
          </Link>
        </div>

        {locData.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{
            border: "2px dashed var(--bdr)",
            background: "var(--surf)",
          }}>
            <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>No lines of credit yet.</p>
            <Link href="/locs/new" className="text-sm font-semibold hover:opacity-80" style={{ color: "var(--accent)" }}>
              Create your first LOC →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {locData.map(({ loc, role, result }) => {
              const usedPct = Math.min(100, (result.principal / loc.ceiling_cents) * 100);
              return (
                <Link
                  key={loc.id}
                  href={`/locs/${loc.id}`}
                  className="block rounded-2xl p-5 transition-all hover:opacity-90"
                  style={{
                    background: "var(--surf)",
                    border: "1px solid var(--bdr)",
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold" style={{ color: "var(--txt-hi)" }}>{loc.name}</h3>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                        {loc.lender_name} → {loc.borrower_name}
                      </p>
                    </div>
                    <span className="text-xs rounded-full px-2 py-0.5 font-semibold" style={{
                      background: role === "owner" ? "rgba(91,92,246,0.15)" : "rgba(71,85,105,0.15)",
                      color: role === "owner" ? "var(--accent-hi)" : "var(--muted-hi)",
                    }}>
                      {role}
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "var(--muted)" }}>Total owed</span>
                      <span className="font-bold mono" style={{ color: "var(--red-t)" }}>{fmt(result.totalOwed)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "var(--muted)" }}>Principal</span>
                      <span className="mono" style={{ color: "var(--txt)" }}>{fmt(result.principal)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "var(--muted)" }}>Interest</span>
                      <span className="mono" style={{ color: "var(--amber-t)" }}>{fmt(result.accruedInterest)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "var(--muted)" }}>Daily interest</span>
                      <span className="mono" style={{ color: "var(--muted-hi)" }}>{fmt(result.dailyInterest)}/day</span>
                    </div>
                  </div>

                  {/* Utilization bar */}
                  <div>
                    <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "var(--bdr)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${usedPct}%`, background: "var(--accent)" }}
                      />
                    </div>
                    <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
                      <span>{usedPct.toFixed(0)}% used</span>
                      <span>{fmt(loc.ceiling_cents)} ceiling</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
