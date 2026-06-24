"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const SERVICE_TYPES = ["AC Repair", "Heating", "Maintenance", "New Install", "Ductwork", "Other"];
const TIME_SLOTS = [
  { value: "morning", label: "Morning (8am–12pm)" },
  { value: "afternoon", label: "Afternoon (12pm–5pm)" },
  { value: "evening", label: "Evening (5pm–8pm)" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: "11px 14px",
  fontSize: 14,
  outline: "none",
  color: "#1a2a38",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: 6,
};

export default function BookingForm() {
  const supabase = createClient();
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    service_type: "", address: "",
    preferred_date: "", preferred_time: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function update(field: string, val: string) {
    setForm(prev => ({ ...prev, [field]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.address || !form.service_type) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true); setError("");
    const { error: dbErr } = await supabase.from("cf_booking_requests").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      service_type: form.service_type,
      address: form.address.trim(),
      preferred_date: form.preferred_date || null,
      preferred_time: form.preferred_time || null,
      notes: form.notes.trim() || null,
      status: "new",
    });
    if (dbErr) { setError(dbErr.message); setSubmitting(false); return; }
    setSuccess(true);
    setSubmitting(false);
  }

  if (success) {
    return (
      <div style={{ background: "#fff", borderRadius: 20, padding: 40, textAlign: "center", border: "1px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1a2a38", margin: "0 0 8px" }}>Request received!</h2>
        <p style={{ fontSize: 15, color: "#475569", marginBottom: 24, lineHeight: 1.6 }}>
          We&apos;ll contact you within 2 hours to confirm your appointment.
        </p>
        <a
          href={process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL ?? "https://g.page/r/review"}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-block",
            background: "#4a7a9b",
            color: "#fff",
            borderRadius: 12,
            padding: "13px 28px",
            fontWeight: 700,
            fontSize: 14,
            textDecoration: "none",
          }}>
          ⭐ Leave Us a Google Review
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: 20, padding: 28, border: "1px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <label style={labelStyle}>Full Name *</label>
        <input value={form.name} onChange={e => update("name", e.target.value)} placeholder="John Smith" required style={inputStyle} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <label style={labelStyle}>Email *</label>
          <input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="john@email.com" required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Phone</label>
          <input type="tel" value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="(555) 555-5555" style={inputStyle} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Service Type *</label>
        <select value={form.service_type} onChange={e => update("service_type", e.target.value)} required
          style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
          <option value="">Select a service…</option>
          {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Service Address *</label>
        <input value={form.address} onChange={e => update("address", e.target.value)} placeholder="123 Main St, Birmingham, AL" required style={inputStyle} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <label style={labelStyle}>Preferred Date</label>
          <input type="date" value={form.preferred_date} onChange={e => update("preferred_date", e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Preferred Time</label>
          <select value={form.preferred_time} onChange={e => update("preferred_time", e.target.value)}
            style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
            <option value="">Any time</option>
            {TIME_SLOTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Additional Notes</label>
        <textarea value={form.notes} onChange={e => update("notes", e.target.value)}
          placeholder="Describe the issue, unit age, any other details…"
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }} />
      </div>

      {error && (
        <div style={{ background: "#fee2e2", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>{error}</div>
      )}

      <button type="submit" disabled={submitting}
        style={{
          background: "#4a7a9b", color: "#fff", border: "none", borderRadius: 12,
          padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: submitting ? "default" : "pointer",
          opacity: submitting ? 0.7 : 1, transition: "opacity 0.2s",
        }}>
        {submitting ? "Submitting…" : "📅 Request Service Call"}
      </button>

      <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", margin: 0 }}>
        We typically respond within 2 hours during business hours.
      </p>
    </form>
  );
}
