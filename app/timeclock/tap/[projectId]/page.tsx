"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";

function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getGPS(): Promise<{ lat: number; lng: number } | null> {
  return new Promise(resolve => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { timeout: 6000 }
    );
  });
}

export default function TimeclockTapPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [openShift, setOpenShift] = useState<any>(null);
  const [elapsed, setElapsed] = useState("");
  const [punching, setPunching] = useState(false);
  const [result, setResult] = useState<"in" | "out" | null>(null);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState<boolean | null>(null);
  const [distanceM, setDistanceM] = useState<number | null>(null);

  const load = useCallback(async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) {
      router.push(`/login?next=/timeclock/tap/${projectId}`);
      return;
    }
    setUser(u);

    const { data: proj } = await supabase.from("cf_projects").select("id, name, address").eq("id", projectId).single();
    setProject(proj);

    const { data: shift } = await supabase
      .from("cf_timeclock")
      .select("id, clock_in_at, clock_in_type, clock_in_verified")
      .eq("project_id", projectId)
      .eq("user_id", u.id)
      .is("clock_out_at", null)
      .order("clock_in_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setOpenShift(shift ?? null);
    setLoading(false);
  }, [supabase, projectId, router]);

  useEffect(() => { load(); }, [load]);

  // Live elapsed timer
  useEffect(() => {
    if (!openShift) return;
    const tick = () => {
      const ms = Date.now() - new Date(openShift.clock_in_at).getTime();
      setElapsed(formatDuration(ms));
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [openShift]);

  async function punch() {
    setPunching(true); setError("");
    const gps = await getGPS();
    const res = await fetch("/api/timeclock/punch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        type: "nfc",
        gps_lat: gps?.lat ?? null,
        gps_lng: gps?.lng ?? null,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Something went wrong"); setPunching(false); return; }
    setResult(data.action);
    if (data.action === "in") {
      setVerified(data.verified);
      setDistanceM(data.distance_m);
    }
    setPunching(false);
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 15 }}>Loading…</div>
    );
  }

  if (result) {
    return (
      <div style={{ background: "#fff", borderRadius: 24, padding: 40, maxWidth: 360, width: "100%", textAlign: "center", boxShadow: "0 4px 32px rgba(0,0,0,0.1)" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{result === "in" ? "✅" : "👋"}</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a2a38", margin: "0 0 8px" }}>
          {result === "in" ? "Clocked In!" : "Clocked Out!"}
        </h1>
        <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 8px" }}>{project?.name}</p>
        {result === "in" && verified !== null && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: verified ? "#f0fdf4" : "#fef9ec", border: `1px solid ${verified ? "#86efac" : "#fcd34d"}`, borderRadius: 8, padding: "6px 12px", marginTop: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: verified ? "#166534" : "#92400e" }}>
              {verified ? "✅ On-site verified" : distanceM != null ? `⚠️ ${distanceM}m from site` : "📍 GPS not verified"}
            </span>
          </div>
        )}
        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 16 }}>You can close this tab</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", borderRadius: 24, padding: 36, maxWidth: 360, width: "100%", boxShadow: "0 4px 32px rgba(0,0,0,0.1)" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: "#edf3f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 16px" }}>🏗️</div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1a2a38", margin: "0 0 4px" }}>{project?.name ?? "Job Site"}</h1>
        {project?.address && <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>📍 {project.address}</p>}
      </div>

      {/* Status */}
      {openShift ? (
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 14, padding: "16px 20px", textAlign: "center", marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#166534", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.07em" }}>Currently Clocked In</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: "#15803d", margin: 0 }}>{elapsed || "…"}</p>
          <p style={{ fontSize: 11, color: "#4ade80", margin: "4px 0 0" }}>
            Since {new Date(openShift.clock_in_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            {openShift.clock_in_verified ? " · ✅ Verified" : ""}
          </p>
        </div>
      ) : (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: "16px 20px", textAlign: "center", marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Not clocked in</p>
        </div>
      )}

      {/* Punch button */}
      <button
        onClick={punch}
        disabled={punching}
        style={{
          width: "100%", padding: "18px 0", borderRadius: 16, border: "none",
          background: openShift ? "#d4838d" : "#1a2a38",
          color: "#fff", fontSize: 17, fontWeight: 800, cursor: punching ? "default" : "pointer",
          opacity: punching ? 0.7 : 1, transition: "opacity 0.2s",
        }}>
        {punching ? "Recording…" : openShift ? "🔴 Clock Out" : "🟢 Clock In"}
      </button>

      {error && (
        <p style={{ fontSize: 13, color: "#dc2626", textAlign: "center", marginTop: 12 }}>{error}</p>
      )}

      <p style={{ fontSize: 11, color: "#cbd5e1", textAlign: "center", marginTop: 16, margin: "16px 0 0" }}>
        Signed in as {user?.email}
      </p>
    </div>
  );
}
