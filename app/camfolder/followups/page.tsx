import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FollowupsClient from "./followups-client";

export default async function FollowupsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: rules }, { data: queue }] = await Promise.all([
    supabase.from("cf_followup_rules").select("*").eq("owner_id", user.id).order("created_at"),
    supabase.from("cf_followup_queue").select("*, cf_followup_rules(trigger), cf_projects(name)").eq("cf_followup_rules.owner_id", user.id).order("scheduled_at", { ascending: false }).limit(100),
  ]);

  return (
    <FollowupsClient
      initialRules={rules ?? []}
      initialQueue={queue ?? []}
      userId={user.id}
    />
  );
}
