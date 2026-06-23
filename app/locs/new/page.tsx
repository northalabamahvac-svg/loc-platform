import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NewLocForm from "./new-loc-form";

export default async function NewLocPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return (
    <div className="min-h-screen flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--txt-hi)" }}>New Line of Credit</h1>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Set up a new LOC agreement</p>
        <NewLocForm userId={user.id} />
      </div>
    </div>
  );
}
