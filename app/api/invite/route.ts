import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, role, locId } = await req.json();
  if (!email || !role || !locId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Verify the caller is an owner of this LOC
  const { data: membership } = await supabase
    .from("loc_members")
    .select("role")
    .eq("loc_id", locId)
    .eq("user_id", user.id)
    .single() as any;

  if (membership?.role !== "owner") {
    return NextResponse.json({ error: "Only owners can invite" }, { status: 403 });
  }

  const admin = createServiceClient();

  // Check if user already exists
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const existing = existingUsers?.users?.find((u: any) => u.email === email);

  if (existing) {
    // Add them to the LOC directly
    const { error } = await admin
      .from("loc_members")
      .upsert({ loc_id: locId, user_id: existing.id, role }, { onConflict: "loc_id,user_id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, existing: true });
  }

  // Invite new user — they get an email to set their password
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/set-password`,
    data: { pending_loc_id: locId, pending_role: role },
  });

  if (inviteErr) return NextResponse.json({ error: inviteErr.message }, { status: 500 });

  // Pre-create the membership so it's ready when they accept
  if (invited?.user?.id) {
    await admin
      .from("loc_members")
      .upsert({ loc_id: locId, user_id: invited.user.id, role }, { onConflict: "loc_id,user_id" });
  }

  return NextResponse.json({ ok: true });
}
