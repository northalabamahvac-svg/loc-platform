"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = { href: string; label: string; icon: string };
const NAV: NavItem[] = [
  { href: "/camfolder",           label: "Projects",  icon: "🏗️" },
  { href: "/camfolder/map",       label: "Live Map",  icon: "📍" },
  { href: "/camfolder/templates", label: "Templates", icon: "📋" },
];

export default function CamSidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Mobile top bar ───────────────────────────────── */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-50"
        style={{ background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
        <Link href="/camfolder" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <CamLogo size={32} />
          <span style={{ fontWeight: 800, fontSize: 16, color: "#0f172a" }}>CamFolder</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/camfolder/new" style={{ textDecoration: "none" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#fff" }}>+</div>
          </Link>
          <button onClick={() => setOpen(o => !o)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#475569", padding: 0, lineHeight: 1 }}>
            {open ? "✕" : "☰"}
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ────────────────────────────────── */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-[60] flex">
          <aside style={{ width: 240, background: "#fff", borderRight: "1px solid #e2e8f0", overflowY: "auto" }}>
            <SidebarContent pathname={pathname} userName={userName} />
          </aside>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.4)" }} onClick={() => setOpen(false)} />
        </div>
      )}

      {/* ── Mobile bottom nav ────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{ background: "#fff", borderTop: "1px solid #e2e8f0", display: "flex", height: 60, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <MobileNavTab href="/camfolder" icon={<HomeIcon />} label="Home" active={pathname === "/camfolder"} />
        <MobileNavTab href="/camfolder" icon={<ProjectsIcon />} label="Projects" active={false} />
        {/* Center camera button */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Link href="/camfolder/new" style={{ textDecoration: "none" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(37,99,235,0.4)", marginBottom: 8 }}>
              <CameraIcon />
            </div>
          </Link>
        </div>
        <MobileNavTab href="/camfolder/map" icon={<MapIcon />} label="Map" active={pathname.startsWith("/camfolder/map")} />
        <MobileNavTab href="/profile" icon={<ProfileIcon />} label="Profile" active={pathname === "/profile"} />
      </nav>

      {/* ── Desktop sidebar ──────────────────────────────── */}
      <aside className="hidden lg:flex"
        style={{ width: 220, minHeight: "100vh", background: "#fff", borderRight: "1px solid #e2e8f0", flexDirection: "column", position: "sticky", top: 0, height: "100vh", overflowY: "auto", flexShrink: 0 }}>
        <SidebarContent pathname={pathname} userName={userName} />
      </aside>
    </>
  );
}

function MobileNavTab({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link href={href} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, textDecoration: "none", color: active ? "#2563eb" : "#94a3b8" }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <span style={{ fontSize: 10, fontWeight: 600 }}>{label}</span>
    </Link>
  );
}

function SidebarContent({ pathname, userName }: { pathname: string; userName: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "0 0 16px" }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #f1f5f9" }}>
        <Link href="/camfolder" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <CamLogo size={36} />
          <div>
            <p style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", margin: 0, lineHeight: 1.2 }}>CamFolder</p>
            <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>Field Documentation</p>
          </div>
        </Link>
      </div>

      {/* User */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
          {userName?.[0]?.toUpperCase() ?? "U"}
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</p>
      </div>

      {/* New Project CTA */}
      <div style={{ padding: "12px 12px 0" }}>
        <Link href="/camfolder/new"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#2563eb", color: "#fff", fontWeight: 700, fontSize: 13, padding: "9px 0", borderRadius: 8, textDecoration: "none" }}>
          📍 New Project
        </Link>
      </div>

      {/* Nav */}
      <div style={{ padding: "16px 0 0" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", padding: "0 16px 6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Company</p>
        {NAV.map(item => {
          const active = item.href === "/camfolder" ? pathname === "/camfolder" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 16px 9px 12px", marginLeft: 4, marginRight: 4, marginBottom: 2,
                borderRadius: 8,
                background: active ? "#eff6ff" : "transparent",
                color: active ? "#2563eb" : "#475569",
                fontWeight: active ? 600 : 400, fontSize: 14,
                textDecoration: "none", transition: "background 0.15s",
              }}>
              <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ borderTop: "1px solid #f1f5f9", padding: "12px 0 0" }}>
        <Link href="/dashboard"
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px 9px 12px", marginLeft: 4, marginRight: 4, borderRadius: 8, color: "#94a3b8", fontSize: 13, textDecoration: "none" }}>
          <span style={{ fontSize: 16 }}>🏠</span> Main Dashboard
        </Link>
        <Link href="/profile"
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px 9px 12px", marginLeft: 4, marginRight: 4, borderRadius: 8, color: "#94a3b8", fontSize: 13, textDecoration: "none" }}>
          <span style={{ fontSize: 16 }}>👤</span> Profile
        </Link>
      </div>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────
export function CamLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" rx="8" fill="#2563eb" />
      <path d="M7 13.5C7 12.4 7.9 11.5 9 11.5H21C22.1 11.5 23 12.4 23 13.5V22.5C23 23.6 22.1 24.5 21 24.5H9C7.9 24.5 7 23.6 7 22.5V13.5Z" fill="white" />
      <path d="M23 16L29 13V23L23 20V16Z" fill="white" />
      <circle cx="15" cy="18" r="3" fill="#2563eb" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
      <path d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4z"/>
      <path d="M9 3L7.17 5H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.17L15 3H9zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/>
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
  );
}
