"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service_type: string;
  address: string;
  preferred_date: string | null;
  preferred_time: string | null;
  notes: string | null;
  status: string;
  assigned_to: string | null;
  created_at: string;
}

const STATUS_CYCLE: Record<string, string> = {
  new: "contacted",
  contacted: "booked",
  booked: "booked",
  cancelled: "cancelled",
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  new:       { bg: "#fef3c7", color: "#92400e" },
  contacted: { bg: "#dbeafe", color: "#1d4ed8" },
  booked:    { bg: "#dcfce7", color: "#16a34a" },
  cancelled: { bg: "#fee2e2", color: "#dc2626" },
};

type FilterStatus = "all" | "new" | "contacted" | "booked" | "cancelled";

export default function BookingsClient({ initialBookings, userIds }: { initialBookings: Booking[]; userIds: string[] }) {
  const supabase = createClient();
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const newCount = bookings.filter(b => b.status === "new").length;

  const visible = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  async function cycleStatus(booking: Booking) {
    const next = STATUS_CYCLE[booking.status] ?? "contacted";
    if (next === booking.status) return;
    setUpdating(booking.id);
    await supabase.from("cf_booking_requests").update({ status: next }).eq("id", booking.id);
    setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: next } : b));
    setUpdating(null);
  }

  async function assignTo(bookingId: string, userId: string) {
    await supabase.from("cf_booking_requests").update({ assigned_to: userId || null }).eq("id", bookingId);
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, assigned_to: userId || null } : b));
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  const FILTERS: { key: FilterStatus; label: string }[] = [
    { key: "all",       label: "All" },
    { key: "new",       label: "New" },
    { key: "contacted", label: "Contacted" },
    { key: "booked",    label: "Booked" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{
              padding: "7px 16px", borderRadius: 99, fontSize: 13, fontWeight: filter === f.key ? 700 : 500,
              background: filter === f.key ? "#4a7a9b" : "#fff",
              color: filter === f.key ? "#fff" : "#475569",
              border: filter === f.key ? "1px solid #4a7a9b" : "1px solid #e2e8f0",
              cursor: "pointer",
              position: "relative",
            }}>
            {f.label}
            {f.key === "new" && newCount > 0 && (
              <span style={{ marginLeft: 6, background: "#d4838d", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 800, padding: "1px 6px" }}>
                {newCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: 28, marginBottom: 8 }}>📥</p>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>No bookings{filter !== "all" ? ` with status "${filter}"` : ""} yet</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {visible.map(booking => {
          const ss = STATUS_STYLE[booking.status] ?? STATUS_STYLE.new;
          return (
            <div key={booking.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#1a2a38", margin: "0 0 2px" }}>{booking.name}</p>
                  <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>{booking.email}{booking.phone ? ` · ${booking.phone}` : ""}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => cycleStatus(booking)}
                    disabled={updating === booking.id || booking.status === "booked" || booking.status === "cancelled"}
                    style={{
                      background: ss.bg, color: ss.color, border: "none", borderRadius: 99,
                      padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: booking.status === "booked" || booking.status === "cancelled" ? "default" : "pointer",
                      textTransform: "capitalize",
                    }}>
                    {updating === booking.id ? "…" : booking.status}
                    {booking.status !== "booked" && booking.status !== "cancelled" && " →"}
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>Service</p>
                  <p style={{ fontSize: 13, color: "#1a2a38", margin: 0 }}>{booking.service_type}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>Requested</p>
                  <p style={{ fontSize: 13, color: "#1a2a38", margin: 0 }}>{formatDate(booking.created_at)}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>Address</p>
                  <p style={{ fontSize: 13, color: "#1a2a38", margin: 0 }}>{booking.address}</p>
                </div>
                {(booking.preferred_date || booking.preferred_time) && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 2px" }}>Preferred</p>
                    <p style={{ fontSize: 13, color: "#1a2a38", margin: 0 }}>
                      {booking.preferred_date && formatDate(booking.preferred_date)}
                      {booking.preferred_time && ` · ${booking.preferred_time}`}
                    </p>
                  </div>
                )}
              </div>

              {booking.notes && (
                <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
                  <p style={{ fontSize: 13, color: "#475569", margin: 0, lineHeight: 1.5 }}>{booking.notes}</p>
                </div>
              )}

              {userIds.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, flexShrink: 0 }}>Assign to:</p>
                  <select
                    value={booking.assigned_to ?? ""}
                    onChange={e => assignTo(booking.id, e.target.value)}
                    style={{ fontSize: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 7, padding: "4px 10px", color: "#1a2a38", outline: "none", cursor: "pointer" }}>
                    <option value="">Unassigned</option>
                    {userIds.map(uid => (
                      <option key={uid} value={uid}>{uid.slice(0, 8)}…</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
