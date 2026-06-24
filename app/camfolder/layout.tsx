import { createClient } from "@/lib/supabase/server";
import CamSidebar from "./components/cam-sidebar";

export default async function CamFolderLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userName = user?.user_metadata?.display_name ?? user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "User";
  const userId = user?.id ?? "";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f3f7fa" }}>
      <CamSidebar userName={userName} userId={userId} />
      {/* pt-[52px] clears the fixed mobile header; pb-28 clears the floating action pill */}
      <div className="flex-1 min-w-0 overflow-x-hidden pt-[52px] pb-28 lg:pt-0 lg:pb-0">
        {children}
      </div>
    </div>
  );
}
