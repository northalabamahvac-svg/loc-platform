import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import SignOutButton from "@/components/sign-out-button";
import ThemePicker from "@/components/theme-picker";

const STATUS_COLORS: Record<string, string> = {
  active: "rgba(5,150,105,0.15)",
  completed: "rgba(91,92,246,0.15)",
  archived: "rgba(71,85,105,0.15)",
};
const STATUS_TEXT: Record<string, string> = {
  active: "var(--green-t)",
  completed: "var(--accent-hi)",
  archived: "var(--muted-hi)",
};

export default async function CamFolderPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("cf_project_members")
    .select("role, cf_projects(*)")
    .eq("user_id", user.id) as any;

  const projects = (memberships ?? [])
    .map((m: any) => ({ ...m.cf_projects, myRole: m.role }))
    .sort((a: any, b: any) => b.created_at.localeCompare(a.created_at));

  return (
    <div className="min-h-screen">
      <header className="px-6 py-4 flex items-center justify-between" style={{
        background: "rgba(15,15,30,0.85)",
        borderBottom: "1px solid var(--bdr)",
        backdropFilter: "blur(8px)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-xs font-semibold hover:opacity-70 transition-opacity" style={{ color: "var(--muted-hi)" }}>
            ← Dashboard
          </Link>
          <div style={{ width: 1, height: 16, background: "var(--bdr)" }} />
          <div>
            <p className="text-xs font-bold tracking-[0.12em] uppercase" style={{ color: "var(--muted)" }}>Blossomwood Building</p>
            <h1 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--txt-hi)" }}>
              📷 CamFolder
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemePicker />
          <Link href="/profile" className="text-xs font-semibold rounded-lg px-3 py-1.5 transition-opacity hover:opacity-70"
            style={{ color: "var(--muted-hi)", border: "1px solid var(--bdr)", background: "var(--surfB)" }}>
            Profile
          </Link>
          <SignOutButton />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--txt-hi)" }}>Job Site Projects</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Photo documentation, AI daily logs, and field reports</p>
          </div>
          <Link href="/camfolder/new"
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-opacity hover:opacity-80"
            style={{ background: "var(--accent)", color: "#fff" }}>
            + New Project
          </Link>
        </div>

        {(!projects || projects.length === 0) ? (
          <div className="rounded-2xl p-16 text-center" style={{ border: "2px dashed var(--bdr)", background: "var(--surf)" }}>
            <p className="text-4xl mb-4">📷</p>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--txt)" }}>No projects yet</p>
            <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Create your first job site project to start documenting</p>
            <Link href="/camfolder/new" className="text-sm font-semibold hover:opacity-80" style={{ color: "var(--accent)" }}>
              Create first project →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((p: any) => (
              <Link key={p.id} href={`/camfolder/${p.id}`}
                className="block rounded-2xl p-5 transition-all hover:opacity-90"
                style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-3">
                    <h3 className="font-bold truncate" style={{ color: "var(--txt-hi)" }}>{p.name}</h3>
                    {p.address && <p className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>📍 {p.address}</p>}
                    {p.trade && <p className="text-xs mt-0.5" style={{ color: "var(--muted-hi)" }}>{p.trade}</p>}
                  </div>
                  <span className="text-xs rounded-full px-2 py-0.5 font-semibold capitalize flex-shrink-0" style={{
                    background: STATUS_COLORS[p.status] ?? STATUS_COLORS.active,
                    color: STATUS_TEXT[p.status] ?? STATUS_TEXT.active,
                  }}>
                    {p.status}
                  </span>
                </div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  Created {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
