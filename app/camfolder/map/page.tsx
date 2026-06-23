import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import MapClient from "./map-client";

export default async function MapPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("cf_project_members")
    .select("role, cf_projects(*)")
    .eq("user_id", user.id) as any;

  const projects = (memberships ?? [])
    .map((m: any) => ({ ...m.cf_projects, myRole: m.role }))
    .filter((p: any) => p.status !== "archived");

  // Grab most recent GPS-tagged photo per project for map pin location
  const projectsWithGPS = await Promise.all(projects.map(async (p: any) => {
    const { data: photo } = await supabase
      .from("cf_photos").select("gps_lat,gps_lng")
      .eq("project_id", p.id).not("gps_lat", "is", null)
      .order("taken_at", { ascending: false }).limit(1).single();
    return { ...p, lat: (photo as any)?.gps_lat ?? null, lng: (photo as any)?.gps_lng ?? null };
  }));

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="px-4 py-3 flex items-center gap-3" style={{
        background: "rgba(15,15,30,0.95)", borderBottom: "1px solid var(--bdr)",
        backdropFilter: "blur(8px)", zIndex: 10, flexShrink: 0,
      }}>
        <Link href="/camfolder" className="text-xs font-semibold hover:opacity-70" style={{ color: "var(--muted-hi)" }}>← Projects</Link>
        <div style={{ width: 1, height: 16, background: "var(--bdr)" }} />
        <h1 className="text-sm font-bold" style={{ color: "var(--txt-hi)" }}>📍 Live Map</h1>
        <span className="text-xs ml-auto" style={{ color: "var(--muted)" }}>{projects.length} active project{projects.length !== 1 ? "s" : ""}</span>
      </header>
      <MapClient projects={projectsWithGPS} />
    </div>
  );
}
