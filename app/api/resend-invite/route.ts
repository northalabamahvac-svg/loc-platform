import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, locId } = await req.json();
  if (!userId || !locId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Verify caller is an owner of this LOC
  const { data: membership } = await supabase
    .from("loc_members")
    .select("role")
    .eq("loc_id", locId)
    .eq("user_id", user.id)
    .single() as any;

  if (membership?.role !== "owner") {
    return NextResponse.json({ error: "Only owners can resend invites" }, { status: 403 });
  }

  const admin = createServiceClient();

  // Look up the target user's email
  const { data: target, error: lookupErr } = await admin.auth.admin.getUserById(userId);
  if (lookupErr || !target?.user?.email) {
    return NextResponse.json({ error: "Could not find user" }, { status: 404 });
  }

  const email = target.user.email;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Generate a recovery link — this sends the email AND redirects to set-password
  const { error: resetErr } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${siteUrl}/auth/set-password` },
  });

  if (resetErr) return NextResponse.json({ error: resetErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, email });
}
