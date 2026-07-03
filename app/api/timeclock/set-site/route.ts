import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { project_id, lat, lng, radius_m } = await request.json();
  if (!project_id || lat == null || lng == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Only owners can set site location
  const { data: membership } = await supabase
    .from("cf_project_members")
    .select("role")
    .eq("project_id", project_id)
    .eq("user_id", user.id)
    .single();
  if (membership?.role !== "owner") {
    return NextResponse.json({ error: "Only owners can set site location" }, { status: 403 });
  }

  const { error } = await supabase
    .from("cf_projects")
    .update({ site_lat: lat, site_lng: lng, site_radius_m: radius_m ?? 150 })
    .eq("id", project_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
