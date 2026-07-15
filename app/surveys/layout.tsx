import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import SurveysSignOut from "./sign-out";

export const metadata = { title: "System Survey — Replacement Estimator" };

export default async function SurveysLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userName = user?.user_metadata?.display_name ?? user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "";
  const initials = userName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{ minHeight: "100vh", background: "#f3f7fa" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "#1a2a38", padding: "0 16px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <Link href="/surveys" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#4a7a9b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              ❄️
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#fff", lineHeight: 1.15 }}>System Survey</p>
              <p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>Replacement Estimator</p>
            </div>
          </Link>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div title={userName} style={{ width: 30, height: 30, borderRadius: "50%", background: "#4a7a9b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>
                {initials || "?"}
              </div>
              <SurveysSignOut />
            </div>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}
