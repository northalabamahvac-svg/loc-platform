export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ProfileForm from "./profile-form";
import { CamLogo } from "@/app/camfolder/components/cam-sidebar";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/camfolder" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <CamLogo size={28} />
          <span style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>CamFolder</span>
        </Link>
        <span style={{ color: "#e2e8f0" }}>/</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#475569" }}>My Profile</span>
        <Link href="/camfolder" style={{ marginLeft: "auto", fontSize: 13, fontWeight: 600, color: "#2563eb", textDecoration: "none" }}>
          ← Back to Projects
        </Link>
      </header>

      <main style={{ maxWidth: 520, margin: "0 auto", padding: "32px 16px 80px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>My Profile</h1>
        <p style={{ fontSize: 14, color: "#94a3b8", margin: "0 0 28px" }}>Update your display name and account settings</p>
        <ProfileForm currentName={user.user_metadata?.display_name ?? ""} email={user.email ?? ""} />
      </main>
    </div>
  );
}
