import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as any;

  if (token_hash && type) {
    const supabase = await createClient();
    await supabase.auth.verifyOtp({ token_hash, type });
  }

  return NextResponse.redirect(new URL("/dashboard", req.url));
}
