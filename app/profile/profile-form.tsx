"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const inputStyle: React.CSSProperties = {
  background: "#f3f7fa",
  border: "1px solid #e2e8f0",
  color: "#1a2a38",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 13,
  width: "100%",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
  marginBottom: 6,
  color: "#64748b",
};

export default function ProfileForm({ currentName, email }: { currentName: string; email: string }) {
  const [name, setName] = useState(currentName);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [nameMsg, setNameMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const supabase = createClient();

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setNameMsg("");
    const { error } = await supabase.auth.updateUser({ data: { display_name: name.trim() } });
    setNameMsg(error ? `Error: ${error.message}` : "Name saved!");
    setSaving(false);
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwErr(""); setPwMsg("");
    if (password !== confirmPassword) { setPwErr("Passwords don't match"); return; }
    if (password.length < 8) { setPwErr("Must be at least 8 characters"); return; }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setPwErr(error.message); } else { setPwMsg("Password updated!"); setPassword(""); setConfirmPassword(""); }
    setChangingPw(false);
  }

  const card: React.CSSProperties = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 16 };

  return (
    <div>
      {/* Display name */}
      <div style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1a2a38", margin: "0 0 16px" }}>Display Name</h2>
        <form onSubmit={saveName} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input value={email} disabled style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }} />
          </div>
          <div>
            <label style={labelStyle}>Your Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Steven Watwood" required style={inputStyle} />
            <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>This is how you appear to teammates in Blossomwood Portal.</p>
          </div>
          {nameMsg && (
            <p style={{ fontSize: 12, borderRadius: 8, padding: "8px 12px", background: nameMsg.startsWith("Error") ? "#fef2f2" : "#fdf2f3", color: nameMsg.startsWith("Error") ? "#dc2626" : "#d4838d" }}>
              {nameMsg}
            </p>
          )}
          <button type="submit" disabled={saving || !name.trim()}
            style={{ background: "#4a7a9b", color: "#fff", border: "none", borderRadius: 8, padding: "10px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: saving || !name.trim() ? 0.5 : 1 }}>
            {saving ? "Saving…" : "Save Name"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1a2a38", margin: "0 0 16px" }}>Change Password</h2>
        <form onSubmit={savePassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>New Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" required style={inputStyle} />
          </div>
          {pwErr && <p style={{ fontSize: 12, borderRadius: 8, padding: "8px 12px", background: "#fef2f2", color: "#dc2626" }}>{pwErr}</p>}
          {pwMsg && <p style={{ fontSize: 12, borderRadius: 8, padding: "8px 12px", background: "#fdf2f3", color: "#d4838d" }}>{pwMsg}</p>}
          <button type="submit" disabled={changingPw || !password}
            style={{ background: "#f3f7fa", color: "#1a2a38", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: changingPw || !password ? 0.5 : 1 }}>
            {changingPw ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
