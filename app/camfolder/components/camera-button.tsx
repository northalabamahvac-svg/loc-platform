"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Project { id: string; name: string; }

const NON_PROJECT_SEGMENTS = new Set([
  "", "new", "welcome", "help", "map", "templates",
  "bookings", "dispatch", "analytics", "memberships", "followups",
]);

async function getGPS(): Promise<{ lat: number; lng: number } | null> {
  return new Promise(resolve => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 }
    );
  });
}

export default function CameraButton({ userId }: { userId: string }) {
  const pathname = usePathname();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const segment = pathname.replace(/^\/camfolder\/?/, "").split("/")[0];
  const isInProject = !!segment && !NON_PROJECT_SEGMENTS.has(segment);
  const currentProjectId = isInProject ? segment : null;

  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [showSelector, setShowSelector] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setGpsEnabled(user?.user_metadata?.gps_enabled !== false);
    });
  }, [supabase]);

  async function loadProjects() {
    setLoadingProjects(true);
    const { data } = await supabase
      .from("cf_project_members")
      .select("cf_projects(id, name, status)")
      .eq("user_id", userId);
    const list = ((data ?? []) as any[])
      .map(m => m.cf_projects)
      .filter((p: any) => p && p.name && p.status !== "archived");
    setProjects(list);
    setLoadingProjects(false);
  }

  function openCamera() {
    if (fileRef.current) {
      fileRef.current.value = "";
      fileRef.current.click();
    }
  }

  function handleButtonClick() {
    if (isInProject) {
      openCamera();
    } else {
      setShowSelector(true);
      setPendingProjectId(null);
      loadProjects();
    }
  }

  function handleProjectSelect(projectId: string) {
    setPendingProjectId(projectId);
    setShowSelector(false);
    setTimeout(openCamera, 200);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const projectId = currentProjectId ?? pendingProjectId;
    if (!projectId) return;

    setUploading(true);
    const gps = gpsEnabled ? await getGPS() : null;

    for (const file of files) {
      if (file.size > 15 * 1024 * 1024) continue;
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${projectId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("camfolder-photos")
        .upload(path, file, { upsert: false });
      if (upErr) continue;
      const { data: { publicUrl } } = supabase.storage
        .from("camfolder-photos")
        .getPublicUrl(path);
      await supabase.from("cf_photos").insert({
        project_id: projectId,
        user_id: userId,
        storage_url: publicUrl,
        gps_lat: gps?.lat ?? null,
        gps_lng: gps?.lng ?? null,
      });
    }

    setUploading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <>
      {/* Hidden file input — capture="environment" opens the back camera on mobile */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleFile}
        multiple
      />

      {/* Project selector bottom sheet */}
      {showSelector && (
        <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.5)" }} onClick={() => setShowSelector(false)} />
          <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "8px 0 48px", maxHeight: "60vh", display: "flex", flexDirection: "column" }}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: "#e5e7eb", margin: "8px auto 0", flexShrink: 0 }} />
            <p style={{ fontSize: 17, fontWeight: 800, color: "#1a2a38", padding: "16px 20px 0", margin: 0, flexShrink: 0 }}>
              📸 Which project?
            </p>
            <p style={{ fontSize: 13, color: "#94a3b8", padding: "4px 20px 12px", margin: 0, flexShrink: 0 }}>
              Choose a project to attach this photo or video to
            </p>
            <div style={{ overflowY: "auto", padding: "0 12px", flex: 1 }}>
              {loadingProjects ? (
                <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 14, padding: "24px 0" }}>Loading projects…</p>
              ) : projects.length === 0 ? (
                <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 14, padding: "24px 0" }}>No active projects found</p>
              ) : (
                projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleProjectSelect(p.id)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 14,
                      padding: "14px 16px", borderRadius: 14, marginBottom: 4,
                      background: "none", border: "none", cursor: "pointer", textAlign: "left",
                    }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "#edf3f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                      🏗️
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 600, color: "#1a2a38" }}>{p.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success toast */}
      {success && (
        <div style={{
          position: "fixed", bottom: 110, left: "50%", transform: "translateX(-50%)",
          zIndex: 80, background: "#1a2a38", color: "#fff", borderRadius: 99,
          padding: "12px 24px", fontSize: 14, fontWeight: 700,
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)", whiteSpace: "nowrap",
          animation: "fadeIn 0.2s ease",
        }}>
          ✅ Photo saved to project!
        </div>
      )}

      {/* The camera pill button */}
      <button
        onClick={handleButtonClick}
        disabled={uploading}
        style={{
          background: success ? "#22c55e" : "#1a2a38",
          borderRadius: 99, padding: "12px 28px",
          display: "flex", alignItems: "center", gap: 8,
          border: "none", cursor: uploading ? "default" : "pointer",
          transition: "background 0.3s",
          minWidth: 120, justifyContent: "center",
        }}>
        {uploading ? (
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Uploading…</span>
        ) : success ? (
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>✅ Saved!</span>
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4z"/>
              <path d="M9 3L7.17 5H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.17L15 3H9zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/>
            </svg>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Camera</span>
          </>
        )}
      </button>
    </>
  );
}
