import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DispatchClient from "./dispatch-client";

export default async function DispatchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();

  const now = new Date();
  // Fetch current week + next 2 weeks
  const dayOfWeek = now.getDay();
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now); weekStart.setDate(now.getDate() + diffToMon); weekStart.setHours(0,0,0,0);
  const rangeEnd = new Date(weekStart); rangeEnd.setDate(weekStart.getDate() + 20);

  const [
    { data: schedule },
    { data: projects },
    { data: members },
  ] = await Promise.all([
    service.from("cf_schedule").select("*")
      .gte("scheduled_date", weekStart.toISOString().slice(0, 10))
      .lte("scheduled_date", rangeEnd.toISOString().slice(0, 10))
      .order("scheduled_date"),
    service.from("cf_projects").select("id, name").order("name"),
    service.from("cf_project_members").select("user_id").order("user_id"),
  ]);

  const uniqueUserIds = [...new Set((members ?? []).map((m: { user_id: string }) => m.user_id))];

  return (
    <div style={{ minHeight: "100vh", background: "#f3f7fa" }}>
      <div style={{ padding: "28px 16px 80px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a2a38", margin: "0 0 4px" }}>📅 Dispatch Board</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Schedule and assign jobs to your team</p>
        </div>
        <DispatchClient
          initialSchedule={schedule ?? []}
          projects={projects ?? []}
          techIds={uniqueUserIds}
          weekStartDate={weekStart.toISOString().slice(0, 10)}
        />
      </div>
    </div>
  );
}
