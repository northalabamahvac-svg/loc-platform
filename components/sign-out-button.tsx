"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const supabase = createClient();
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      className="text-xs font-semibold rounded-lg px-3 py-1.5 transition-opacity hover:opacity-70"
      style={{ color: "var(--muted-hi)", border: "1px solid var(--bdr)", background: "var(--surfB)" }}
    >
      Sign out
    </button>
  );
}
