"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import ThemePicker from "@/components/theme-picker";
import SignOutButton from "@/components/sign-out-button";

interface Project { id: string; name: string; address: string | null; trade: string | null; status: string; }
interface Photo { id: string; storage_url: string; note: string | null; gps_lat: number | null; gps_lng: number | null; taken_at: string; }
interface DailyLog { id: string; log_date: string; content: string; raw_notes: string | null; created_at: string; }

type Tab = "photos" | "daily-log" | "past-logs" | "team";

const inputStyle: React.CSSProperties = {
  background: "var(--surfB)", border: "1px solid var(--bdr)", color: "var(--txt)",
  borderRadius: 8, padding: "10px 14px", fontSize: 14, width: "100%", outline: "none",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ProjectDashboard({ project, initialPhotos, initialLogs, userId, role }: {
  project: Project; initialPhotos: Photo[]; initialLogs: DailyLog[]; userId: string; role: "owner" | "staff" | "viewer";
}) {
  const [tab, setTab] = useState<Tab>("photos");
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [logs, setLogs] = useState<DailyLog[]>(initialLogs);
  const supabase = createClient();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between" style={{
        background: "rgba(15,15,30,0.85)", borderBottom: "1px solid var(--bdr)",
        backdropFilter: "blur(8px)", position: "sticky", top: 0, zIndex: 50,
      }}>
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/camfolder" className="text-xs font-semibold hover:opacity-70 flex-shrink-0" style={{ color: "var(--muted-hi)" }}>← Projects</Link>
          <div style={{ width: 1, height: 16, background: "var(--bdr)", flexShrink: 0 }} />
          <div className="min-w-0">
            <p className="text-xs truncate" style={{ color: "var(--muted)" }}>📷 CamFolder {project.trade ? `· ${project.trade}` : ""}</p>
            <h1 className="text-sm font-bold truncate" style={{ color: "var(--txt-hi)" }}>{project.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ThemePicker />
          <SignOutButton />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        {project.address && (
          <p className="text-xs" style={{ color: "var(--muted)" }}>📍 {project.address}</p>
        )}

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl p-1" style={{ background: "var(--surfB)" }}>
          {([
            { key: "photos", label: "📷 Photos" },
            { key: "daily-log", label: "🤖 AI Daily Log", hide: role === "viewer" },
            { key: "past-logs", label: "📋 Past Logs" },
            { key: "team", label: "👥 Team", hide: role !== "owner" },
          ] as { key: Tab; label: string; hide?: boolean }[]).filter(t => !t.hide).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 rounded-lg py-2 text-xs font-semibold transition-all"
              style={{
                background: tab === t.key ? "var(--surf)" : "transparent",
                color: tab === t.key ? "var(--txt-hi)" : "var(--muted)",
                border: tab === t.key ? "1px solid var(--bdr)" : "1px solid transparent",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "photos" && (
          <PhotosTab project={project} photos={photos} userId={userId} role={role}
            onAdd={p => setPhotos(prev => [p, ...prev])}
            onDelete={id => setPhotos(prev => prev.filter(p => p.id !== id))} />
        )}
        {tab === "daily-log" && role !== "viewer" && (
          <DailyLogTab project={project} photos={photos} userId={userId}
            onSave={log => setLogs(prev => [log, ...prev.filter(l => l.log_date !== log.log_date)])} />
        )}
        {tab === "past-logs" && (
          <PastLogsTab logs={logs} onDelete={id => setLogs(prev => prev.filter(l => l.id !== id))} />
        )}
        {tab === "team" && role === "owner" && (
          <TeamTab project={project} userId={userId} />
        )}
      </main>
    </div>
  );
}

// ─── Photos Tab ────────────────────────────────────────────────────────────────
function PhotosTab({ project, photos, userId, role, onAdd, onDelete }: {
  project: Project; photos: Photo[]; userId: string; role: string;
  onAdd: (p: Photo) => void; onDelete: (id: string) => void;
}) {
  const canUpload = role === "owner" || role === "staff";
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const getGPS = (): Promise<{ lat: number; lng: number } | null> =>
    new Promise(resolve => {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => resolve(null),
        { timeout: 5000 }
      );
    });

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true); setError("");
    const gps = await getGPS();

    for (const file of files) {
      if (file.size > 15 * 1024 * 1024) { setError(`${file.name} is over 15MB — skipped.`); continue; }
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${project.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("camfolder-photos").upload(path, file, { upsert: false });
      if (upErr) { setError(upErr.message); continue; }
      const { data: { publicUrl } } = supabase.storage.from("camfolder-photos").getPublicUrl(path);
      const { data, error: dbErr } = await supabase.from("cf_photos").insert({
        project_id: project.id, user_id: userId, storage_url: publicUrl,
        note: note.trim() || null, gps_lat: gps?.lat ?? null, gps_lng: gps?.lng ?? null,
      }).select().single() as any;
      if (!dbErr && data) onAdd(data as Photo);
    }
    setNote(""); setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function deletePhoto(photo: Photo) {
    if (!confirm("Delete this photo?")) return;
    setDeleting(photo.id);
    const path = photo.storage_url.split("/camfolder-photos/")[1];
    if (path) await supabase.storage.from("camfolder-photos").remove([path]);
    await supabase.from("cf_photos").delete().eq("id", photo.id);
    onDelete(photo.id);
    setDeleting(null);
  }

  return (
    <div className="space-y-4">
      {/* Upload area — staff and owners only */}
      {canUpload && <div className="rounded-2xl p-4" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: "var(--txt-hi)" }}>Add Photos</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: "var(--muted-hi)" }}>Note (applies to all selected photos)</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="What does this show? (e.g. existing ductwork before demo)" style={inputStyle} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex-1 rounded-xl py-3 text-sm font-bold transition-opacity disabled:opacity-50 hover:opacity-80"
              style={{ background: "var(--accent)", color: "#fff" }}>
              {uploading ? "Uploading…" : "📷 Choose Photos"}
            </button>
            <button onClick={() => { if (fileRef.current) { fileRef.current.setAttribute("capture", "environment"); fileRef.current.click(); } }}
              disabled={uploading}
              className="rounded-xl px-4 py-3 text-sm font-bold transition-opacity disabled:opacity-50 hover:opacity-80"
              style={{ background: "var(--surfB)", border: "1px solid var(--bdr)", color: "var(--txt)" }}>
              📸 Camera
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={upload} />
          {error && <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(220,38,38,0.15)", color: "var(--red-t)" }}>{error}</p>}
          <p className="text-xs" style={{ color: "var(--muted)" }}>GPS location is captured automatically · Max 15MB per file</p>
        </div>
      </div>}

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ border: "1px dashed var(--bdr)" }}>
          <p className="text-3xl mb-2">📷</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>No photos yet — upload your first site photo above</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map(photo => (
            <div key={photo.id} className="rounded-xl overflow-hidden relative group cursor-pointer"
              style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}
              onClick={() => setExpanded(expanded === photo.id ? null : photo.id)}>
              <img src={photo.storage_url} alt={photo.note ?? "Site photo"} className="w-full object-cover" style={{ height: 140 }} />
              {photo.note && (
                <div className="px-2 py-1.5">
                  <p className="text-xs line-clamp-2" style={{ color: "var(--txt)" }}>{photo.note}</p>
                </div>
              )}
              <div className="px-2 pb-1.5 flex items-center justify-between">
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {formatDate(photo.taken_at)}
                  {photo.gps_lat && <span> · 📍GPS</span>}
                </p>
                <button onClick={e => { e.stopPropagation(); deletePhoto(photo); }} disabled={deleting === photo.id}
                  className="text-xs transition-opacity hover:opacity-70 disabled:opacity-30"
                  style={{ color: "var(--red-t)" }}>
                  {deleting === photo.id ? "…" : "Delete"}
                </button>
              </div>
              {/* Expanded overlay */}
              {expanded === photo.id && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.9)" }}
                  onClick={() => setExpanded(null)}>
                  <div className="max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                    <img src={photo.storage_url} alt="" className="w-full rounded-xl mb-3 max-h-[70vh] object-contain" />
                    {photo.note && <p className="text-sm text-center" style={{ color: "var(--txt)" }}>{photo.note}</p>}
                    <p className="text-xs text-center mt-1" style={{ color: "var(--muted)" }}>
                      {formatDate(photo.taken_at)}{photo.gps_lat ? ` · 📍 ${photo.gps_lat.toFixed(5)}, ${photo.gps_lng?.toFixed(5)}` : ""}
                    </p>
                    <button onClick={() => setExpanded(null)} className="block mx-auto mt-4 text-sm font-bold rounded-lg px-4 py-2" style={{ background: "var(--surfB)", color: "var(--txt)" }}>
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Daily Log Tab ─────────────────────────────────────────────────────────────
function DailyLogTab({ project, photos, userId, onSave }: {
  project: Project; photos: Photo[]; userId: string; onSave: (log: DailyLog) => void;
}) {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const todayPhotos = photos.filter(p => p.taken_at.slice(0, 10) === today);
  const [fieldNotes, setFieldNotes] = useState("");
  const [crew, setCrew] = useState("");
  const [weather, setWeather] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setGenerating(true); setError(""); setGenerated("");
    const photoNotes = photos.slice(0, 20).map((p, i) =>
      `Photo ${i + 1} (${formatDate(p.taken_at)}): ${p.note ?? "No note"}`
    ).join("\n");

    const res = await fetch("/api/camfolder/generate-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectName: project.name,
        address: project.address,
        trade: project.trade,
        date: today,
        crew: crew.trim() || null,
        weather: weather.trim() || null,
        fieldNotes: fieldNotes.trim() || null,
        photoNotes: photoNotes || null,
        photoCount: photos.length,
        todayPhotoCount: todayPhotos.length,
      }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Failed to generate"); setGenerating(false); return; }
    setGenerated(json.log);
    setGenerating(false);
  }

  async function saveLog() {
    if (!generated.trim()) return;
    setSaving(true); setSaved(false);
    const rawNotes = [
      crew ? `Crew: ${crew}` : "",
      weather ? `Weather: ${weather}` : "",
      fieldNotes ? `Field Notes: ${fieldNotes}` : "",
    ].filter(Boolean).join("\n");

    const { data, error: err } = await supabase.from("cf_daily_logs").upsert({
      project_id: project.id, user_id: userId, log_date: today,
      content: generated, raw_notes: rawNotes || null,
    }, { onConflict: "project_id,log_date" }).select().single() as any;

    if (err) { setError(err.message); } else { setSaved(true); onSave(data); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold" style={{ color: "var(--txt-hi)" }}>🤖 AI Daily Log Generator</h3>
          <span className="text-xs font-semibold rounded-full px-2 py-0.5" style={{ background: "rgba(91,92,246,0.15)", color: "var(--accent-hi)" }}>
            {today}
          </span>
        </div>
        <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
          {todayPhotos.length > 0
            ? `${todayPhotos.length} photo${todayPhotos.length > 1 ? "s" : ""} from today · ${photos.length} total on project`
            : `${photos.length} total photo${photos.length !== 1 ? "s" : ""} on project (none from today)`}
        </p>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: "var(--muted-hi)" }}>Crew / Workers</label>
              <input value={crew} onChange={e => setCrew(e.target.value)} placeholder="Names or count" style={{ ...inputStyle, fontSize: 13 }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: "var(--muted-hi)" }}>Weather</label>
              <input value={weather} onChange={e => setWeather(e.target.value)} placeholder="e.g. Sunny, 85°F" style={{ ...inputStyle, fontSize: 13 }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: "var(--muted-hi)" }}>Field Notes</label>
            <textarea value={fieldNotes} onChange={e => setFieldNotes(e.target.value)}
              placeholder="What work was done today? Any issues, delays, or items to flag? Materials used? Next steps?"
              rows={4} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          {error && <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(220,38,38,0.15)", color: "var(--red-t)" }}>{error}</p>}
          <button onClick={generate} disabled={generating}
            className="w-full rounded-xl py-3 text-sm font-bold transition-opacity disabled:opacity-60 hover:opacity-80"
            style={{ background: "linear-gradient(135deg,#5b5cf6,#7b7cfa)", color: "#fff" }}>
            {generating ? "✨ Generating log…" : "✨ Generate AI Daily Log"}
          </button>
        </div>
      </div>

      {generated && (
        <div className="rounded-2xl p-4" style={{ background: "var(--surf)", border: "1px solid var(--bdrA)" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold" style={{ color: "var(--txt-hi)" }}>Generated Log — Review & Edit</h3>
            <div className="flex gap-2">
              <button onClick={generate} disabled={generating}
                className="text-xs font-semibold rounded-lg px-3 py-1.5 hover:opacity-70 transition-opacity"
                style={{ color: "var(--muted-hi)", border: "1px solid var(--bdr)", background: "var(--surfB)" }}>
                Regenerate
              </button>
              <button onClick={saveLog} disabled={saving}
                className="text-xs font-bold rounded-lg px-3 py-1.5 transition-opacity disabled:opacity-50"
                style={{ background: "var(--green)", color: "#fff" }}>
                {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Log"}
              </button>
            </div>
          </div>
          <textarea
            value={generated} onChange={e => setGenerated(e.target.value)}
            rows={18} style={{ ...inputStyle, fontSize: 13, lineHeight: 1.6, resize: "vertical" }}
          />
          {saved && <p className="text-xs mt-2" style={{ color: "var(--green-t)" }}>✓ Log saved to Past Logs</p>}
        </div>
      )}
    </div>
  );
}

// ─── Team Tab ─────────────────────────────────────────────────────────────────
function TeamTab({ project, userId }: { project: Project; userId: string }) {
  const supabase = createClient();
  const [members, setMembers] = useState<{ id: string; user_id: string; role: string; email?: string }[]>([]);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"staff" | "viewer">("staff");
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    supabase.from("cf_project_members").select("*").eq("project_id", project.id)
      .then(({ data }) => setMembers(data ?? []));
  }, [project.id]);

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    const res = await fetch("/api/camfolder/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role: inviteRole, projectId: project.id }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Failed"); }
    else {
      setMessage(json.link
        ? `${email} added — send them this link to set their password:`
        : `${email} added to project.`);
      if (json.link) setInviteLink(json.link);
      setEmail("");
      const { data } = await supabase.from("cf_project_members").select("*").eq("project_id", project.id);
      setMembers(data ?? []);
    }
    setLoading(false);
  }

  async function removeMember(id: string) {
    if (!confirm("Remove this member?")) return;
    setRemoving(id);
    await supabase.from("cf_project_members").delete().eq("id", id);
    setMembers(ms => ms.filter(m => m.id !== id));
    setRemoving(null);
  }

  const ROLE_LABELS: Record<string, string> = {
    owner: "Owner — full access",
    staff: "Staff — upload photos & generate logs",
    viewer: "Viewer — read only",
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: "var(--txt-hi)" }}>Project Team</h3>
        {error && <p className="text-xs rounded-lg px-3 py-2 mb-3" style={{ background: "rgba(220,38,38,0.15)", color: "var(--red-t)" }}>{error}</p>}
        {message && <p className="text-xs rounded-lg px-3 py-2 mb-2" style={{ background: "rgba(5,150,105,0.15)", color: "var(--green-t)" }}>{message}</p>}
        {inviteLink && (
          <div className="mb-3">
            <div className="flex gap-2">
              <input readOnly value={inviteLink} className="flex-1 rounded-lg text-xs px-3 py-2 font-mono truncate"
                style={{ background: "var(--surfB)", border: "1px solid var(--bdr)", color: "var(--muted-hi)" }} />
              <button onClick={() => { navigator.clipboard.writeText(inviteLink); }}
                className="rounded-lg px-3 py-2 text-xs font-bold transition-opacity hover:opacity-70"
                style={{ background: "var(--accent)", color: "#fff" }}>
                Copy
              </button>
            </div>
          </div>
        )}
        <div className="space-y-1">
          {members.map((m, i) => (
            <div key={m.id} className="flex items-center justify-between py-2.5"
              style={{ borderTop: i > 0 ? "1px solid var(--bdr)" : "none" }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: m.user_id === userId ? "var(--accent-hi)" : "var(--txt)" }}>
                  {m.user_id === userId ? "You" : m.user_id.slice(0, 8) + "…"}
                </p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{ROLE_LABELS[m.role] ?? m.role}</p>
              </div>
              {m.user_id !== userId && (
                <button onClick={() => removeMember(m.id)} disabled={removing === m.id}
                  className="text-xs transition-opacity hover:opacity-70 disabled:opacity-30"
                  style={{ color: "var(--red-t)" }}>
                  {removing === m.id ? "…" : "Remove"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: "var(--txt-hi)" }}>Add Team Member</h3>
        <form onSubmit={addMember} className="space-y-3">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="their@email.com" required style={inputStyle} />
          <div className="flex gap-2">
            {(["staff", "viewer"] as const).map(r => (
              <button key={r} type="button" onClick={() => setInviteRole(r)}
                className="flex-1 rounded-lg py-2 text-sm font-semibold transition-all"
                style={{
                  background: inviteRole === r ? "var(--accent)" : "var(--surfB)",
                  color: inviteRole === r ? "#fff" : "var(--muted-hi)",
                  border: `1px solid ${inviteRole === r ? "var(--accent)" : "var(--bdr)"}`,
                }}>
                {r === "staff" ? "Staff (recommended)" : "Viewer"}
              </button>
            ))}
          </div>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {inviteRole === "staff"
              ? "Staff can upload photos and generate daily logs — best for field crew."
              : "Viewers can only see photos and logs — best for clients."}
          </p>
          <button type="submit" disabled={loading}
            className="w-full rounded-xl py-2.5 text-sm font-bold transition-opacity disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#fff" }}>
            {loading ? "Adding…" : "Add to Project"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Past Logs Tab ─────────────────────────────────────────────────────────────
function PastLogsTab({ logs, onDelete }: { logs: DailyLog[]; onDelete: (id: string) => void }) {
  const supabase = createClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function deleteLog(id: string) {
    if (!confirm("Delete this log?")) return;
    setDeleting(id);
    await supabase.from("cf_daily_logs").delete().eq("id", id);
    onDelete(id);
    setDeleting(null);
  }

  function exportLog(log: DailyLog) {
    const win = window.open("", "_blank")!;
    win.document.write(`<!DOCTYPE html><html><head><title>Daily Log — ${log.log_date}</title>
    <style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#1a1a1a;line-height:1.7}
    h1{font-size:1.5rem;margin-bottom:4px}p.meta{color:#666;font-size:.85rem;margin-bottom:24px}
    pre{white-space:pre-wrap;font-family:inherit;font-size:.95rem}</style></head><body>
    <h1>Daily Log</h1><p class="meta">${log.log_date} · Generated by CamFolder</p>
    <pre>${log.content}</pre></body></html>`);
    win.document.close(); win.print();
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-2xl p-10 text-center" style={{ border: "1px dashed var(--bdr)" }}>
        <p className="text-3xl mb-2">📋</p>
        <p className="text-sm" style={{ color: "var(--muted)" }}>No logs saved yet — generate one in the AI Daily Log tab</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map(log => (
        <div key={log.id} className="rounded-2xl overflow-hidden" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
          <div className="px-4 py-3 flex items-center justify-between cursor-pointer hover:opacity-80"
            onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--txt-hi)" }}>
                {new Date(log.log_date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                {log.content.slice(0, 80)}…
              </p>
            </div>
            <span className="text-lg ml-3">{expanded === log.id ? "▲" : "▼"}</span>
          </div>
          {expanded === log.id && (
            <div style={{ borderTop: "1px solid var(--bdr)" }}>
              <div className="px-4 py-3">
                <pre className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "var(--txt)", fontFamily: "inherit" }}>
                  {log.content}
                </pre>
              </div>
              <div className="px-4 py-3 flex gap-2" style={{ borderTop: "1px solid var(--bdr)" }}>
                <button onClick={() => exportLog(log)}
                  className="text-xs font-semibold rounded-lg px-3 py-1.5 hover:opacity-70 transition-opacity"
                  style={{ background: "var(--surfB)", border: "1px solid var(--bdr)", color: "var(--txt)" }}>
                  🖨 Print / Export PDF
                </button>
                <button onClick={() => navigator.clipboard.writeText(log.content)}
                  className="text-xs font-semibold rounded-lg px-3 py-1.5 hover:opacity-70 transition-opacity"
                  style={{ background: "var(--surfB)", border: "1px solid var(--bdr)", color: "var(--txt)" }}>
                  Copy Text
                </button>
                <button onClick={() => deleteLog(log.id)} disabled={deleting === log.id}
                  className="text-xs font-semibold rounded-lg px-3 py-1.5 hover:opacity-70 transition-opacity disabled:opacity-30 ml-auto"
                  style={{ color: "var(--red-t)" }}>
                  {deleting === log.id ? "…" : "Delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
