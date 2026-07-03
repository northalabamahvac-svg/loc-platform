import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(request: Request) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { project_id, type, gps_lat, gps_lng } = await request.json();
  if (!project_id || !type) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const supabase = createServiceClient();

  // Verify membership
  const { data: membership } = await supabase
    .from("cf_project_members")
    .select("role")
    .eq("project_id", project_id)
    .eq("user_id", user.id)
    .single();
  if (!membership) return NextResponse.json({ error: "Not a member of this project" }, { status: 403 });

  // Get project site coordinates
  const { data: project } = await supabase
    .from("cf_projects")
    .select("site_lat, site_lng, site_radius_m")
    .eq("id", project_id)
    .single();

  // Calculate GPS distance and verification
  let distance_m: number | null = null;
  let verified = type === "nfc";
  if (!verified && gps_lat != null && gps_lng != null && project?.site_lat && project?.site_lng) {
    distance_m = Math.round(haversineMeters(gps_lat, gps_lng, project.site_lat, project.site_lng));
    verified = distance_m <= (project.site_radius_m ?? 150);
  }

  // Check for open shift
  const { data: openShift } = await supabase
    .from("cf_timeclock")
    .select("id, clock_in_at")
    .eq("project_id", project_id)
    .eq("user_id", user.id)
    .is("clock_out_at", null)
    .order("clock_in_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openShift) {
    const { data: record, error } = await supabase
      .from("cf_timeclock")
      .update({
        clock_out_at: new Date().toISOString(),
        clock_out_type: type,
        clock_out_lat: gps_lat ?? null,
        clock_out_lng: gps_lng ?? null,
      })
      .eq("id", openShift.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ action: "out", record });
  } else {
    const { data: record, error } = await supabase
      .from("cf_timeclock")
      .insert({
        project_id,
        user_id: user.id,
        clock_in_type: type,
        clock_in_lat: gps_lat ?? null,
        clock_in_lng: gps_lng ?? null,
        clock_in_verified: verified,
        clock_in_distance_m: distance_m,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ action: "in", record, verified, distance_m });
  }
}
