import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date().toISOString();

  // Find all pending queue items that are due
  const { data: pending, error } = await supabase
    .from("cf_followup_queue")
    .select("id")
    .eq("status", "pending")
    .lte("scheduled_at", now);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!pending || pending.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  const ids = pending.map((item: { id: string }) => item.id);

  // Mark as sent (in production this would trigger actual email sending via Resend etc.)
  const { error: updateError } = await supabase
    .from("cf_followup_queue")
    .update({ status: "sent", sent_at: now })
    .in("id", ids);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ processed: ids.length });
}
