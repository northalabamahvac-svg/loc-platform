import { createClient } from "@/lib/supabase/server";
import CamSidebar from "./components/cam-sidebar";

export default async function CamFolderLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "User";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <CamSidebar userName={userName} />
      {/* On mobile: pb-16 reserves space above the fixed bottom nav */}
      <div className="flex-1 min-w-0 overflow-x-hidden pb-16 lg:pb-0">
        {children}
      </div>
    </div>
  );
}
