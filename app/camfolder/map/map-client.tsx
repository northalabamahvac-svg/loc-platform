"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

interface Project { id: string; name: string; address: string | null; trade: string | null; status: string; lat: number | null; lng: number | null; }

export default function MapClient({ projects }: { projects: Project[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  const pinned = projects.filter(p => p.lat && p.lng);
  const unpinned = projects.filter(p => !p.lat || !p.lng);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    if (pinned.length === 0) return;

    import("leaflet").then(L => {
      // Fix default icon paths for Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const center = pinned.length === 1
        ? [pinned[0].lat!, pinned[0].lng!]
        : [pinned.reduce((s, p) => s + p.lat!, 0) / pinned.length, pinned.reduce((s, p) => s + p.lng!, 0) / pinned.length];

      const map = L.map(mapRef.current!, { zoomControl: true }).setView(center as [number, number], 12);
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      pinned.forEach(p => {
        const marker = L.marker([p.lat!, p.lng!]).addTo(map);
        marker.bindPopup(`
          <div style="font-family:system-ui;min-width:160px">
            <p style="font-weight:800;margin:0 0 4px;font-size:14px">${p.name}</p>
            ${p.address ? `<p style="margin:0 0 4px;font-size:12px;color:#64748b">📍 ${p.address}</p>` : ""}
            ${p.trade ? `<p style="margin:0 0 8px;font-size:12px;color:#64748b">${p.trade}</p>` : ""}
            <a href="/camfolder/${p.id}" style="font-size:12px;font-weight:700;color:#5b5cf6">Open project →</a>
          </div>
        `);
      });

      if (pinned.length > 1) {
        const bounds = L.latLngBounds(pinned.map(p => [p.lat!, p.lng!] as [number, number]));
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    });

    return () => { mapInstance.current?.remove(); mapInstance.current = null; };
  }, []);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {pinned.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>📍</p>
          <p style={{ fontSize: 14, fontWeight: 600 }}>No GPS data yet</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Upload photos with location enabled to see projects on the map</p>
        </div>
      ) : (
        <>
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <div ref={mapRef} style={{ flex: 1 }} />
        </>
      )}

      {unpinned.length > 0 && (
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--bdr)", background: "var(--surf)", overflowX: "auto" }}>
          <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            No GPS yet ({unpinned.length})
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {unpinned.map(p => (
              <Link key={p.id} href={`/camfolder/${p.id}`}
                style={{ flexShrink: 0, borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 600, background: "var(--surfB)", border: "1px solid var(--bdr)", color: "var(--txt)", textDecoration: "none" }}>
                {p.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
