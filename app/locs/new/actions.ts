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

  const { data: loc, error } = await supabase
    .from("locs")
    .insert(formData)
    .select()
    .single() as any;

  if (error) throw new Error(error.message);

  await supabase.from("loc_members").insert({
    loc_id: loc.id,
    user_id: user.id,
    role: "owner",
  });

  redirect(`/locs/${loc.id}`);
}
