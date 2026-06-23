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

  // Get membership (also confirms access)
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

  // Get all members (owners only)
  const { data: members } = await supabase
    .from("loc_members")
    .select("id, role, user_id")
    .eq("loc_id", id) as any;

  const result = calcLoc(
    (txs ?? []).map((t: any) => ({ ...t, date: t.date })),
    loc.apr
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-700">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900 truncate">{loc.name}</h1>
          <p className="text-xs text-gray-400">{loc.lender_name} → {loc.borrower_name}</p>
        </div>
        <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
          membership.role === "owner" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
        }`}>
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
