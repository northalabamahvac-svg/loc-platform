import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { token, tier } = await request.json();
  if (!token || !tier) {
    return NextResponse.json({ error: "Missing token or tier" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("cf_estimates")
    .update({ accepted_tier: tier, status: "accepted" })
    .eq("token", token);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
