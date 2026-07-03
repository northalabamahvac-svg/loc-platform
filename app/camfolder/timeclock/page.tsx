export const dynamic = "force-dynamic";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TimeclockClient from "./timeclock-client";

export default async function TimeclockPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const svc = createServiceClient();

  // Get all projects the user owns
  const { data: memberships } = await svc
    .from("cf_project_members")
    .select("project_id, cf_projects(id, name, address, status)")
    .eq("user_id", user.id)
    .eq("role", "owner") as any;

  const projects = (memberships ?? []).map((m: any) => m.cf_projects).filter(Boolean);
  const projectIds = projects.map((p: any) => p.id);

  // Get all timeclock records for those projects
  const { data: records } = projectIds.length > 0
    ? await svc
        .from("cf_timeclock")
        .select("*")
        .in("project_id", projectIds)
        .order("clock_in_at", { ascending: false })
        .limit(500)
    : { data: [] };

  // Get display names for users who have punched
  const userIds = [...new Set((records ?? []).map((r: any) => r.user_id))];
  const { data: { users: authUsers } } = userIds.length > 0
    ? await svc.auth.admin.listUsers({ perPage: 1000 })
    : { data: { users: [] } };

  const userMap: Record<string, string> = {};
  (authUsers ?? []).forEach((u: any) => {
    userMap[u.id] = u.user_metadata?.display_name ?? u.email?.split("@")[0] ?? u.id.slice(0, 8);
  });

  return (
    <TimeclockClient
      projects={projects}
      records={records ?? []}
      userMap={userMap}
      currentUserId={user.id}
    />
  );
}
