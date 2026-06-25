"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import CameraButton from "./camera-button";

type NavItem = { href: string; label: string; icon: string };
const NAV: NavItem[] = [
  { href: "/camfolder",              label: "Projects",   icon: "🏗️" },
  { href: "/camfolder/map",          label: "Live Map",   icon: "📍" },
  { href: "/camfolder/templates",    label: "Templates",  icon: "📋" },
  { href: "/camfolder/bookings",     label: "Bookings",   icon: "📥" },
  { href: "/camfolder/dispatch",     label: "Dispatch",   icon: "📅" },
  { href: "/camfolder/analytics",    label: "Analytics",  icon: "📊" },
  { href: "/camfolder/memberships",  label: "Members",    icon: "🤝" },
  { href: "/camfolder/followups",    label: "Follow-ups", icon: "✉️" },
];

export default function CamSidebar({ userName, userId }: { userName: string; userId: string }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const initials = userName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      {/* ── Mobile top bar — fixed so it doesn't sit inside the flex row ── */}
      <header className="lg:hidden flex items-center justify-between px-4"
        style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "#f3f7fa", height: 52 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setDrawerOpen(true)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#4a7a9b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>
              {initials || "BB"}
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#3c3c43" opacity="0.6">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
          </button>
        </div>
        <Link href="/camfolder" style={{ position: "absolute", left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none", textDecoration: "none" }}>
          <span style={{ pointerEvents: "auto" }}><CamLogo size={28} /></span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#3c3c43" opacity="0.6">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 0, position: "relative" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#3c3c43" opacity="0.6">
              <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ── Mobile drawer (bottom sheet style) ───────────── */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] flex flex-col justify-end">
          <div style={{ flex: 1, background: "rgba(0,0,0,0.5)" }} onClick={() => setDrawerOpen(false)} />
          <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "8px 0 32px", boxShadow: "0 -4px 30px rgba(0,0,0,0.15)" }}>
            {/* Handle */}
            <div style={{ width: 36, height: 4, borderRadius: 99, background: "#e5e7eb", margin: "8px auto 20px" }} />
            <div style={{ padding: "0 4px" }}>
              {NAV.map(item => {
                const active = item.href === "/camfolder" ? pathname === "/camfolder" : pathname.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href} onClick={() => setDrawerOpen(false)}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderRadius: 14, marginBottom: 4, background: active ? "#edf3f7" : "transparent", color: active ? "#4a7a9b" : "#1a2a38", fontWeight: active ? 700 : 500, fontSize: 17, textDecoration: "none" }}>
                    <span style={{ fontSize: 22 }}>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
              <div style={{ height: 1, background: "#f1f5f9", margin: "8px 20px 8px" }} />
              <Link href="/profile" onClick={() => setDrawerOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderRadius: 14, color: "#64748b", fontWeight: 500, fontSize: 17, textDecoration: "none" }}>
                <span style={{ fontSize: 22 }}>👤</span> Profile
              </Link>
              <Link href="/camfolder/help" onClick={() => setDrawerOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderRadius: 14, color: "#64748b", fontWeight: 500, fontSize: 17, textDecoration: "none" }}>
                <span style={{ fontSize: 22 }}>❓</span> Help
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile floating action pill ───────────────────── */}
      <div className="lg:hidden fixed z-50" style={{ bottom: 24, left: "50%", transform: "translateX(-50%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#fff", borderRadius: 99, padding: "8px 12px", boxShadow: "0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.08)" }}>
          <Link href="/camfolder/new" style={{ textDecoration: "none" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f3f7fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#1a2a38">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </div>
          </Link>
          <CameraButton userId={userId} />
          <Link href="/camfolder/map" style={{ textDecoration: "none" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f3f7fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#1a2a38">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
              </svg>
            </div>
          </Link>
        </div>
      </div>

      {/* ── Desktop sidebar ──────────────────────────────── */}
      <aside className="hidden lg:flex"
        style={{ width: 220, minHeight: "100vh", background: "#fff", borderRight: "1px solid #e2e8f0", flexDirection: "column", position: "sticky", top: 0, height: "100vh", overflowY: "auto", flexShrink: 0 }}>
        <SidebarContent pathname={pathname} userName={userName} initials={initials} />
      </aside>
    </>
  );
}

function SidebarContent({ pathname, userName, initials }: { pathname: string; userName: string; initials: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "0 0 16px" }}>
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #f1f5f9" }}>
        <Link href="/camfolder" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <CamLogo size={36} />
          <div>
            <p style={{ fontWeight: 800, fontSize: 15, color: "#1a2a38", margin: 0, lineHeight: 1.2 }}>CamBBC</p>
            <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>Field Documentation</p>
          </div>
        </Link>
      </div>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#4a7a9b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
          {initials || "BB"}
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#1a2a38", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</p>
      </div>
      <div style={{ padding: "12px 12px 0" }}>
        <Link href="/camfolder/new" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#4a7a9b", color: "#fff", fontWeight: 700, fontSize: 13, padding: "10px 0", borderRadius: 10, textDecoration: "none" }}>
          📍 New Project
        </Link>
      </div>
      <div style={{ padding: "16px 0 0" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", padding: "0 16px 6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Company</p>
        {NAV.map(item => {
          const active = item.href === "/camfolder" ? pathname === "/camfolder" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px 9px 12px", marginLeft: 4, marginRight: 4, marginBottom: 2, borderRadius: 8, background: active ? "#edf3f7" : "transparent", color: active ? "#4a7a9b" : "#475569", fontWeight: active ? 600 : 400, fontSize: 14, textDecoration: "none", transition: "background 0.15s" }}>
              <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ borderTop: "1px solid #f1f5f9", padding: "12px 0 0" }}>
        <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px 9px 12px", marginLeft: 4, marginRight: 4, borderRadius: 8, color: "#94a3b8", fontSize: 13, textDecoration: "none" }}>
          <span style={{ fontSize: 16 }}>👤</span> Profile
        </Link>
        <Link href="/camfolder/help" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px 9px 12px", marginLeft: 4, marginRight: 4, borderRadius: 8, color: "#94a3b8", fontSize: 13, textDecoration: "none" }}>
          <span style={{ fontSize: 16 }}>❓</span> Help
        </Link>
      </div>
    </div>
  );
}

export function CamLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Camera body */}
      <rect x="8" y="30" width="84" height="60" rx="12" fill="#7899af"/>
      {/* Viewfinder bump */}
      <rect x="18" y="16" width="32" height="18" rx="8" fill="#6a88a0"/>
      {/* Flash dot */}
      <circle cx="72" cy="24" r="8" fill="#d4838d"/>
      {/* Lens — brown outer ring */}
      <circle cx="50" cy="62" r="24" fill="#8b5e3c"/>
      {/* Lens — pink ring */}
      <circle cx="50" cy="62" r="19" fill="#e8a0a8"/>
      {/* Lens — dark ring */}
      <circle cx="50" cy="62" r="14" fill="#1a2a38"/>
      {/* Lens — blue-teal center */}
      <circle cx="50" cy="62" r="9" fill="#4a7a9b"/>
      {/* Lens highlight */}
      <circle cx="43" cy="55" r="4" fill="#6b9ab8" opacity="0.6"/>
      <circle cx="42" cy="54" r="2.5" fill="white" opacity="0.5"/>
    </svg>
  );
}

export function CamLogoFull({ size = 120 }: { size?: number }) {
  const h = Math.round(size * 1.25);
  return (
    <svg width={size} height={h} viewBox="0 0 100 125" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Camera strap lines */}
      <line x1="22" y1="86" x2="2" y2="118" stroke="#1a1a1a" strokeWidth="5" strokeLinecap="round"/>
      <line x1="78" y1="86" x2="98" y2="118" stroke="#1a1a1a" strokeWidth="5" strokeLinecap="round"/>
      {/* Camera body */}
      <rect x="8" y="30" width="84" height="60" rx="12" fill="#7899af"/>
      {/* Viewfinder bump */}
      <rect x="18" y="16" width="32" height="18" rx="8" fill="#6a88a0"/>
      {/* Flash dot */}
      <circle cx="72" cy="24" r="8" fill="#d4838d"/>
      {/* Lens — brown outer ring */}
      <circle cx="50" cy="62" r="24" fill="#8b5e3c"/>
      {/* Lens — pink ring */}
      <circle cx="50" cy="62" r="19" fill="#e8a0a8"/>
      {/* Lens — dark ring */}
      <circle cx="50" cy="62" r="14" fill="#1a2a38"/>
      {/* Lens — blue-teal center */}
      <circle cx="50" cy="62" r="9" fill="#4a7a9b"/>
      {/* Lens highlight */}
      <circle cx="43" cy="55" r="4" fill="#6b9ab8" opacity="0.6"/>
      <circle cx="42" cy="54" r="2.5" fill="white" opacity="0.5"/>
    </svg>
  );
}
