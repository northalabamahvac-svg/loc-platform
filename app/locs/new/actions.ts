"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createLoc(formData: {
  name: string;
  borrower_name: string;
  lender_name: string;
  ceiling_cents: number;
  apr: number;
  start_date: string;
  notes: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase.rpc("create_loc_for_user", {
    p_name: formData.name,
    p_borrower_name: formData.borrower_name,
    p_lender_name: formData.lender_name,
    p_ceiling_cents: formData.ceiling_cents,
    p_apr: formData.apr,
    p_start_date: formData.start_date,
    p_notes: formData.notes,
  }) as any;

  if (error) throw new Error(error.message);

  redirect(`/locs/${data}`);
}
