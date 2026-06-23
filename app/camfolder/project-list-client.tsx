"use client";

import { useState } from "react";
import Link from "next/link";

interface Project {
  id: string; name: string; address: string | null; trade: string | null;
  status: string; created_at: string; myRole: string;
  photos: { url: string }[]; photoCount: number;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const QUICK_ACTIONS = [
  { href: "/camfolder/new", icon: <PlusIcon />, label: "Create\nProject" },
  { href: "/camfolder/map", icon: <MapIcon />, label: "Map" },
  { href: "/camfolder/templates", icon: <ListIcon />, label: "Templates" },
  { href: "/profile", icon: <TeamIcon />, label: "Profile" },
];

export default function ProjectListClient({ projects, userName }: { projects: Project[]; userName: string }) {
  const [filter, setFilter] = useState<"recent" | "starred" | "company">("recent");
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);

  const firstName = userName.split(" ")[0];

  const visible = projects.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.address ?? "").toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  // All recent photos across projects for activity strip
  const recentPhotos = projects.flatMap(p => p.photos.map(ph => ({ ...ph, projectName: p.name, projectId: p.id, created_at: p.created_at }))).slice(0, 8);

  return (
    <div style={{ minHeight: "100vh", background: "#f3f7fa" }}>

      {/* ── Desktop header ────────────────────────────────── */}
      <header className="hidden sm:flex" style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 24px", alignItems: "center", gap: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a2a38", margin: 0, flexShrink: 0 }}>Project Feed</h1>
        <div style={{ position: "relative", flex: 1, maxWidth: 380 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
            <SearchIconSm />
          </span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a project…"
            style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, color: "#1a2a38", background: "#f3f7fa", outline: "none", boxSizing: "border-box" }} />
        </div>
        <Link href="/camfolder/new" style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, background: "#4a7a9b", color: "#fff", fontWeight: 700, fontSize: 14, padding: "9px 18px", borderRadius: 10, textDecoration: "none" }}>
          📍 New Project
        </Link>
      </header>

      <main style={{ paddingBottom: 100 }}>

        {/* ── Mobile: greeting + quick actions ─────────────── */}
        <div className="sm:hidden" style={{ padding: "20px 16px 0" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1a2a38", margin: "0 0 18px", letterSpacing: "-0.5px" }}>
            Welcome, {firstName}
          </h1>

          {/* Quick actions */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 22 }}>
            {QUICK_ACTIONS.map((a, i) => (
              <Link key={i} href={a.href} style={{ textDecoration: "none" }}>
                <div style={{ background: "#fff", borderRadius: 14, padding: "14px 8px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "#1a2a38" }}>{a.icon}</div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#3c3c43", textAlign: "center", lineHeight: 1.3, whiteSpace: "pre-line" }}>{a.label}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: 16 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}><SearchIconSm /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a project…"
              style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10, borderRadius: 12, border: "none", fontSize: 15, color: "#1a2a38", background: "#fff", outline: "none", boxSizing: "border-box", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }} />
          </div>

          {/* Filter pills */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", marginBottom: 16 }}>
            {(["recent", "starred", "company"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ flexShrink: 0, padding: "7px 16px", borderRadius: 99, fontSize: 14, fontWeight: 600, cursor: "pointer", border: filter === f ? "none" : "1.5px solid #d1d5db", background: filter === f ? "#1a2a38" : "#fff", color: filter === f ? "#fff" : "#374151", transition: "all 0.15s", whiteSpace: "nowrap" }}>
                {f === "recent" ? "Recent" : f === "starred" ? "Starred" : "Company"}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop filter pills */}
        <div className="hidden sm:flex" style={{ padding: "20px 24px 0", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginRight: 4, textTransform: "uppercase", letterSpacing: "0.06em", alignSelf: "center" }}>Show</span>
          {(["recent", "company"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "6px 16px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: filter === f ? "#1a2a38" : "transparent", color: filter === f ? "#fff" : "#475569", transition: "all 0.15s" }}>
              {f === "recent" ? "Recent" : "All Projects"}
            </button>
          ))}
        </div>

        {/* ── Project list ──────────────────────────────────── */}
        {visible.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 16px" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📷</div>
            <p style={{ fontSize: 17, fontWeight: 600, color: "#1a2a38" }}>No projects yet</p>
            <p style={{ fontSize: 14, color: "#94a3b8", marginTop: 4, marginBottom: 20 }}>Create your first job site project</p>
            <Link href="/camfolder/new" style={{ background: "#4a7a9b", color: "#fff", fontWeight: 700, fontSize: 15, padding: "12px 24px", borderRadius: 12, textDecoration: "none", display: "inline-block" }}>
              Create Project
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile: full-bleed photo cards */}
            <div className="sm:hidden" style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>
              {visible.map(p => (
                <Link key={p.id} href={`/camfolder/${p.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ borderRadius: 18, overflow: "hidden", position: "relative", height: 200, background: "#1e293b", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}>
                    {p.photos[0] ? (
                      <img src={p.photos[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "#334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44 }}>📷</div>
                    )}
                    {/* Gradient overlay */}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)" }} />
                    {/* Star */}
                    <button onClick={e => e.preventDefault()} style={{ position: "absolute", top: 12, left: 12, background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(4px)" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </button>
                    {/* Camera icon */}
                    <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.2)", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                        <path d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4z"/>
                        <path d="M9 3L7.17 5H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.17L15 3H9zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/>
                      </svg>
                    </div>
                    {/* Text overlay */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 14px" }}>
                      <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.address ?? p.trade ?? "No address"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop: info + thumbnail grid cards */}
            <div className="hidden sm:flex" style={{ flexDirection: "column", gap: 12, padding: "12px 24px" }}>
              {visible.map(p => (
                <Link key={p.id} href={`/camfolder/${p.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 24px", display: "flex", gap: 24, alignItems: "flex-start", transition: "box-shadow 0.15s", cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1a2a38", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</h2>
                      {p.address && <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 2px" }}>📍 {p.address}</p>}
                      {p.trade && <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 12px" }}>{p.trade}</p>}
                      <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 14px" }}>Last Updated {formatDate(p.created_at)}</p>
                      <div style={{ display: "flex", gap: 28 }}>
                        <div>
                          <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Photos</p>
                          <p style={{ fontSize: 22, fontWeight: 800, color: "#1a2a38", margin: 0 }}>{p.photoCount}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Role</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: p.myRole === "owner" ? "#4a7a9b" : "#475569", margin: 0, textTransform: "capitalize" }}>{p.myRole}</p>
                        </div>
                      </div>
                    </div>
                    {p.photos.length > 0 ? (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 72px)", gridTemplateRows: "repeat(2, 72px)", gap: 4, flexShrink: 0 }}>
                        {p.photos.slice(0, 6).map((photo, i) => (
                          <img key={i} src={photo.url} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, display: "block" }} />
                        ))}
                      </div>
                    ) : (
                      <div style={{ width: 220, height: 148, borderRadius: 10, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 36 }}>📷</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* ── Mobile: Activity strip ────────────────────────── */}
        {recentPhotos.length > 0 && (
          <div className="sm:hidden" style={{ padding: "24px 0 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 12px" }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1a2a38", margin: 0 }}>Activity</h2>
              <span style={{ fontSize: 15, color: "#4a7a9b", fontWeight: 600 }}>See All</span>
            </div>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 16px 4px", scrollbarWidth: "none" }}>
              {recentPhotos.map((ph, i) => (
                <Link key={i} href={`/camfolder/${ph.projectId}`} style={{ textDecoration: "none", flexShrink: 0 }}>
                  <div style={{ position: "relative", width: 110, height: 110, borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                    <img src={ph.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.55)", borderRadius: 99, padding: "2px 8px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{timeAgo(ph.created_at)}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: "#64748b", marginTop: 5, width: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ph.projectName}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────
function PlusIcon() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>;
}
function MapIcon() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>;
}
function ListIcon() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>;
}
function TeamIcon() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>;
}
function SearchIconSm() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>;
}
