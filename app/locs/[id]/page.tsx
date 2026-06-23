import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { calcLoc } from "@/lib/calc";
import LocDashboard from "./loc-dashboard";

export default async function LocPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("loc_members")
    .select("role")
    .eq("loc_id", id)
    .eq("user_id", user.id)
    .single() as any;

  if (!membership) notFound();

  const { data: loc } = await supabase
    .from("locs")
    .select("*")
    .eq("id", id)
    .single() as any;

  if (!loc) notFound();

  const { data: txs } = await supabase
    .from("transactions")
    .select("id, type, amount_cents, date, note")
    .eq("loc_id", id)
    .order("date", { ascending: false }) as any;

  const { data: members } = await supabase
    .from("loc_members")
    .select("id, role, user_id")
    .eq("loc_id", id) as any;

  const result = calcLoc(
    (txs ?? []).map((t: any) => ({ ...t, date: t.date })),
    loc.apr
  );

  return (
    <div className="min-h-screen">
      <header className="px-4 py-3 flex items-center gap-3" style={{
        background: "rgba(15,15,30,0.85)",
        borderBottom: "1px solid var(--bdr)",
        backdropFilter: "blur(8px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <Link href="/dashboard" style={{ color: "var(--muted-hi)" }} className="hover:opacity-80 flex-shrink-0">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold truncate" style={{ color: "var(--txt-hi)" }}>{loc.name}</h1>
          <p className="text-xs" style={{ color: "var(--muted)" }}>{loc.lender_name} → {loc.borrower_name}</p>
        </div>
        <span className="text-xs rounded-full px-2 py-0.5 font-semibold flex-shrink-0" style={{
          background: membership.role === "owner" ? "rgba(91,92,246,0.15)" : "rgba(71,85,105,0.15)",
          color: membership.role === "owner" ? "var(--accent-hi)" : "var(--muted-hi)",
        }}>
          {membership.role}
        </span>
      </header>

      <LocDashboard
        loc={loc}
        transactions={txs ?? []}
        result={result}
        role={membership.role}
        members={members ?? []}
        userId={user.id}
      />
    </div>
  );
}
