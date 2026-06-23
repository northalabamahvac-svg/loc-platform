import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProjectDashboard from "./project-dashboard";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("cf_project_members")
    .select("role, cf_projects(*)")
    .eq("project_id", id)
    .eq("user_id", user.id)
    .single() as any;
  if (!membership) redirect("/camfolder");

  const project = membership.cf_projects;
  const role: "owner" | "staff" | "viewer" = membership.role;

  const [{ data: photos }, { data: logs }] = await Promise.all([
    supabase.from("cf_photos").select("*").eq("project_id", id).order("taken_at", { ascending: false }),
    supabase.from("cf_daily_logs").select("*").eq("project_id", id).order("log_date", { ascending: false }),
  ]);

  return (
    <ProjectDashboard
      project={project}
      initialPhotos={(photos ?? []) as any}
      initialLogs={(logs ?? []) as any}
      userId={user.id}
      role={role}
    />
  );
}
