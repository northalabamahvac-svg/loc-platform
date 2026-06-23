"use client";

import { useState } from "react";
import Link from "next/link";

interface Project {
  id: string; name: string; address: string | null; trade: string | null;
  status: string; created_at: string; myRole: string;
  photos: { url: string }[]; photoCount: number;
}

const STATUS_DOT: Record<string, string> = {
  active: "#10b981",
  completed: "#6366f1",
  archived: "#94a3b8",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function ProjectListClient({ projects }: { projects: Project[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "mine">("all");

  const visible = projects.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.address ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "active" && p.status === "active") || filter === "mine";
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Top header — hidden on mobile (sidebar handles it) */}
      <header className="hidden sm:flex" style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 24px", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0, flexShrink: 0 }}>Project Feed</h1>
        <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 400 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14 }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Find a project…"
            style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, color: "#0f172a", background: "#f8fafc", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ marginLeft: "auto" }}>
          <Link href="/camfolder/new"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: 14, padding: "9px 18px", borderRadius: 8, textDecoration: "none" }}>
            📍 New Project
          </Link>
        </div>
      </header>

      {/* Mobile search bar */}
      <div className="sm:hidden" style={{ padding: "10px 12px", background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 14 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a project…"
            style={{ width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 20, border: "1px solid #e2e8f0", fontSize: 14, color: "#0f172a", background: "#f1f5f9", outline: "none", boxSizing: "border-box" }} />
        </div>
      </div>

      <main style={{ padding: "16px 12px", maxWidth: 1100, margin: "0 auto" }} className="sm:p-6 sm:px-6"
      >
        {/* Filter tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 20 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginRight: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Show</span>
          {(["all", "active", "mine"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
                background: filter === f ? "#0f172a" : "transparent",
                color: filter === f ? "#fff" : "#475569",
                transition: "all 0.15s",
              }}>
              {f === "all" ? "All Projects" : f === "active" ? "Active" : "My Projects"}
            </button>
          ))}
        </div>

        {/* Project cards */}
        {visible.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontSize: 48, marginBottom: 12 }}>📷</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>No projects found</p>
            <p style={{ fontSize: 14, color: "#94a3b8", marginTop: 4 }}>
              {search ? "Try a different search" : "Create your first project to get started"}
            </p>
            {!search && (
              <Link href="/camfolder/new" style={{ display: "inline-block", marginTop: 16, background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: 14, padding: "10px 20px", borderRadius: 8, textDecoration: "none" }}>
                Create First Project →
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {visible.map(p => (
              <Link key={p.id} href={`/camfolder/${p.id}`} style={{ textDecoration: "none" }}>
                <div className="project-card"
                  style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "box-shadow 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>

                  {/* Mobile layout: thumbnail left, info right */}
                  <div className="sm:hidden" style={{ display: "flex", alignItems: "stretch" }}>
                    {p.photos.length > 0 ? (
                      <img src={p.photos[0].url} alt="" style={{ width: 90, height: 90, objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 90, height: 90, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 26 }}>📷</div>
                    )}
                    <div style={{ padding: "10px 12px", flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_DOT[p.status] ?? STATUS_DOT.active, flexShrink: 0 }} />
                        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</h2>
                      </div>
                      {p.address && <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📍 {p.address}</p>}
                      <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0" }}>{p.photoCount} photos · {formatDate(p.created_at)}</p>
                    </div>
                    <div style={{ padding: "10px 12px 10px 0", display: "flex", alignItems: "center" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#94a3b8"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
                    </div>
                  </div>

                  {/* Desktop layout: info left, thumbnail grid right */}
                  <div className="hidden sm:flex" style={{ padding: "20px 24px", gap: 24, alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_DOT[p.status] ?? STATUS_DOT.active, flexShrink: 0 }} />
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</h2>
                      </div>
                      {p.address && <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 2px" }}>📍 {p.address}</p>}
                      {p.trade && <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 12px" }}>{p.trade}</p>}
                      <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 14px" }}>Last Updated {formatDate(p.created_at)}</p>
                      <div style={{ display: "flex", gap: 28 }}>
                        <div>
                          <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Photos</p>
                          <p style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>{p.photoCount}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Role</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: p.myRole === "owner" ? "#2563eb" : "#475569", margin: 0, textTransform: "capitalize" }}>{p.myRole}</p>
                        </div>
                      </div>
                    </div>
                    {p.photos.length > 0 ? (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 72px)", gridTemplateRows: "repeat(2, 72px)", gap: 4, flexShrink: 0 }}>
                        {p.photos.slice(0, 6).map((photo, i) => (
                          <img key={i} src={photo.url} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 6, display: "block" }} />
                        ))}
                      </div>
                    ) : (
                      <div style={{ width: 220, height: 148, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 36 }}>📷</div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
