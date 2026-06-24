import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MembershipsClient from "./memberships-client";

export default async function MembershipsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("cf_memberships")
    .select("*")
    .eq("owner_id", user.id)
    .order("renewal_date", { ascending: true });

  return <MembershipsClient initialMemberships={memberships ?? []} userId={user.id} />;
}
