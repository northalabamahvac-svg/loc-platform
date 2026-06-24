"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

interface Membership {
  id: string;
  owner_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  address: string | null;
  plan: "basic" | "standard" | "premium";
  price_cents: number;
  start_date: string;
  renewal_date: string;
  status: "active" | "expired" | "cancelled" | "pending";
  notes: string | null;
  auto_renew: boolean;
  created_at: string;
}

const PLAN_PRICES: Record<string, number> = { basic: 9900, standard: 19900, premium: 39900 };
const PLAN_LABELS: Record<string, string> = { basic: "Basic", standard: "Standard", premium: "Premium" };
const PLAN_BADGE: Record<string, React.CSSProperties> = {
  basic:    { background: "#f1f5f9", color: "#64748b" },
  standard: { background: "#dbeafe", color: "#1d4ed8" },
  premium:  { background: "#fef9c3", color: "#ca8a04" },
};
const STATUS_BADGE: Record<string, React.CSSProperties> = {
  active:    { background: "#dcfce7", color: "#16a34a" },
  expired:   { background: "#fee2e2", color: "#dc2626" },
  cancelled: { background: "#f1f5f9", color: "#64748b" },
  pending:   { background: "#fef3c7", color: "#d97706" },
};

function daysUntil(dateStr: string) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const then = new Date(dateStr + "T00:00:00");
  return Math.round((then.getTime() - now.getTime()) / 86400000);
}

function fmtDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtMoney(cents: number) {
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

type FilterType = "all" | "active" | "expiring" | "expired";

const emptyForm = {
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  address: "",
  plan: "basic" as "basic" | "standard" | "premium",
  start_date: new Date().toISOString().split("T")[0],
  renewal_date: "",
  notes: "",
  auto_renew: true,
};

export default function MembershipsClient({ initialMemberships, userId }: { initialMemberships: Membership[]; userId: string }) {
  const supabase = createClient();
  const [memberships, setMemberships] = useState<Membership[]>(initialMemberships);
  const [filter, setFilter] = useState<FilterType>("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Membership | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Compute renewal_date from start_date + 1 year when plan/start_date changes
  function handlePlanChange(plan: typeof form.plan) {
    setForm(f => {
      const renewal = f.start_date
        ? new Date(new Date(f.start_date + "T12:00:00").setFullYear(new Date(f.start_date + "T12:00:00").getFullYear() + 1)).toISOString().split("T")[0]
        : "";
      return { ...f, plan, renewal_date: renewal };
    });
  }

  function handleStartDateChange(start_date: string) {
    const renewal = start_date
      ? new Date(new Date(start_date + "T12:00:00").setFullYear(new Date(start_date + "T12:00:00").getFullYear() + 1)).toISOString().split("T")[0]
      : "";
    setForm(f => ({ ...f, start_date, renewal_date: renewal }));
  }

  function openNew() {
    setEditing(null);
    const today = new Date().toISOString().split("T")[0];
    const nextYear = new Date(new Date(today + "T12:00:00").setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0];
    setForm({ ...emptyForm, start_date: today, renewal_date: nextYear });
    setShowForm(true);
  }

  function openEdit(m: Membership) {
    setEditing(m);
    setForm({
      customer_name: m.customer_name,
      customer_email: m.customer_email ?? "",
      customer_phone: m.customer_phone ?? "",
      address: m.address ?? "",
      plan: m.plan,
      start_date: m.start_date,
      renewal_date: m.renewal_date,
      notes: m.notes ?? "",
      auto_renew: m.auto_renew,
    });
    setShowForm(true);
  }

  async function save() {
    if (!form.customer_name.trim()) return;
    setSaving(true);
    const payload = {
      owner_id: userId,
      customer_name: form.customer_name.trim(),
      customer_email: form.customer_email.trim() || null,
      customer_phone: form.customer_phone.trim() || null,
      address: form.address.trim() || null,
      plan: form.plan,
      price_cents: PLAN_PRICES[form.plan],
      start_date: form.start_date,
      renewal_date: form.renewal_date,
      status: "active" as const,
      notes: form.notes.trim() || null,
      auto_renew: form.auto_renew,
    };

    if (editing) {
      const { data } = await supabase.from("cf_memberships").update(payload).eq("id", editing.id).select().single() as any;
      if (data) setMemberships(prev => prev.map(m => m.id === editing.id ? data : m));
    } else {
      const { data } = await supabase.from("cf_memberships").insert(payload).select().single() as any;
      if (data) setMemberships(prev => [data, ...prev]);
    }
    setSaving(false);
    setShowForm(false);
    setEditing(null);
  }

  async function markExpired(id: string) {
    await supabase.from("cf_memberships").update({ status: "expired" }).eq("id", id);
    setMemberships(prev => prev.map(m => m.id === id ? { ...m, status: "expired" } : m));
  }

  async function deleteMembership(id: string) {
    if (!confirm("Delete this membership?")) return;
    setDeletingId(id);
    await supabase.from("cf_memberships").delete().eq("id", id);
    setMemberships(prev => prev.filter(m => m.id !== id));
    setDeletingId(null);
  }

  const expiringSoon = useMemo(() =>
    memberships.filter(m => m.status === "active" && daysUntil(m.renewal_date) <= 30 && daysUntil(m.renewal_date) >= 0),
    [memberships]);

  const filtered = useMemo(() => {
    switch (filter) {
      case "active":   return memberships.filter(m => m.status === "active");
      case "expiring": return expiringSoon;
      case "expired":  return memberships.filter(m => m.status === "expired" || m.status === "cancelled");
      default:         return memberships;
    }
  }, [memberships, filter, expiringSoon]);

  const totalActive = memberships.filter(m => m.status === "active").length;
  const totalRevenue = memberships.filter(m => m.status === "active").reduce((s, m) => s + m.price_cents, 0);

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all",      label: `All (${memberships.length})` },
    { key: "active",   label: `Active (${totalActive})` },
    { key: "expiring", label: `Expiring Soon (${expiringSoon.length})` },
    { key: "expired",  label: `Expired` },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f3f7fa" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 16px 80px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a2a38", margin: 0 }}>🤝 Service Memberships</h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>Manage recurring service plans</p>
          </div>
          <button onClick={openNew}
            style={{ background: "#4a7a9b", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            + New Member
          </button>
        </div>

        {/* Stats bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total Active",   value: String(totalActive) },
            { label: "Revenue / yr",   value: fmtMoney(totalRevenue) },
            { label: "Expiring Soon",  value: String(expiringSoon.length) },
          ].map(stat => (
            <div key={stat.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 4px" }}>{stat.label}</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: "#1a2a38", margin: 0 }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Expiring banner */}
        {expiringSoon.length > 0 && (
          <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 12, padding: "12px 16px", marginBottom: 16, fontSize: 13, fontWeight: 600, color: "#92400e" }}>
            ⚠️ {expiringSoon.length} membership{expiringSoon.length > 1 ? "s" : ""} renewing within 30 days
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{
                padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: filter === f.key ? 700 : 500, cursor: "pointer",
                background: filter === f.key ? "#4a7a9b" : "#fff",
                color: filter === f.key ? "#fff" : "#475569",
                border: filter === f.key ? "1px solid #4a7a9b" : "1px solid #e2e8f0",
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Membership cards */}
        {filtered.length === 0 ? (
          <div style={{ border: "1px dashed #e2e8f0", borderRadius: 14, padding: 48, textAlign: "center" }}>
            <p style={{ fontSize: 28, margin: "0 0 8px" }}>🤝</p>
            <p style={{ fontSize: 14, color: "#94a3b8" }}>No memberships found</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map(m => {
              const days = daysUntil(m.renewal_date);
              return (
                <div key={m.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#1a2a38" }}>{m.customer_name}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, ...PLAN_BADGE[m.plan] }}>{PLAN_LABELS[m.plan]}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, ...STATUS_BADGE[m.status] }}>{m.status}</span>
                      </div>
                      {m.address && <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 4px" }}>📍 {m.address}</p>}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 16, fontWeight: 800, color: "#1a2a38", margin: "0 0 2px" }}>{fmtMoney(m.price_cents)}<span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>/yr</span></p>
                      <p style={{ fontSize: 11, color: days <= 14 ? "#dc2626" : days <= 30 ? "#d97706" : "#94a3b8", margin: 0, fontWeight: days <= 30 ? 700 : 400 }}>
                        Renews {fmtDate(m.renewal_date)}
                        {m.status === "active" && days >= 0 && <span> · {days}d</span>}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                    {m.customer_email && <a href={`mailto:${m.customer_email}`} style={{ fontSize: 12, color: "#4a7a9b", textDecoration: "none" }}>✉️ {m.customer_email}</a>}
                    {m.customer_phone && <a href={`tel:${m.customer_phone}`} style={{ fontSize: 12, color: "#4a7a9b", textDecoration: "none" }}>📞 {m.customer_phone}</a>}
                  </div>
                  {m.notes && <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.notes}</p>}
                  <div style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
                    <button onClick={() => openEdit(m)}
                      style={{ fontSize: 12, fontWeight: 600, background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 7, padding: "5px 12px", cursor: "pointer", color: "#475569" }}>
                      Edit
                    </button>
                    {m.status === "active" && (
                      <button onClick={() => markExpired(m.id)}
                        style={{ fontSize: 12, fontWeight: 600, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 7, padding: "5px 12px", cursor: "pointer", color: "#ea580c" }}>
                        Mark Expired
                      </button>
                    )}
                    <button onClick={() => deleteMembership(m.id)} disabled={deletingId === m.id}
                      style={{ fontSize: 12, fontWeight: 600, background: "none", border: "none", padding: "5px 8px", cursor: "pointer", color: "#d4838d", marginLeft: "auto" }}>
                      {deletingId === m.id ? "…" : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide-up form */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setShowForm(false)}>
          <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "8px 20px 48px", width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: "#e5e7eb", margin: "10px auto 20px" }} />
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a2a38", margin: "0 0 20px" }}>
              {editing ? "Edit Membership" : "New Service Member"}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Customer Name *", key: "customer_name", placeholder: "John Smith", type: "text" },
                { label: "Email",           key: "customer_email", placeholder: "john@example.com", type: "email" },
                { label: "Phone",           key: "customer_phone", placeholder: "(555) 555-0100", type: "tel" },
                { label: "Address",         key: "address", placeholder: "123 Main St", type: "text" },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em" }}>{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={(form as any)[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#1a2a38", outline: "none" }} />
                </div>
              ))}

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em" }}>Plan</label>
                <select value={form.plan} onChange={e => handlePlanChange(e.target.value as typeof form.plan)}
                  style={{ width: "100%", background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#1a2a38", outline: "none" }}>
                  <option value="basic">Basic — $99/yr</option>
                  <option value="standard">Standard — $199/yr</option>
                  <option value="premium">Premium — $399/yr</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em" }}>Start Date</label>
                  <input type="date" value={form.start_date} onChange={e => handleStartDateChange(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#1a2a38", outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em" }}>Renewal Date</label>
                  <input type="date" value={form.renewal_date} onChange={e => setForm(f => ({ ...f, renewal_date: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#1a2a38", outline: "none" }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em" }}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
                  placeholder="Any notes about this customer or plan…"
                  style={{ width: "100%", boxSizing: "border-box", background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#1a2a38", outline: "none", resize: "vertical" }} />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={form.auto_renew} onChange={e => setForm(f => ({ ...f, auto_renew: e.target.checked }))} />
                <span style={{ fontSize: 13, color: "#1a2a38" }}>Auto-renew</span>
              </label>

              <button onClick={save} disabled={saving}
                style={{ background: "#4a7a9b", color: "#fff", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
                {saving ? "Saving…" : editing ? "Save Changes" : "Create Membership"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
