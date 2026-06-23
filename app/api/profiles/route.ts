import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/profiles?ids=uuid1,uuid2 — returns display names for given user IDs
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ids = req.nextUrl.searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
  if (ids.length === 0) return NextResponse.json({});

  const admin = createServiceClient();
  const names: Record<string, string> = {};

  await Promise.all(ids.map(async (id) => {
    const { data } = await admin.auth.admin.getUserById(id);
    if (data?.user) {
      names[id] = data.user.user_metadata?.display_name || data.user.email || id.slice(0, 8);
    }
  }));

  return NextResponse.json(names);
}
