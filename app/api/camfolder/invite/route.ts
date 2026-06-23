import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, role, projectId } = await req.json();
  if (!email || !role || !projectId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (!["staff", "viewer"].includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify caller is owner of this project
  const { data: membership } = await supabase
    .from("cf_project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .single();
  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: "Only owners can invite members" }, { status: 403 });
  }

  const admin = await createServiceClient();

  // Look up user by email
  const { data: userList } = await admin.auth.admin.listUsers();
  const target = userList?.users?.find((u: any) => u.email === email.toLowerCase().trim());

  if (target) {
    // User already exists — add/update membership and generate a login link for them
    const { error } = await admin.from("cf_project_members").upsert(
      { project_id: projectId, user_id: target.id, role },
      { onConflict: "project_id,user_id" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: target.email!,
      options: { redirectTo: `${siteUrl}/auth/set-password` },
    });
    const link = (linkData as any)?.properties?.action_link ?? null;
    return NextResponse.json({ ok: true, existing: true, link });
  }

  // User doesn't exist — generate invite link
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email: email.trim(),
    options: { redirectTo: `${siteUrl}/auth/set-password` },
  });
  if (error || !data) return NextResponse.json({ error: error?.message ?? "Failed to generate invite" }, { status: 500 });

  // Pre-insert pending membership — user_id from the generated link's user
  const newUserId = (data as any).user?.id ?? (data as any).properties?.user_id;
  if (newUserId) {
    await admin.from("cf_project_members").upsert(
      { project_id: projectId, user_id: newUserId, role },
      { onConflict: "project_id,user_id" }
    );
  }

  return NextResponse.json({ ok: true, existing: false, link: (data as any).properties?.action_link });
}
