import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as any;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error && type === "invite") {
      return NextResponse.redirect(new URL("/auth/set-password", siteUrl));
    }
    if (!error) {
      return NextResponse.redirect(new URL("/dashboard", siteUrl));
    }
  }

  // Supabase may also redirect with hash tokens — send to set-password to handle
  if (type === "invite" || url.searchParams.get("type") === "invite") {
    return NextResponse.redirect(new URL("/auth/set-password", siteUrl));
  }

  return NextResponse.redirect(new URL("/login?error=invalid_link", siteUrl));
}
