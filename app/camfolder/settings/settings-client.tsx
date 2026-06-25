"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { CamLogo } from "../components/cam-sidebar";

const card: React.CSSProperties = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px", marginBottom: 20 };
const label: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b", marginBottom: 6 };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#1a2a38", outline: "none" };
const saveBtn = (saving: boolean): React.CSSProperties => ({ background: saving ? "#94a3b8" : "#4a7a9b", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: saving ? "default" : "pointer" });

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{ width: 44, height: 24, borderRadius: 99, background: value ? "#4a7a9b" : "#e2e8f0", border: "none", cursor: "pointer", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: value ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </button>
  );
}

function Msg({ text }: { text: string }) {
  if (!text) return null;
  const isErr = text.startsWith("Error");
  return <p style={{ fontSize: 12, borderRadius: 8, padding: "8px 12px", background: isErr ? "#fef2f2" : "#f0fdf4", color: isErr ? "#dc2626" : "#16a34a", margin: "8px 0 0" }}>{text}</p>;
}

interface Props {
  userId: string;
  initialBusinessName: string;
  initialBusinessPhone: string;
  initialBusinessHours: string;
  initialLogoUrl: string;
  initialServiceTypes: string[];
  initialBookingNotifications: boolean;
  initialEstimateNotifications: boolean;
  initialGpsEnabled: boolean;
  initialWatermarkEnabled: boolean;
  initialEstimateExpiry: number;
}

export default function SettingsClient(p: Props) {
  const supabase = createClient();
  const router = useRouter();
  const logoRef = useRef<HTMLInputElement>(null);

  const [bizName, setBizName] = useState(p.initialBusinessName);
  const [bizPhone, setBizPhone] = useState(p.initialBusinessPhone);
  const [bizHours, setBizHours] = useState(p.initialBusinessHours);
  const [logoUrl, setLogoUrl] = useState(p.initialLogoUrl);
  const [logoUploading, setLogoUploading] = useState(false);
  const [bizMsg, setBizMsg] = useState("");
  const [bizSaving, setBizSaving] = useState(false);

  const [serviceTypes, setServiceTypes] = useState<string[]>(p.initialServiceTypes);
  const [newType, setNewType] = useState("");
  const [serviceMsg, setServiceMsg] = useState("");
  const [serviceSaving, setServiceSaving] = useState(false);

  const [bookingNotif, setBookingNotif] = useState(p.initialBookingNotifications);
  const [estimateNotif, setEstimateNotif] = useState(p.initialEstimateNotifications);
  const [notifMsg, setNotifMsg] = useState("");
  const [notifSaving, setNotifSaving] = useState(false);

  const [gpsEnabled, setGpsEnabled] = useState(p.initialGpsEnabled);
  const [watermarkEnabled, setWatermarkEnabled] = useState(p.initialWatermarkEnabled);
  const [photoMsg, setPhotoMsg] = useState("");
  const [photoSaving, setPhotoSaving] = useState(false);

  const [estimateExpiry, setEstimateExpiry] = useState(p.initialEstimateExpiry);
  const [estimateMsg, setEstimateMsg] = useState("");
  const [estimateSaving, setEstimateSaving] = useState(false);

  async function save(data: Record<string, unknown>, setMsg: (s: string) => void, setSaving: (b: boolean) => void) {
    setSaving(true); setMsg("");
    const { error } = await supabase.auth.updateUser({ data });
    setMsg(error ? `Error: ${error.message}` : "Saved!");
    setSaving(false);
    router.refresh();
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true); setBizMsg("");
    const ext = file.name.split(".").pop() ?? "png";
    const path = `settings/${p.userId}/logo.${ext}`;
    const { error: upErr } = await supabase.storage.from("camfolder-photos").upload(path, file, { upsert: true });
    if (upErr) { setBizMsg(`Error: ${upErr.message}`); setLogoUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("camfolder-photos").getPublicUrl(path);
    setLogoUrl(publicUrl);
    setLogoUploading(false);
  }

  function addServiceType() {
    const t = newType.trim();
    if (!t || serviceTypes.includes(t)) return;
    setServiceTypes(prev => [...prev, t]);
    setNewType("");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f3f7fa" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/camfolder" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <CamLogo size={28} />
          <span style={{ fontWeight: 800, fontSize: 15, color: "#1a2a38" }}>CamBBC</span>
        </Link>
        <span style={{ color: "#e2e8f0" }}>/</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#475569" }}>Settings</span>
        <Link href="/camfolder" style={{ marginLeft: "auto", fontSize: 13, fontWeight: 600, color: "#4a7a9b", textDecoration: "none" }}>← Back to Projects</Link>
      </header>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "32px 16px 80px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a2a38", margin: "0 0 4px" }}>Settings</h1>
        <p style={{ fontSize: 14, color: "#94a3b8", margin: "0 0 28px" }}>Business info, notifications, and app preferences</p>

        {/* ── Business Profile ── */}
        <div style={card}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1a2a38", margin: "0 0 20px" }}>🏢 Business Profile</h2>

          {/* Logo */}
          <div style={{ marginBottom: 20 }}>
            <span style={label}>Business Logo</span>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                onClick={() => logoRef.current?.click()}
                style={{ width: 80, height: 80, borderRadius: 14, border: "2px dashed #e2e8f0", background: "#f3f7fa", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", flexShrink: 0 }}>
                {logoUrl ? <img src={logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 28 }}>📷</span>}
              </div>
              <div>
                <button onClick={() => logoRef.current?.click()} disabled={logoUploading}
                  style={{ background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#1a2a38", display: "block", marginBottom: 6 }}>
                  {logoUploading ? "Uploading…" : logoUrl ? "Change Logo" : "Upload Logo"}
                </button>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>PNG or JPG · appears in estimates &amp; emails</p>
              </div>
              <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={uploadLogo} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={label}>Business Name</label>
              <input value={bizName} onChange={e => setBizName(e.target.value)} placeholder="Blossomwood Building Co." style={input} />
            </div>
            <div>
              <label style={label}>Business Phone</label>
              <input value={bizPhone} onChange={e => setBizPhone(e.target.value)} placeholder="(256) 555-0100" style={input} type="tel" />
            </div>
            <div>
              <label style={label}>Business Hours</label>
              <input value={bizHours} onChange={e => setBizHours(e.target.value)} placeholder="Mon–Fri 7am–6pm, Sat 8am–2pm" style={input} />
              <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0" }}>Shown on your public booking page</p>
            </div>
          </div>
          <Msg text={bizMsg} />
          <button disabled={bizSaving} onClick={() => save({ business_name: bizName.trim(), business_phone: bizPhone.trim(), business_hours: bizHours.trim(), business_logo_url: logoUrl }, setBizMsg, setBizSaving)}
            style={{ ...saveBtn(bizSaving), marginTop: 16 }}>
            {bizSaving ? "Saving…" : "Save Business Info"}
          </button>
        </div>

        {/* ── Service Types ── */}
        <div style={card}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1a2a38", margin: "0 0 6px" }}>🔧 Service Types</h2>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 16px" }}>These appear in the dropdown on your public booking form.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {serviceTypes.map(t => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, background: "#edf3f7", borderRadius: 99, padding: "6px 12px" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1a2a38" }}>{t}</span>
                <button onClick={() => setServiceTypes(prev => prev.filter(x => x !== t))}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={newType} onChange={e => setNewType(e.target.value)} onKeyDown={e => e.key === "Enter" && addServiceType()} placeholder="Add a service type…" style={{ ...input, flex: 1 }} />
            <button onClick={addServiceType} style={{ background: "#4a7a9b", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Add</button>
          </div>
          <Msg text={serviceMsg} />
          <button disabled={serviceSaving} onClick={() => save({ service_types: serviceTypes }, setServiceMsg, setServiceSaving)}
            style={{ ...saveBtn(serviceSaving), marginTop: 14 }}>
            {serviceSaving ? "Saving…" : "Save Service Types"}
          </button>
        </div>

        {/* ── Notifications ── */}
        <div style={card}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1a2a38", margin: "0 0 6px" }}>🔔 Notifications</h2>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 16px" }}>Email alerts sent to your business email address.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1a2a38", margin: "0 0 2px" }}>New booking alert</p>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Email me when someone submits a booking request</p>
              </div>
              <Toggle value={bookingNotif} onChange={setBookingNotif} />
            </div>
            <div style={{ height: 1, background: "#f1f5f9" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1a2a38", margin: "0 0 2px" }}>Estimate accepted alert</p>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Email me when a customer selects a tier on an estimate</p>
              </div>
              <Toggle value={estimateNotif} onChange={setEstimateNotif} />
            </div>
          </div>
          <Msg text={notifMsg} />
          <button disabled={notifSaving} onClick={() => save({ booking_notifications: bookingNotif, estimate_notifications: estimateNotif }, setNotifMsg, setNotifSaving)}
            style={{ ...saveBtn(notifSaving), marginTop: 16 }}>
            {notifSaving ? "Saving…" : "Save Notifications"}
          </button>
        </div>

        {/* ── Photos ── */}
        <div style={card}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1a2a38", margin: "0 0 6px" }}>📷 Photos</h2>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 16px" }}>Controls how photos are captured and processed.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1a2a38", margin: "0 0 2px" }}>GPS location capture</p>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Automatically tag photos with GPS coordinates on upload</p>
              </div>
              <Toggle value={gpsEnabled} onChange={setGpsEnabled} />
            </div>
            <div style={{ height: 1, background: "#f1f5f9" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1a2a38", margin: "0 0 2px" }}>Photo watermark</p>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Stamp your business name on photos before uploading</p>
              </div>
              <Toggle value={watermarkEnabled} onChange={setWatermarkEnabled} />
            </div>
          </div>
          <Msg text={photoMsg} />
          <button disabled={photoSaving} onClick={() => save({ gps_enabled: gpsEnabled, watermark_enabled: watermarkEnabled }, setPhotoMsg, setPhotoSaving)}
            style={{ ...saveBtn(photoSaving), marginTop: 16 }}>
            {photoSaving ? "Saving…" : "Save Photo Settings"}
          </button>
        </div>

        {/* ── Estimates ── */}
        <div style={card}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1a2a38", margin: "0 0 6px" }}>💰 Estimates</h2>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 16px" }}>Configure how estimate links behave.</p>
          <div>
            <label style={label}>Estimate link expiry (days)</label>
            <input type="number" min={1} max={365} value={estimateExpiry} onChange={e => setEstimateExpiry(Number(e.target.value))} style={{ ...input, width: 120 }} />
            <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0" }}>Customer links expire after this many days. Set to 365 to never expire.</p>
          </div>
          <Msg text={estimateMsg} />
          <button disabled={estimateSaving} onClick={() => save({ estimate_expiry_days: estimateExpiry }, setEstimateMsg, setEstimateSaving)}
            style={{ ...saveBtn(estimateSaving), marginTop: 16 }}>
            {estimateSaving ? "Saving…" : "Save Estimate Settings"}
          </button>
        </div>
      </main>
    </div>
  );
}
