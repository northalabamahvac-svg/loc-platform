"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const TRADES = ["HVAC", "Roofing", "Plumbing", "Electrical", "General Contracting", "Concrete", "Framing", "Flooring", "Painting", "Landscaping", "Other"];

const inputStyle: React.CSSProperties = {
  background: "var(--surfB)", border: "1px solid var(--bdr)", color: "var(--txt)",
  borderRadius: 8, padding: "10px 14px", fontSize: 14, width: "100%", outline: "none",
};

export default function NewProjectPage() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [trade, setTrade] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Project name is required."); return; }
    setLoading(true); setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data, error: err } = await supabase.from("cf_projects").insert({
      owner_id: user.id, name: name.trim(), address: address.trim() || null, trade: trade || null,
    }).select().single() as any;
    if (err) { setError(err.message); setLoading(false); return; }
    // Auto-add creator as owner member
    await supabase.from("cf_project_members").insert({ project_id: data.id, user_id: user.id, role: "owner" });
    router.push(`/camfolder/${data.id}`);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/camfolder" className="text-xs font-semibold hover:opacity-70 mb-6 inline-block" style={{ color: "var(--muted-hi)" }}>
          ← Back to Projects
        </Link>
        <div className="rounded-2xl p-6" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
          <h1 className="text-lg font-bold mb-1" style={{ color: "var(--txt-hi)" }}>New Job Site Project</h1>
          <p className="text-xs mb-6" style={{ color: "var(--muted)" }}>Create a project to start documenting and generating AI daily logs</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: "var(--muted-hi)" }}>Project Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 123 Main St HVAC Install" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: "var(--muted-hi)" }}>Job Site Address</label>
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street address or description" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: "var(--muted-hi)" }}>Trade / Type</label>
              <select value={trade} onChange={e => setTrade(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="">Select trade…</option>
                {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {error && <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(220,38,38,0.15)", color: "var(--red-t)" }}>{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-bold transition-opacity disabled:opacity-50"
              style={{ background: "var(--accent)", color: "#fff" }}>
              {loading ? "Creating…" : "Create Project"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
