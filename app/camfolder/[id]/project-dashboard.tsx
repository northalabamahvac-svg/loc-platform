"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import ThemePicker from "@/components/theme-picker";
import SignOutButton from "@/components/sign-out-button";

interface Project { id: string; name: string; address: string | null; trade: string | null; status: string; }
interface Photo { id: string; storage_url: string; note: string | null; tags: string[] | null; gps_lat: number | null; gps_lng: number | null; taken_at: string; }
interface DailyLog { id: string; log_date: string; content: string; raw_notes: string | null; created_at: string; }
interface Checklist { id: string; name: string; created_at: string; }
interface ChecklistItem { id: string; checklist_id: string; label: string; requires_photo: boolean; position: number; completed_at: string | null; completed_by: string | null; photo_url: string | null; }
interface SigRequest { id: string; title: string; message: string | null; token: string; status: string; signer_name: string | null; signed_at: string | null; signature_url: string | null; created_at: string; }

type Tab = "feed" | "photos" | "before-after" | "checklist" | "daily-log" | "past-logs" | "signatures" | "share" | "team";

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
  const [tab, setTab] = useState<Tab>("feed");
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

      <main className="max-w-3xl mx-auto px-3 py-4 space-y-3" style={{ paddingBottom: 80 }}>
        {project.address && (
          <p className="text-xs px-1" style={{ color: "var(--muted)" }}>📍 {project.address}</p>
        )}

        {/* Tabs — scrollable on mobile */}
        <div className="flex gap-1 rounded-xl p-1 overflow-x-auto" style={{ background: "var(--surfB)", scrollbarWidth: "none" }}>
          {([
            { key: "feed",         label: "📰", fullLabel: "Feed" },
            { key: "photos",       label: "📷", fullLabel: "Photos" },
            { key: "before-after", label: "↔️",  fullLabel: "Before/After" },
            { key: "checklist",    label: "✅", fullLabel: "Checklist" },
            { key: "daily-log",    label: "🤖", fullLabel: "AI Log", hide: role === "viewer" },
            { key: "past-logs",    label: "📋", fullLabel: "Past Logs" },
            { key: "signatures",   label: "✍️",  fullLabel: "Signatures", hide: role === "viewer" },
            { key: "share",        label: "🔗", fullLabel: "Share", hide: role !== "owner" },
            { key: "team",         label: "👥", fullLabel: "Team", hide: role !== "owner" },
          ] as { key: Tab; label: string; fullLabel: string; hide?: boolean }[]).filter(t => !t.hide).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-shrink-0 flex-1 rounded-lg py-2.5 text-xs font-semibold transition-all whitespace-nowrap"
              style={{
                minWidth: 64,
                background: tab === t.key ? "var(--surf)" : "transparent",
                color: tab === t.key ? "var(--txt-hi)" : "var(--muted)",
                border: tab === t.key ? "1px solid var(--bdr)" : "1px solid transparent",
              }}>
              <span className="sm:hidden">{t.label}</span>
              <span className="hidden sm:inline">{t.label} {t.fullLabel}</span>
            </button>
          ))}
        </div>

        {tab === "feed"         && <FeedTab photos={photos} logs={logs} />}
        {tab === "photos"       && (
          <PhotosTab project={project} photos={photos} userId={userId} role={role}
            onAdd={p => setPhotos(prev => [p, ...prev])}
            onDelete={id => setPhotos(prev => prev.filter(p => p.id !== id))} />
        )}
        {tab === "before-after" && <BeforeAfterTab photos={photos} />}
        {tab === "checklist"    && <ChecklistTab project={project} userId={userId} role={role} />}
        {tab === "daily-log"    && role !== "viewer" && (
          <DailyLogTab project={project} photos={photos} userId={userId}
            onSave={log => setLogs(prev => [log, ...prev.filter(l => l.log_date !== log.log_date)])} />
        )}
        {tab === "past-logs"    && <PastLogsTab logs={logs} onDelete={id => setLogs(prev => prev.filter(l => l.id !== id))} />}
        {tab === "signatures"   && role !== "viewer" && <SignaturesTab project={project} userId={userId} role={role} />}
        {tab === "share"        && role === "owner" && <ShareTab project={project} />}
        {tab === "team"         && role === "owner" && <TeamTab project={project} userId={userId} />}
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
  const [tagInput, setTagInput] = useState("");
  const [pendingTags, setPendingTags] = useState<string[]>([]);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [annotating, setAnnotating] = useState<Photo | null>(null);

  const allTags = Array.from(new Set(photos.flatMap(p => p.tags ?? [])));
  const visiblePhotos = filterTag ? photos.filter(p => p.tags?.includes(filterTag)) : photos;

  function addTag(raw: string) {
    const t = raw.trim().toLowerCase();
    if (t && !pendingTags.includes(t)) setPendingTags(prev => [...prev, t]);
    setTagInput("");
  }

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
        note: note.trim() || null, tags: pendingTags.length ? pendingTags : null,
        gps_lat: gps?.lat ?? null, gps_lng: gps?.lng ?? null,
      }).select().single() as any;
      if (!dbErr && data) onAdd(data as Photo);
    }
    setNote(""); setPendingTags([]); setUploading(false);
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
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: "var(--muted-hi)" }}>Tags</label>
            <div className="flex flex-wrap gap-1 mb-1">
              {pendingTags.map(t => (
                <span key={t} className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{ background: "rgba(91,92,246,0.2)", color: "var(--accent-hi)" }}>
                  {t}
                  <button onClick={() => setPendingTags(prev => prev.filter(x => x !== t))} className="hover:opacity-60">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); } }}
                placeholder='e.g. "Before", "Bedroom 1"'
                style={{ ...inputStyle, flex: 1, fontSize: 13 }} />
              <button type="button" onClick={() => addTag(tagInput)}
                className="rounded-lg px-3 text-xs font-bold"
                style={{ background: "var(--surfB)", border: "1px solid var(--bdr)", color: "var(--txt)" }}>
                Add
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => {
              if (!fileRef.current) return;
              fileRef.current.removeAttribute("capture");
              fileRef.current.setAttribute("multiple", "");
              fileRef.current.click();
            }} disabled={uploading}
              className="rounded-xl py-3.5 text-sm font-bold transition-opacity disabled:opacity-50 active:opacity-70"
              style={{ background: "var(--accent)", color: "#fff" }}>
              {uploading ? "Uploading…" : "📷 Library"}
            </button>
            <button onClick={() => {
              if (!fileRef.current) return;
              fileRef.current.removeAttribute("multiple");
              fileRef.current.setAttribute("capture", "environment");
              fileRef.current.click();
            }} disabled={uploading}
              className="rounded-xl py-3.5 text-sm font-bold transition-opacity disabled:opacity-50 active:opacity-70"
              style={{ background: "var(--surfB)", border: "1px solid var(--bdr)", color: "var(--txt)" }}>
              📸 Camera
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={upload} />
          {error && <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(220,38,38,0.15)", color: "var(--red-t)" }}>{error}</p>}
          <p className="text-xs" style={{ color: "var(--muted)" }}>GPS location is captured automatically · Max 15MB per file</p>
        </div>
      </div>}

      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setFilterTag(null)}
            className="rounded-full px-3 py-1 text-xs font-semibold transition-all"
            style={{ background: filterTag === null ? "var(--accent)" : "var(--surfB)", color: filterTag === null ? "#fff" : "var(--muted-hi)", border: "1px solid var(--bdr)" }}>
            All ({photos.length})
          </button>
          {allTags.map(t => (
            <button key={t} onClick={() => setFilterTag(filterTag === t ? null : t)}
              className="rounded-full px-3 py-1 text-xs font-semibold transition-all"
              style={{ background: filterTag === t ? "var(--accent)" : "var(--surfB)", color: filterTag === t ? "#fff" : "var(--muted-hi)", border: "1px solid var(--bdr)" }}>
              {t} ({photos.filter(p => p.tags?.includes(t)).length})
            </button>
          ))}
        </div>
      )}

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ border: "1px dashed var(--bdr)" }}>
          <p className="text-3xl mb-2">📷</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>No photos yet — upload your first site photo above</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {visiblePhotos.map(photo => (
            <div key={photo.id} className="rounded-xl overflow-hidden relative group cursor-pointer"
              style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}
              onClick={() => setExpanded(expanded === photo.id ? null : photo.id)}>
              <img src={photo.storage_url} alt={photo.note ?? "Site photo"} className="w-full object-cover" style={{ height: 130 }} />
              {(photo.note || (photo.tags && photo.tags.length > 0)) && (
                <div className="px-2 py-1.5 space-y-1">
                  {photo.note && <p className="text-xs line-clamp-2" style={{ color: "var(--txt)" }}>{photo.note}</p>}
                  {photo.tags && photo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {photo.tags.map(t => (
                        <span key={t} className="rounded-full px-1.5 py-0.5 text-xs font-semibold"
                          style={{ background: "rgba(91,92,246,0.2)", color: "var(--accent-hi)" }}>{t}</span>
                      ))}
                    </div>
                  )}
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
                    <div className="flex gap-2 justify-center mt-4">
                      {canUpload && <button onClick={() => { setExpanded(null); setAnnotating(photo); }}
                        className="text-sm font-bold rounded-lg px-4 py-2" style={{ background: "var(--accent)", color: "#fff" }}>
                        ✏️ Annotate
                      </button>}
                      <button onClick={() => setExpanded(null)} className="text-sm font-bold rounded-lg px-4 py-2" style={{ background: "var(--surfB)", color: "var(--txt)" }}>
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {annotating && (
        <AnnotateModal photo={annotating} project={project} userId={userId}
          onSave={p => { onAdd(p); setAnnotating(null); }}
          onClose={() => setAnnotating(null)} />
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

// ─── Annotate Modal ────────────────────────────────────────────────────────────
function AnnotateModal({ photo, project, userId, onSave, onClose }: {
  photo: Photo; project: Project; userId: string;
  onSave: (p: Photo) => void; onClose: () => void;
}) {
  const supabase = createClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<"pen" | "arrow" | "text">("pen");
  const [color, setColor] = useState("#ef4444");
  const [saving, setSaving] = useState(false);
  const drawing = useRef(false);
  const lastPt = useRef<{ x: number; y: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      imgRef.current = img;
    };
    img.src = photo.storage_url;
  }, [photo.storage_url]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = "touches" in e ? e.touches[0]?.clientX ?? (e as any).changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0]?.clientY ?? (e as any).changedTouches[0].clientY : (e as React.MouseEvent).clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current!;
    const pos = getPos(e, canvas);
    drawing.current = true;
    lastPt.current = pos;
    if (tool === "text") {
      const label = prompt("Enter text:");
      if (!label) return;
      const ctx = canvas.getContext("2d")!;
      ctx.font = `bold ${Math.round(canvas.width * 0.04)}px system-ui`;
      ctx.fillStyle = color;
      ctx.strokeStyle = "#000";
      ctx.lineWidth = canvas.width * 0.003;
      ctx.strokeText(label, pos.x, pos.y);
      ctx.fillText(label, pos.x, pos.y);
      drawing.current = false;
    }
  };

  const doDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing.current || tool === "text") return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e, canvas);
    if (tool === "pen" && lastPt.current) {
      ctx.beginPath();
      ctx.moveTo(lastPt.current.x, lastPt.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = color; ctx.lineWidth = canvas.width * 0.005; ctx.lineCap = "round";
      ctx.stroke();
      lastPt.current = pos;
    }
  };

  const endDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing.current || tool !== "arrow" || !lastPt.current) { drawing.current = false; return; }
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e, canvas);
    const from = lastPt.current;
    const dx = pos.x - from.x, dy = pos.y - from.y;
    const angle = Math.atan2(dy, dx);
    const hw = canvas.width * 0.015;
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = color; ctx.lineWidth = canvas.width * 0.006; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x - hw * Math.cos(angle - 0.4), pos.y - hw * Math.sin(angle - 0.4));
    ctx.lineTo(pos.x - hw * Math.cos(angle + 0.4), pos.y - hw * Math.sin(angle + 0.4));
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
    drawing.current = false;
  };

  async function saveAnnotated() {
    setSaving(true);
    const canvas = canvasRef.current!;
    const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), "image/jpeg", 0.9));
    const path = `${userId}/${project.id}/annotated-${Date.now()}.jpg`;
    await supabase.storage.from("camfolder-photos").upload(path, blob);
    const { data: { publicUrl } } = supabase.storage.from("camfolder-photos").getPublicUrl(path);
    const { data } = await supabase.from("cf_photos").insert({
      project_id: project.id, user_id: userId, storage_url: publicUrl,
      note: `Annotated: ${photo.note ?? "photo"}`, tags: ["annotated"],
      gps_lat: photo.gps_lat, gps_lng: photo.gps_lng,
    }).select().single() as any;
    if (data) onSave(data as Photo);
    setSaving(false);
  }

  const COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#ffffff"];

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "#000" }}>
      <div className="flex items-center gap-2 px-3 py-2 flex-wrap" style={{ background: "rgba(15,15,30,0.95)", borderBottom: "1px solid var(--bdr)" }}>
        <button onClick={onClose} className="text-xs font-bold rounded-lg px-3 py-1.5" style={{ background: "var(--surfB)", color: "var(--txt)" }}>← Back</button>
        <div className="flex gap-1">
          {(["pen", "arrow", "text"] as const).map(t => (
            <button key={t} onClick={() => setTool(t)}
              className="text-xs font-bold rounded-lg px-2.5 py-1.5 capitalize"
              style={{ background: tool === t ? "var(--accent)" : "var(--surfB)", color: tool === t ? "#fff" : "var(--muted-hi)" }}>
              {t === "pen" ? "✏️" : t === "arrow" ? "→" : "T"}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className="w-6 h-6 rounded-full transition-transform"
              style={{ background: c, border: color === c ? "3px solid #fff" : "2px solid rgba(255,255,255,0.3)", transform: color === c ? "scale(1.2)" : "scale(1)" }} />
          ))}
        </div>
        <button onClick={saveAnnotated} disabled={saving}
          className="ml-auto text-xs font-bold rounded-lg px-3 py-1.5 disabled:opacity-50"
          style={{ background: "var(--green)", color: "#fff" }}>
          {saving ? "Saving…" : "💾 Save"}
        </button>
      </div>
      <canvas ref={canvasRef}
        className="flex-1 w-full object-contain"
        style={{ touchAction: "none", cursor: tool === "text" ? "text" : "crosshair" }}
        onMouseDown={startDraw} onMouseMove={doDraw} onMouseUp={endDraw}
        onTouchStart={startDraw} onTouchMove={doDraw} onTouchEnd={endDraw} />
    </div>
  );
}

// ─── Before & After Tab ────────────────────────────────────────────────────────
function BeforeAfterTab({ photos }: { photos: Photo[] }) {
  const [before, setBefore] = useState<Photo | null>(null);
  const [after, setAfter] = useState<Photo | null>(null);
  const [picking, setPicking] = useState<"before" | "after" | null>(null);

  if (photos.length < 2) {
    return (
      <div className="rounded-2xl p-10 text-center" style={{ border: "1px dashed var(--bdr)" }}>
        <p className="text-3xl mb-2">↔️</p>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Upload at least 2 photos to create a Before & After comparison</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {(["before", "after"] as const).map(side => {
          const photo = side === "before" ? before : after;
          return (
            <div key={side}>
              <p className="text-xs font-bold uppercase tracking-wide mb-1.5 px-1" style={{ color: "var(--muted-hi)" }}>{side}</p>
              <button onClick={() => setPicking(side)} className="w-full rounded-xl overflow-hidden"
                style={{ background: "var(--surf)", border: `2px solid ${photo ? (side === "before" ? "#f59e0b" : "#22c55e") : "var(--bdr)"}`, aspectRatio: "4/3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {photo
                  ? <img src={photo.storage_url} alt="" className="w-full h-full object-cover" />
                  : <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Tap to select</p>}
              </button>
              {photo && <p className="text-xs mt-1 px-1 truncate" style={{ color: "var(--muted)" }}>{photo.note ?? formatDate(photo.taken_at)}</p>}
            </div>
          );
        })}
      </div>

      {before && after && (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--bdr)" }}>
          <div className="grid grid-cols-2">
            <div className="relative">
              <img src={before.storage_url} alt="Before" className="w-full object-cover" style={{ maxHeight: 280 }} />
              <span className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: "rgba(245,158,11,0.9)", color: "#000" }}>BEFORE</span>
            </div>
            <div className="relative" style={{ borderLeft: "3px solid #fff" }}>
              <img src={after.storage_url} alt="After" className="w-full object-cover" style={{ maxHeight: 280 }} />
              <span className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: "rgba(34,197,94,0.9)", color: "#000" }}>AFTER</span>
            </div>
          </div>
          {(before.note || after.note) && (
            <div className="grid grid-cols-2 px-3 py-2" style={{ borderTop: "1px solid var(--bdr)" }}>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{before.note ?? ""}</p>
              <p className="text-xs text-right" style={{ color: "var(--muted)" }}>{after.note ?? ""}</p>
            </div>
          )}
        </div>
      )}

      {picking && (
        <div className="fixed inset-0 z-50 p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.9)" }}>
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold capitalize" style={{ color: "#fff" }}>Select {picking} photo</p>
              <button onClick={() => setPicking(null)} className="text-sm rounded-lg px-3 py-1" style={{ background: "var(--surfB)", color: "var(--txt)" }}>Cancel</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {photos.map(p => (
                <button key={p.id} onClick={() => { picking === "before" ? setBefore(p) : setAfter(p); setPicking(null); }}
                  className="rounded-xl overflow-hidden" style={{ border: "2px solid var(--bdr)" }}>
                  <img src={p.storage_url} alt="" className="w-full object-cover" style={{ height: 90 }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Signatures Tab ────────────────────────────────────────────────────────────
function SignaturesTab({ project, userId, role }: { project: Project; userId: string; role: string }) {
  const supabase = createClient();
  const canOwner = role === "owner";
  const [sigs, setSigs] = useState<SigRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  useEffect(() => {
    supabase.from("cf_signature_requests").select("*").eq("project_id", project.id).order("created_at", { ascending: false })
      .then(({ data }) => { setSigs(data ?? []); setLoading(false); });
  }, [project.id]);

  async function createRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    const { data } = await supabase.from("cf_signature_requests").insert({
      project_id: project.id, title: title.trim(), message: message.trim() || null, created_by: userId,
    }).select().single() as any;
    if (data) setSigs(prev => [data, ...prev]);
    setTitle(""); setMessage(""); setCreating(false);
  }

  async function deleteSig(id: string) {
    if (!confirm("Delete this signature request?")) return;
    await supabase.from("cf_signature_requests").delete().eq("id", id);
    setSigs(prev => prev.filter(s => s.id !== id));
  }

  if (loading) return <p className="text-xs text-center py-8" style={{ color: "var(--muted)" }}>Loading…</p>;

  return (
    <div className="space-y-4">
      {sigs.map(sig => (
        <div key={sig.id} className="rounded-2xl p-4" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: "var(--txt-hi)" }}>{sig.title}</p>
              {sig.message && <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{sig.message}</p>}
            </div>
            <span className="flex-shrink-0 text-xs rounded-full px-2 py-0.5 font-semibold capitalize" style={{
              background: sig.status === "signed" ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)",
              color: sig.status === "signed" ? "var(--green-t)" : "#f59e0b",
            }}>{sig.status}</span>
          </div>
          {sig.status === "signed" ? (
            <div>
              <p className="text-xs mb-2" style={{ color: "var(--green-t)" }}>✓ Signed by {sig.signer_name} · {sig.signed_at ? formatDate(sig.signed_at) : ""}</p>
              {sig.signature_url && <img src={sig.signature_url} alt="signature" className="rounded-lg max-h-16 bg-white" />}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input readOnly value={`${siteUrl}/sign/${sig.token}`}
                  className="flex-1 rounded-lg text-xs px-2 py-1.5 font-mono truncate"
                  style={{ background: "var(--surfB)", border: "1px solid var(--bdr)", color: "var(--muted-hi)" }} />
                <button onClick={() => navigator.clipboard.writeText(`${siteUrl}/sign/${sig.token}`)}
                  className="rounded-lg px-3 text-xs font-bold" style={{ background: "var(--accent)", color: "#fff" }}>Copy</button>
              </div>
            </div>
          )}
          {canOwner && <button onClick={() => deleteSig(sig.id)} className="text-xs mt-2 hover:opacity-60" style={{ color: "var(--red-t)" }}>Delete</button>}
        </div>
      ))}

      {canOwner && (
        <form onSubmit={createRequest} className="rounded-2xl p-4 space-y-3" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
          <h3 className="text-sm font-bold" style={{ color: "var(--txt-hi)" }}>New Signature Request</h3>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Work Completion Sign-off" required style={inputStyle} />
          <textarea value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Optional message to the signer…" rows={2} style={{ ...inputStyle, resize: "vertical" }} />
          <button type="submit" disabled={creating} className="w-full rounded-xl py-2.5 text-sm font-bold disabled:opacity-50" style={{ background: "var(--accent)", color: "#fff" }}>
            {creating ? "Creating…" : "Create & Get Link"}
          </button>
        </form>
      )}

      {sigs.length === 0 && !canOwner && (
        <div className="rounded-2xl p-10 text-center" style={{ border: "1px dashed var(--bdr)" }}>
          <p className="text-3xl mb-2">✍️</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>No signature requests yet</p>
        </div>
      )}
    </div>
  );
}

// ─── Share Tab ─────────────────────────────────────────────────────────────────
function ShareTab({ project }: { project: Project }) {
  const supabase = createClient();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  useEffect(() => {
    supabase.from("cf_projects").select("share_token").eq("id", project.id).single()
      .then(({ data }) => { setToken((data as any)?.share_token ?? null); setLoading(false); });
  }, [project.id]);

  async function generate() {
    setGenerating(true);
    const { data } = await supabase.from("cf_projects").update({ share_token: crypto.randomUUID() }).eq("id", project.id).select("share_token").single() as any;
    setToken(data?.share_token ?? null);
    setGenerating(false);
  }

  async function revoke() {
    if (!confirm("Revoke the share link? Anyone with the old link will lose access.")) return;
    await supabase.from("cf_projects").update({ share_token: null }).eq("id", project.id);
    setToken(null);
  }

  function copy() {
    navigator.clipboard.writeText(`${siteUrl}/share/${token}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <p className="text-xs text-center py-8" style={{ color: "var(--muted)" }}>Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
        <h3 className="text-sm font-bold mb-1" style={{ color: "var(--txt-hi)" }}>Client Share Link</h3>
        <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
          Anyone with this link can view photos and logs — no account needed. Perfect for clients checking project progress.
        </p>
        {token ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input readOnly value={`${siteUrl}/share/${token}`}
                className="flex-1 rounded-lg text-xs px-3 py-2 font-mono truncate"
                style={{ background: "var(--surfB)", border: "1px solid var(--bdr)", color: "var(--muted-hi)" }} />
              <button onClick={copy} className="rounded-lg px-3 py-2 text-xs font-bold flex-shrink-0"
                style={{ background: "var(--accent)", color: "#fff" }}>
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <button onClick={revoke} className="text-xs hover:opacity-70" style={{ color: "var(--red-t)" }}>
              Revoke link
            </button>
          </div>
        ) : (
          <button onClick={generate} disabled={generating}
            className="w-full rounded-xl py-3 text-sm font-bold disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#fff" }}>
            {generating ? "Generating…" : "🔗 Generate Share Link"}
          </button>
        )}
      </div>
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

// ─── Feed Tab ──────────────────────────────────────────────────────────────────
function FeedTab({ photos, logs }: { photos: Photo[]; logs: DailyLog[] }) {
  type FeedItem = { date: string; photos: Photo[]; log: DailyLog | null };

  const grouped: Record<string, FeedItem> = {};
  photos.forEach(p => {
    const d = p.taken_at.slice(0, 10);
    if (!grouped[d]) grouped[d] = { date: d, photos: [], log: null };
    grouped[d].photos.push(p);
  });
  logs.forEach(l => {
    if (!grouped[l.log_date]) grouped[l.log_date] = { date: l.log_date, photos: [], log: null };
    grouped[l.log_date].log = l;
  });

  const days = Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));

  if (days.length === 0) {
    return (
      <div className="rounded-2xl p-10 text-center" style={{ border: "1px dashed var(--bdr)" }}>
        <p className="text-3xl mb-2">📰</p>
        <p className="text-sm" style={{ color: "var(--muted)" }}>No activity yet — upload photos or generate a daily log</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {days.map(day => (
        <div key={day.date}>
          <p className="text-xs font-bold uppercase tracking-wider mb-2 px-1" style={{ color: "var(--muted)" }}>
            {new Date(day.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
          {day.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {day.photos.map(p => (
                <div key={p.id} className="rounded-xl overflow-hidden" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
                  <img src={p.storage_url} alt={p.note ?? ""} className="w-full object-cover" style={{ height: 90 }} />
                  {p.tags && p.tags.length > 0 && (
                    <div className="px-1.5 py-1 flex flex-wrap gap-1">
                      {p.tags.map(t => <span key={t} className="rounded-full px-1.5 text-xs font-semibold" style={{ background: "rgba(91,92,246,0.2)", color: "var(--accent-hi)" }}>{t}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {day.log && (
            <div className="rounded-xl px-3 py-2.5" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
              <p className="text-xs font-bold mb-1" style={{ color: "var(--accent-hi)" }}>🤖 Daily Log</p>
              <p className="text-xs leading-relaxed line-clamp-4" style={{ color: "var(--txt)" }}>{day.log.content}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Checklist Tab ─────────────────────────────────────────────────────────────
function ChecklistTab({ project, userId, role }: { project: Project; userId: string; role: string }) {
  const supabase = createClient();
  const canEdit = role === "owner" || role === "staff";
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [items, setItems] = useState<Record<string, ChecklistItem[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [addingList, setAddingList] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState<Record<string, string>>({});
  const [newItemPhoto, setNewItemPhoto] = useState<Record<string, boolean>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    supabase.from("cf_checklists").select("*").eq("project_id", project.id).order("created_at")
      .then(({ data }) => setChecklists(data ?? []));
  }, [project.id]);

  async function loadItems(checklistId: string) {
    if (items[checklistId]) return;
    const { data } = await supabase.from("cf_checklist_items").select("*").eq("checklist_id", checklistId).order("position");
    setItems(prev => ({ ...prev, [checklistId]: data ?? [] }));
  }

  async function createChecklist(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAddingList(true);
    const { data } = await supabase.from("cf_checklists").insert({ project_id: project.id, name: newName.trim(), created_by: userId }).select().single() as any;
    if (data) { setChecklists(prev => [...prev, data]); setItems(prev => ({ ...prev, [data.id]: [] })); }
    setNewName(""); setAddingList(false);
  }

  async function addItem(checklistId: string) {
    const label = newItemLabel[checklistId]?.trim();
    if (!label) return;
    const requires_photo = newItemPhoto[checklistId] ?? false;
    const pos = (items[checklistId]?.length ?? 0);
    const { data } = await supabase.from("cf_checklist_items").insert({ checklist_id: checklistId, label, requires_photo, position: pos }).select().single() as any;
    if (data) setItems(prev => ({ ...prev, [checklistId]: [...(prev[checklistId] ?? []), data] }));
    setNewItemLabel(prev => ({ ...prev, [checklistId]: "" }));
    setNewItemPhoto(prev => ({ ...prev, [checklistId]: false }));
  }

  async function toggleItem(item: ChecklistItem) {
    if (item.requires_photo && !item.completed_at) {
      fileRefs.current[item.id]?.click();
      return;
    }
    const now = item.completed_at ? null : new Date().toISOString();
    await supabase.from("cf_checklist_items").update({ completed_at: now, completed_by: now ? userId : null }).eq("id", item.id);
    setItems(prev => ({
      ...prev,
      [item.checklist_id]: prev[item.checklist_id].map(i => i.id === item.id ? { ...i, completed_at: now, completed_by: now ? userId : null } : i),
    }));
  }

  async function uploadProof(item: ChecklistItem, file: File) {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${project.id}/checklist-${item.id}-${Date.now()}.${ext}`;
    await supabase.storage.from("camfolder-photos").upload(path, file, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from("camfolder-photos").getPublicUrl(path);
    const now = new Date().toISOString();
    await supabase.from("cf_checklist_items").update({ completed_at: now, completed_by: userId, photo_url: publicUrl }).eq("id", item.id);
    setItems(prev => ({
      ...prev,
      [item.checklist_id]: prev[item.checklist_id].map(i => i.id === item.id ? { ...i, completed_at: now, photo_url: publicUrl } : i),
    }));
  }

  async function deleteChecklist(id: string) {
    if (!confirm("Delete this checklist and all its items?")) return;
    await supabase.from("cf_checklists").delete().eq("id", id);
    setChecklists(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div className="space-y-3">
      {checklists.map(cl => {
        const clItems = items[cl.id] ?? [];
        const done = clItems.filter(i => i.completed_at).length;
        const isOpen = expanded === cl.id;
        return (
          <div key={cl.id} className="rounded-2xl overflow-hidden" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
            <div className="px-4 py-3 flex items-center justify-between cursor-pointer"
              onClick={() => { setExpanded(isOpen ? null : cl.id); loadItems(cl.id); }}>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: "var(--txt-hi)" }}>{cl.name}</p>
                {clItems.length > 0 && (
                  <p className="text-xs mt-0.5" style={{ color: done === clItems.length ? "var(--green-t)" : "var(--muted)" }}>
                    {done}/{clItems.length} complete
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                {canEdit && <button onClick={e => { e.stopPropagation(); deleteChecklist(cl.id); }} className="text-xs hover:opacity-60" style={{ color: "var(--red-t)" }}>Delete</button>}
                <span>{isOpen ? "▲" : "▼"}</span>
              </div>
            </div>

            {isOpen && (
              <div style={{ borderTop: "1px solid var(--bdr)" }}>
                <div className="divide-y" style={{ borderColor: "var(--bdr)" }}>
                  {clItems.map(item => (
                    <div key={item.id} className="px-4 py-3 flex items-start gap-3">
                      <button onClick={() => canEdit && toggleItem(item)} disabled={!canEdit}
                        className="mt-0.5 flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all"
                        style={{ background: item.completed_at ? "var(--green)" : "var(--surfB)", border: `2px solid ${item.completed_at ? "var(--green)" : "var(--bdr)"}` }}>
                        {item.completed_at && <span className="text-xs text-white font-bold">✓</span>}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm" style={{ color: "var(--txt)", textDecoration: item.completed_at ? "line-through" : "none", opacity: item.completed_at ? 0.5 : 1 }}>
                          {item.label}
                        </p>
                        {item.requires_photo && !item.completed_at && (
                          <p className="text-xs mt-0.5" style={{ color: "var(--accent-hi)" }}>📷 Photo required to complete</p>
                        )}
                        {item.photo_url && (
                          <img src={item.photo_url} alt="proof" className="mt-1 rounded-lg object-cover" style={{ width: 80, height: 60 }} />
                        )}
                      </div>
                      <input type="file" accept="image/*" className="hidden" ref={el => { fileRefs.current[item.id] = el; }}
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadProof(item, f); }} />
                    </div>
                  ))}
                </div>

                {canEdit && (
                  <div className="px-4 py-3 space-y-2" style={{ borderTop: "1px solid var(--bdr)" }}>
                    <div className="flex gap-2">
                      <input value={newItemLabel[cl.id] ?? ""} onChange={e => setNewItemLabel(prev => ({ ...prev, [cl.id]: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && addItem(cl.id)}
                        placeholder="New item…" style={{ ...inputStyle, flex: 1, fontSize: 13 }} />
                      <button onClick={() => addItem(cl.id)} className="rounded-lg px-3 text-xs font-bold"
                        style={{ background: "var(--accent)", color: "#fff" }}>Add</button>
                    </div>
                    <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--muted-hi)" }}>
                      <input type="checkbox" checked={newItemPhoto[cl.id] ?? false}
                        onChange={e => setNewItemPhoto(prev => ({ ...prev, [cl.id]: e.target.checked }))} />
                      Require photo to complete
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {canEdit && (
        <form onSubmit={createChecklist} className="rounded-2xl p-4 space-y-2" style={{ background: "var(--surf)", border: "1px dashed var(--bdr)" }}>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--muted)" }}>New Checklist</p>
          <div className="flex gap-2">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Checklist name…" style={{ ...inputStyle, flex: 1, fontSize: 13 }} />
            <button type="submit" disabled={addingList} className="rounded-lg px-3 text-xs font-bold disabled:opacity-50"
              style={{ background: "var(--accent)", color: "#fff" }}>
              {addingList ? "…" : "Create"}
            </button>
          </div>
        </form>
      )}

      {checklists.length === 0 && !canEdit && (
        <div className="rounded-2xl p-10 text-center" style={{ border: "1px dashed var(--bdr)" }}>
          <p className="text-3xl mb-2">✅</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>No checklists yet</p>
        </div>
      )}
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
