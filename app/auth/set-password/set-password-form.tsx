"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Supabase puts tokens in the URL hash after redirect
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.slice(1));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token }).then(() => setReady(true));
        return;
      }
    }
    // If no hash tokens, check if already logged in (came via query-param OTP)
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setReady(true);
      else router.replace("/login");
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setError(""); setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/dashboard");
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: "var(--muted)" }}>Setting up your account…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-xs font-bold tracking-[0.14em] uppercase mb-1" style={{ color: "var(--muted)" }}>
            Blossomwood Building
          </p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--txt-hi)" }}>Create your password</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>You've been invited — set a password to continue</p>
        </div>
        <div className="rounded-2xl p-6" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--muted-hi)" }}>
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ background: "var(--surfB)", border: "1px solid var(--bdr)", color: "var(--txt)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--muted-hi)" }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                placeholder="Repeat your password"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ background: "var(--surfB)", border: "1px solid var(--bdr)", color: "var(--txt)" }}
              />
            </div>
            {error && (
              <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(220,38,38,0.15)", color: "var(--red-t)" }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-3 text-sm font-bold transition-opacity disabled:opacity-50"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {loading ? "Saving…" : "Set Password & Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
