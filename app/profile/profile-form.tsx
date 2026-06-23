"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const inputStyle: React.CSSProperties = {
  background: "var(--surfB)",
  border: "1px solid var(--bdr)",
  color: "var(--txt)",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 13,
  width: "100%",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
  marginBottom: 6,
  color: "var(--muted-hi)",
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

  return (
    <div className="space-y-5">
      {/* Display name */}
      <div className="rounded-2xl p-5" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: "var(--txt-hi)" }}>Display Name</h2>
        <form onSubmit={saveName} className="space-y-4">
          <div>
            <label style={labelStyle}>Email</label>
            <input value={email} disabled style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }} />
          </div>
          <div>
            <label style={labelStyle}>Your Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Steven Watwood"
              required
              style={inputStyle}
            />
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              This is how you appear in the Members tab on LOCs.
            </p>
          </div>
          {nameMsg && (
            <p className="text-xs rounded-lg px-3 py-2" style={{
              background: nameMsg.startsWith("Error") ? "rgba(220,38,38,0.15)" : "rgba(5,150,105,0.15)",
              color: nameMsg.startsWith("Error") ? "var(--red-t)" : "var(--green-t)",
            }}>
              {nameMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-full rounded-lg py-2.5 text-sm font-bold transition-opacity disabled:opacity-40"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {saving ? "Saving…" : "Save Name"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="rounded-2xl p-5" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: "var(--txt-hi)" }}>Change Password</h2>
        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              required
              style={inputStyle}
            />
          </div>
          {pwErr && (
            <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(220,38,38,0.15)", color: "var(--red-t)" }}>{pwErr}</p>
          )}
          {pwMsg && (
            <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(5,150,105,0.15)", color: "var(--green-t)" }}>{pwMsg}</p>
          )}
          <button
            type="submit"
            disabled={changingPw || !password}
            className="w-full rounded-lg py-2.5 text-sm font-bold transition-opacity disabled:opacity-40"
            style={{ background: "var(--surfB)", color: "var(--txt-hi)", border: "1px solid var(--bdr)" }}
          >
            {changingPw ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
