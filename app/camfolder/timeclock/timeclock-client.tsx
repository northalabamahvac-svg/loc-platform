"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface Project { id: string; name: string; address: string | null; status: string; }
interface TimeEntry {
  id: string; project_id: string; user_id: string;
  clock_in_at: string; clock_in_type: string; clock_in_verified: boolean; clock_in_distance_m: number | null;
  clock_out_at: string | null; clock_out_type: string | null;
}

function durMin(r: TimeEntry): number {
  if (!r.clock_out_at) return Math.floor((Date.now() - new Date(r.clock_in_at).getTime()) / 60000);
  return Math.floor((new Date(r.clock_out_at).getTime() - new Date(r.clock_in_at).getTime()) / 60000);
}

function fmtDur(min: number) {
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function TimeclockClient({ projects, records, userMap, currentUserId }: {
  projects: Project[];
  records: TimeEntry[];
  userMap: { [uid: string]: string };
  currentUserId: string;
}) {
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");

  const filtered = useMemo(() => {
    return records.filter(r =>
      (filterProject === "all" || r.project_id === filterProject) &&
      (filterUser === "all" || r.user_id === filterUser)
    );
  }, [records, filterProject, filterUser]);

  // Currently clocked in
  const liveShifts = records.filter(r => !r.clock_out_at);

  // All unique users
  const allUsers = [...new Set(records.map(r => r.user_id))];

  // Total hours per user per project
  const totals: { [uid: string]: { [pid: string]: number } } = {};
  records.forEach(r => {
    if (!totals[r.user_id]) totals[r.user_id] = {};
    if (!totals[r.user_id][r.project_id]) totals[r.user_id][r.project_id] = 0;
    totals[r.user_id][r.project_id] += durMin(r);
  });

  const projectMap: { [id: string]: string } = {};
  projects.forEach(p => { projectMap[p.id] = p.name; });

  return (
    <div style={{ minHeight: "100vh", background: "#f3f7fa" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/camfolder" style={{ fontSize: 13, color: "#94a3b8", textDecoration: "none" }}>← Projects</Link>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1a2a38", margin: 0 }}>⏱️ Time Tracker</h1>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 80px" }}>

        {/* Live — currently clocked in */}
        {liveShifts.length > 0 && (
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 16, padding: "16px 20px", marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#166534", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.07em" }}>🟢 Currently On Site</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {liveShifts.map(r => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", borderRadius: 10, padding: "10px 14px" }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#1a2a38", margin: 0 }}>{userMap[r.user_id] ?? r.user_id.slice(0, 8)}</p>
                    <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>{projectMap[r.project_id]} · In at {fmtTime(r.clock_in_at)}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "#15803d", margin: 0 }}>{fmtDur(durMin(r))}</p>
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{r.clock_in_type.toUpperCase()} {r.clock_in_verified ? "✅" : "⚠️"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, background: "#fff", color: "#1a2a38", outline: "none" }}>
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filterUser} onChange={e => setFilterUser(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, background: "#fff", color: "#1a2a38", outline: "none" }}>
            <option value="all">All Employees</option>
            {allUsers.map(uid => <option key={uid} value={uid}>{userMap[uid] ?? uid.slice(0, 8)}</option>)}
          </select>
        </div>

        {/* Hours summary cards */}
        {filterProject === "all" && filterUser === "all" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
            {allUsers.map(uid => {
              const totalMin = Object.values(totals[uid] ?? {}).reduce((a: number, b: number) => a + b, 0);
              return (
                <div key={uid} style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1px solid #e2e8f0" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2a38", margin: "0 0 4px" }}>{userMap[uid] ?? uid.slice(0, 8)}</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: "#4a7a9b", margin: 0 }}>{fmtDur(totalMin)}</p>
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>total logged</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Records table */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
            <p style={{ fontSize: 36, margin: "0 0 12px" }}>⏱️</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#1a2a38" }}>No time records yet</p>
            <p style={{ fontSize: 13 }}>Records appear here once employees clock in</p>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            {filtered.map((r, i) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#1a2a38", margin: 0 }}>{userMap[r.user_id] ?? r.user_id.slice(0, 8)}</p>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>
                    {filterProject === "all" ? `${projectMap[r.project_id]} · ` : ""}{fmtDate(r.clock_in_at)}
                  </p>
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: "1px 0 0" }}>
                    {fmtTime(r.clock_in_at)} → {r.clock_out_at ? fmtTime(r.clock_out_at) : "Active"}
                    {" · "}{r.clock_in_type.toUpperCase()}
                    {r.clock_in_verified ? " ✅" : " ⚠️"}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: r.clock_out_at ? "#1a2a38" : "#15803d", margin: 0 }}>
                    {fmtDur(durMin(r))}
                  </p>
                  {!r.clock_out_at && <p style={{ fontSize: 11, color: "#15803d", margin: 0 }}>live</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
