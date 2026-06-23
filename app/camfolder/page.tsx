import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ProjectListClient from "./project-list-client";

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

  // Fetch recent photos for all projects (up to 6 per project)
  const projectIds = projects.map((p: any) => p.id);
  let photosByProject: Record<string, { url: string }[]> = {};
  let countByProject: Record<string, number> = {};

  if (projectIds.length > 0) {
    const { data: photos } = await supabase
      .from("cf_photos")
      .select("project_id, storage_url")
      .in("project_id", projectIds)
      .order("taken_at", { ascending: false })
      .limit(120) as any;

    (photos ?? []).forEach((p: any) => {
      if (!photosByProject[p.project_id]) { photosByProject[p.project_id] = []; countByProject[p.project_id] = 0; }
      countByProject[p.project_id]++;
      if (photosByProject[p.project_id].length < 6) photosByProject[p.project_id].push({ url: p.storage_url });
    });
  }

  const enriched = projects.map((p: any) => ({
    ...p,
    photos: photosByProject[p.id] ?? [],
    photoCount: countByProject[p.id] ?? 0,
  }));

  return <ProjectListClient projects={enriched} />;
}
