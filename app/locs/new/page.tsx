import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NewLocForm from "./new-loc-form";

export default async function NewLocPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">New Line of Credit</h1>
        <NewLocForm userId={user.id} />
      </div>
    </div>
  );
}
