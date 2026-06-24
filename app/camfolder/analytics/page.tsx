import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

function formatDollars(cents: number) {
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface StatCard {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: string;
  href?: string;
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Week boundaries
  const dayOfWeek = now.getDay();
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const thisWeekStart = new Date(now); thisWeekStart.setDate(now.getDate() + diffToMon); thisWeekStart.setHours(0,0,0,0);
  const thisWeekEnd = new Date(thisWeekStart); thisWeekEnd.setDate(thisWeekStart.getDate() + 6); thisWeekEnd.setHours(23,59,59,999);
  // Parallel fetches
  const [
    { data: projects },
    { data: photos },
    { data: _logs },
    { data: bookings },
    { data: estimates },
    { data: memberships },
    { data: scheduleThisWeek },
    { data: recentBookings },
    { data: upcomingSchedule },
  ] = await Promise.all([
    service.from("cf_projects").select("id, status, created_at"),
    service.from("cf_photos").select("id"),
    service.from("cf_daily_logs").select("id"), // _logs — count available if needed
    service.from("cf_booking_requests").select("id, status, created_at"),
    service.from("cf_estimates").select("id, status, accepted_tier, cf_estimate_tiers(price_cents, tier)"),
    service.from("cf_memberships").select("id, status, renewal_date").filter("status", "eq", "active"),
    service.from("cf_schedule").select("id").gte("scheduled_date", thisWeekStart.toISOString().slice(0, 10)).lte("scheduled_date", thisWeekEnd.toISOString().slice(0, 10)),
    service.from("cf_booking_requests").select("id, name, service_type, status, created_at, address").order("created_at", { ascending: false }).limit(5),
    service.from("cf_schedule").select("id, title, scheduled_date, start_time, project_id").gte("scheduled_date", now.toISOString().slice(0, 10)).order("scheduled_date").limit(10),
  ]);

  // Compute stats
  const totalProjects = (projects ?? []).length;
  const activeProjects = (projects ?? []).filter(p => p.status === "active").length;
  const completedThisMonth = (projects ?? []).filter(p => p.status === "completed" && p.created_at >= startOfMonth).length;
  const totalPhotos = (photos ?? []).length;
  const newBookings = (bookings ?? []).filter(b => b.status === "new").length;
  const newBookings7d = (bookings ?? []).filter(b => b.status === "new" && b.created_at >= sevenDaysAgo).length;
  const pendingEstimates = (estimates ?? []).filter(e => e.status === "draft" || e.status === "sent").length;

  // Accepted estimate total
  let acceptedEstimatesCents = 0;
  for (const est of estimates ?? []) {
    if (est.status === "accepted" && est.accepted_tier && Array.isArray((est as any).cf_estimate_tiers)) {
      const matchTier = (est as any).cf_estimate_tiers.find((t: any) => t.tier === est.accepted_tier);
      if (matchTier) acceptedEstimatesCents += matchTier.price_cents;
    }
  }

  const activeMemberships = (memberships ?? []).length;
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const expiringMemberships = (memberships ?? []).filter(m => m.renewal_date && m.renewal_date <= thirtyDaysFromNow.slice(0, 10)).length;
  const jobsThisWeek = (scheduleThisWeek ?? []).length;

  const stats: StatCard[] = [
    { label: "Active Projects",        value: activeProjects,    sub: `${totalProjects} total`,              color: "#4a7a9b", icon: "🏗️" },
    { label: "Completed This Month",   value: completedThisMonth, sub: "projects finished",                  color: "#22c55e", icon: "✅" },
    { label: "Total Photos",           value: totalPhotos,        sub: "site photos captured",               color: "#4a7a9b", icon: "📷" },
    { label: "New Bookings",           value: newBookings,        sub: `${newBookings7d} in last 7 days`,    color: "#d4838d", icon: "📥", href: "/camfolder/bookings" },
    { label: "Pending Estimates",      value: pendingEstimates,   sub: "draft + sent",                       color: "#f59e0b", icon: "💰" },
    { label: "Accepted Estimate Value",value: formatDollars(acceptedEstimatesCents), sub: "revenue booked",  color: "#16a34a", icon: "💵" },
    { label: "Active Memberships",     value: activeMemberships,  sub: expiringMemberships > 0 ? `${expiringMemberships} expiring soon` : "all current", color: "#8b5cf6", icon: "⭐" },
    { label: "Jobs This Week",         value: jobsThisWeek,       sub: "scheduled",                          color: "#4a7a9b", icon: "📅", href: "/camfolder/dispatch" },
  ];

  const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
    new:       { bg: "#fef3c7", color: "#92400e" },
    contacted: { bg: "#dbeafe", color: "#1d4ed8" },
    booked:    { bg: "#dcfce7", color: "#16a34a" },
    cancelled: { bg: "#fee2e2", color: "#dc2626" },
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f3f7fa" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 16px 80px" }}>
        {/* Page title */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2a38", margin: "0 0 4px" }}>📊 Analytics</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Live overview — updates on page load</p>
        </div>

        {/* Stat cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 32 }}>
          {stats.map(stat => (
            <div key={stat.label} style={{
              background: "#fff",
              borderRadius: 16,
              padding: "20px 22px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>{stat.label}</p>
                  <p style={{ fontSize: 30, fontWeight: 900, color: stat.color, margin: "0 0 4px", lineHeight: 1 }}>{stat.value}</p>
                  {stat.sub && <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{stat.sub}</p>}
                </div>
                <span style={{ fontSize: 28, opacity: 0.8 }}>{stat.icon}</span>
              </div>
              {stat.href && (
                <Link href={stat.href} style={{ position: "absolute", inset: 0, borderRadius: 16 }}>
                  <span style={{
                    position: "absolute", bottom: 12, right: 14,
                    fontSize: 11, fontWeight: 700, color: stat.color,
                    textDecoration: "none",
                  }}>View →</span>
                </Link>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Recent Bookings */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#1a2a38", margin: 0 }}>📥 Recent Bookings</h2>
              <Link href="/camfolder/bookings" style={{ fontSize: 12, color: "#4a7a9b", fontWeight: 600, textDecoration: "none" }}>View all →</Link>
            </div>
            {(recentBookings ?? []).length === 0 ? (
              <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, padding: "32px 20px" }}>No bookings yet</p>
            ) : (
              <div>
                {(recentBookings ?? []).map((b, i) => {
                  const ss = STATUS_BADGE[b.status as string] ?? STATUS_BADGE.new;
                  return (
                    <div key={b.id} style={{ padding: "12px 20px", borderTop: i > 0 ? "1px solid #f1f5f9" : "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#1a2a38", margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</p>
                        <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{b.service_type} · {formatDate(b.created_at as string)}</p>
                      </div>
                      <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, borderRadius: 99, padding: "3px 8px", background: ss.bg, color: ss.color, textTransform: "capitalize" }}>
                        {b.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Schedule */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#1a2a38", margin: 0 }}>📅 Upcoming Schedule</h2>
              <Link href="/camfolder/dispatch" style={{ fontSize: 12, color: "#4a7a9b", fontWeight: 600, textDecoration: "none" }}>Dispatch →</Link>
            </div>
            {(upcomingSchedule ?? []).length === 0 ? (
              <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, padding: "32px 20px" }}>Nothing scheduled</p>
            ) : (
              <div>
                {(upcomingSchedule ?? []).map((s, i) => (
                  <div key={s.id} style={{ padding: "12px 20px", borderTop: i > 0 ? "1px solid #f1f5f9" : "none", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ background: "#edf3f7", borderRadius: 8, padding: "6px 10px", textAlign: "center", flexShrink: 0 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#4a7a9b", margin: 0, textTransform: "uppercase" }}>
                        {new Date(s.scheduled_date as string + "T12:00:00").toLocaleDateString("en-US", { month: "short" })}
                      </p>
                      <p style={{ fontSize: 18, fontWeight: 800, color: "#1a2a38", margin: 0, lineHeight: 1 }}>
                        {new Date(s.scheduled_date as string + "T12:00:00").getDate()}
                      </p>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#1a2a38", margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.title ?? "Scheduled Job"}
                      </p>
                      {s.start_time && <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{s.start_time}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
