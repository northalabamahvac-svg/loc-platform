export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "./profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="px-6 py-4" style={{
        background: "rgba(15,15,30,0.85)",
        borderBottom: "1px solid var(--bdr)",
        backdropFilter: "blur(8px)",
      }}>
        <a href="/dashboard" className="text-sm font-semibold hover:opacity-70" style={{ color: "var(--accent-hi)" }}>
          ← Back to Dashboard
        </a>
      </header>
      <main className="max-w-lg mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--txt-hi)" }}>My Profile</h1>
        <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>Update your display name and account info</p>
        <ProfileForm
          currentName={user.user_metadata?.display_name ?? ""}
          email={user.email ?? ""}
        />
      </main>
    </div>
  );
}
