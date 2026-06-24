"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import ThemePicker from "@/components/theme-picker";
import SignOutButton from "@/components/sign-out-button";

interface Project { id: string; name: string; address: string | null; trade: string | null; status: string; budget_cents?: number | null; customer_name?: string | null; customer_email?: string | null; customer_phone?: string | null; }
interface Photo { id: string; storage_url: string; note: string | null; tags: string[] | null; gps_lat: number | null; gps_lng: number | null; taken_at: string; }
interface DailyLog { id: string; log_date: string; content: string; raw_notes: string | null; created_at: string; }
interface Checklist { id: string; name: string; created_at: string; }
interface ChecklistItem { id: string; checklist_id: string; label: string; requires_photo: boolean; position: number; completed_at: string | null; completed_by: string | null; photo_url: string | null; }
interface SigRequest { id: string; title: string; message: string | null; token: string; status: string; signer_name: string | null; signed_at: string | null; signature_url: string | null; created_at: string; }

interface Comment { id: string; user_id: string; content: string; created_at: string; }
type Tab = "feed" | "photos" | "before-after" | "checklist" | "daily-log" | "walkthrough" | "recap" | "past-logs" | "signatures" | "share" | "team" | "estimates" | "briefing" | "costs";

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
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewEmail, setReviewEmail] = useState("");
  const [reviewCopied, setReviewCopied] = useState(false);
  const [reviewSending, setReviewSending] = useState(false);
  const [reviewSent, setReviewSent] = useState(false);
  const [reviewSendError, setReviewSendError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setGoogleReviewUrl(user?.user_metadata?.google_review_url ?? "");
      setBusinessEmail(user?.user_metadata?.business_email ?? "");
    });
  }, [supabase]);

  const ROW1: { key: Tab; label: string; fullLabel: string }[] = [
    { key: "feed",         label: "📰", fullLabel: "Feed" },
    { key: "photos",       label: "📷", fullLabel: "Photos" },
    { key: "before-after", label: "↔️",  fullLabel: "Before/After" },
    { key: "checklist",    label: "✅", fullLabel: "Checklist" },
    { key: "past-logs",    label: "📋", fullLabel: "Past Logs" },
    { key: "recap",        label: "📊", fullLabel: "Recap" },
  ];
  const ROW2: { key: Tab; label: string; fullLabel: string; hide: boolean }[] = [
    { key: "daily-log",   label: "🤖", fullLabel: "AI Log",      hide: role === "viewer" },
    { key: "walkthrough", label: "🎙️", fullLabel: "Walkthrough", hide: role === "viewer" },
    { key: "signatures",  label: "✍️",  fullLabel: "Signatures",  hide: role === "viewer" },
    { key: "estimates",   label: "💰", fullLabel: "Estimates",   hide: role === "viewer" },
    { key: "briefing",    label: "🧠", fullLabel: "Briefing",    hide: role === "viewer" },
    { key: "costs",       label: "💵", fullLabel: "Costs",       hide: role === "viewer" },
    { key: "share",       label: "🔗", fullLabel: "Share",       hide: role !== "owner" },
    { key: "team",        label: "👥", fullLabel: "Team",        hide: role !== "owner" },
  ];
  const row2Visible = ROW2.filter(t => !t.hide);

  return (
    <div style={{ minHeight: "100vh", background: "#f3f7fa" }}>
      {/* Project header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "14px 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 1px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              {project.trade ? `📷 ${project.trade}` : "📷 CamBBC"}
            </p>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1a2a38", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{project.name}</h1>
            {project.address && <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>📍 {project.address}</p>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {role === "owner" && (
              <button onClick={() => setShowReviewModal(true)}
                style={{ display: "flex", alignItems: "center", gap: 5, background: "#fdf2f3", border: "1px solid #f5c2c7", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: "#d4838d", cursor: "pointer", whiteSpace: "nowrap" }}>
                ⭐ Request Review
              </button>
            )}
            <ThemePicker />
            <SignOutButton />
          </div>
        </div>

        {/* Tab rows */}
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", gap: 2, overflowX: "auto", scrollbarWidth: "none" }}>
            {ROW1.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{
                  flexShrink: 0, padding: "6px 12px", borderRadius: 6, fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
                  background: tab === t.key ? "#edf3f7" : "transparent",
                  color: tab === t.key ? "#4a7a9b" : "#64748b",
                  border: tab === t.key ? "1px solid #bfdbfe" : "1px solid transparent",
                  cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
                }}>
                <span className="sm:hidden">{t.label}</span>
                <span className="hidden sm:inline">{t.label} {t.fullLabel}</span>
              </button>
            ))}
          </div>
          {row2Visible.length > 0 && (
            <div style={{ display: "flex", gap: 2, overflowX: "auto", scrollbarWidth: "none" }}>
              {row2Visible.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{
                    flexShrink: 0, padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: tab === t.key ? 700 : 500,
                    background: tab === t.key ? "#fdf2f3" : "transparent",
                    color: tab === t.key ? "#d4838d" : "#94a3b8",
                    border: tab === t.key ? "1px solid #bbf7d0" : "1px solid transparent",
                    cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
                  }}>
                  <span className="sm:hidden">{t.label}</span>
                  <span className="hidden sm:inline">{t.label} {t.fullLabel}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "20px 16px 80px" }}>
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
        {tab === "walkthrough"  && role !== "viewer" && <WalkthroughTab project={project} userId={userId} onSave={log => setLogs(prev => [log, ...prev.filter(l => l.log_date !== log.log_date)])} />}
        {tab === "recap"        && <RecapTab project={project} />}
        {tab === "past-logs"    && <PastLogsTab logs={logs} onDelete={id => setLogs(prev => prev.filter(l => l.id !== id))} />}
        {tab === "signatures"   && role !== "viewer" && <SignaturesTab project={project} userId={userId} role={role} />}
        {tab === "estimates"    && role !== "viewer" && <EstimatesTab project={project} userId={userId} />}
        {tab === "share"        && role === "owner" && <ShareTab project={project} />}
        {tab === "team"         && role === "owner" && <TeamTab project={project} userId={userId} />}
        {tab === "briefing"     && role !== "viewer" && <BriefingTab project={project} photos={photos} logs={logs} />}
        {tab === "costs"        && role !== "viewer" && <CostsTab project={project} userId={userId} role={role} />}
      </main>

      {/* ── Google Review Request Modal ─────────────────── */}
      {showReviewModal && (() => {
        const signature = businessEmail
          ? `— Blossomwood Building Co.\n📧 ${businessEmail}`
          : `— Blossomwood Building Co.`;
        const msg = `Hi ${reviewName || "there"},\n\nThank you for choosing us for your${project.trade ? ` ${project.trade.toLowerCase()}` : ""} project${project.address ? ` at ${project.address}` : ""}!\n\nWe'd love to hear about your experience. If you have a moment, please consider leaving us a quick Google review — it means the world to our small team.\n\n⭐ Leave a review here:\n${googleReviewUrl || "[Add your Google Review link in Profile settings]"}\n\nThank you so much for your support!\n${signature}`;
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
            onClick={() => { setShowReviewModal(false); setReviewSent(false); setReviewSendError(""); }}>
            <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "8px 20px 40px", width: "100%", maxWidth: 560, maxHeight: "88vh", overflowY: "auto" }}
              onClick={e => e.stopPropagation()}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: "#e5e7eb", margin: "10px auto 20px" }} />
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a2a38", margin: "0 0 4px" }}>⭐ Request Google Review</h2>
              {businessEmail && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 8, padding: "5px 10px", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>FROM</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1a2a38" }}>{businessEmail}</span>
                </div>
              )}
              {!businessEmail && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fef9ec", border: "1px solid #fcd34d", borderRadius: 8, padding: "5px 10px", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: "#92400e" }}>⚠️ No send-from email set —</span>
                  <a href="/profile" style={{ fontSize: 12, fontWeight: 700, color: "#4a7a9b", textDecoration: "none" }}>add one in Profile</a>
                </div>
              )}
              <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px" }}>
                {googleReviewUrl
                  ? "Fill in the customer details — we'll draft the email for you."
                  : "First add your Google Review link in Profile settings, then come back here."}
              </p>

              {!googleReviewUrl ? (
                <a href="/profile" style={{ display: "block", textAlign: "center", background: "#4a7a9b", color: "#fff", borderRadius: 10, padding: "13px 0", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
                  → Go to Profile Settings
                </a>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 5 }}>Customer Name</label>
                      <input value={reviewName} onChange={e => setReviewName(e.target.value)} placeholder="e.g. John Smith"
                        style={{ width: "100%", boxSizing: "border-box", background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", color: "#1a2a38" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 5 }}>Customer Email</label>
                      <input value={reviewEmail} onChange={e => setReviewEmail(e.target.value)} type="email" placeholder="e.g. john@example.com"
                        style={{ width: "100%", boxSizing: "border-box", background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", color: "#1a2a38" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 5 }}>Message Preview</label>
                      <div style={{ background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "#1a2a38", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                        {msg}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
                    {reviewSent ? (
                      <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 10, padding: "13px 0", textAlign: "center", fontWeight: 700, fontSize: 15, color: "#16a34a" }}>
                        ✅ Email sent to {reviewEmail}!
                      </div>
                    ) : (
                      <button
                        disabled={reviewSending || !reviewEmail}
                        onClick={async () => {
                          if (!reviewEmail) return;
                          setReviewSending(true); setReviewSendError("");
                          const res = await fetch("/api/camfolder/send-review-request", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              customerName: reviewName,
                              customerEmail: reviewEmail,
                              projectName: project.name,
                              projectAddress: project.address,
                              projectTrade: project.trade,
                              googleReviewUrl,
                              businessEmail,
                            }),
                          });
                          const data = await res.json();
                          if (data.error) { setReviewSendError(data.error); } else { setReviewSent(true); }
                          setReviewSending(false);
                        }}
                        style={{ background: reviewSending ? "#94a3b8" : "#4a7a9b", color: "#fff", border: "none", borderRadius: 10, padding: "13px 0", fontWeight: 700, fontSize: 15, cursor: reviewSending || !reviewEmail ? "default" : "pointer", opacity: !reviewEmail ? 0.5 : 1 }}>
                        {reviewSending ? "Sending…" : "📧 Send Email"}
                      </button>
                    )}
                    {reviewSendError && (
                      <p style={{ fontSize: 12, color: "#dc2626", background: "#fef2f2", borderRadius: 8, padding: "8px 12px", margin: 0 }}>{reviewSendError}</p>
                    )}
                    <button
                      onClick={() => { navigator.clipboard.writeText(msg); setReviewCopied(true); setTimeout(() => setReviewCopied(false), 2000); }}
                      style={{ background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 10, padding: "13px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", color: "#1a2a38" }}>
                      {reviewCopied ? "✓ Copied!" : "📋 Copy Message"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}
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
                <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "rgba(0,0,0,0.92)" }}
                  onClick={() => setExpanded(null)}>
                  <div className="max-w-2xl mx-auto p-4" onClick={e => e.stopPropagation()}>
                    <img src={photo.storage_url} alt="" className="w-full rounded-xl mb-3 max-h-[60vh] object-contain" />
                    {photo.note && <p className="text-sm text-center" style={{ color: "var(--txt)" }}>{photo.note}</p>}
                    <p className="text-xs text-center mt-1" style={{ color: "var(--muted)" }}>
                      {formatDate(photo.taken_at)}{photo.gps_lat ? ` · 📍 ${photo.gps_lat.toFixed(5)}, ${photo.gps_lng?.toFixed(5)}` : ""}
                    </p>
                    <div className="flex gap-2 justify-center mt-3">
                      {canUpload && <button onClick={() => { setExpanded(null); setAnnotating(photo); }}
                        className="text-sm font-bold rounded-lg px-4 py-2" style={{ background: "var(--accent)", color: "#fff" }}>
                        ✏️ Annotate
                      </button>}
                      <button onClick={() => setExpanded(null)} className="text-sm font-bold rounded-lg px-4 py-2" style={{ background: "var(--surfB)", color: "var(--txt)" }}>
                        Close
                      </button>
                    </div>
                    <PhotoComments photoId={photo.id} projectId={project.id} userId={userId} />
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

// ─── Photo Comments ────────────────────────────────────────────────────────────
function PhotoComments({ photoId, projectId, userId }: { photoId: string; projectId: string; userId: string }) {
  const supabase = createClient();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    supabase.from("cf_photo_comments").select("*").eq("photo_id", photoId).order("created_at")
      .then(({ data }) => setComments(data ?? []));
  }, [photoId]);

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    const { data } = await supabase.from("cf_photo_comments").insert({ photo_id: photoId, project_id: projectId, user_id: userId, content: text.trim() }).select().single() as any;
    if (data) setComments(prev => [...prev, data]);
    setText(""); setPosting(false);
  }

  async function del(id: string) {
    await supabase.from("cf_photo_comments").delete().eq("id", id);
    setComments(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div className="mt-4 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.05)" }}>
      <p className="text-xs font-bold mb-2" style={{ color: "var(--muted-hi)" }}>💬 Comments</p>
      {comments.map(c => (
        <div key={c.id} className="flex gap-2 mb-2">
          <div className="flex-1 rounded-lg px-2.5 py-1.5" style={{ background: "rgba(255,255,255,0.08)" }}>
            <p className="text-xs" style={{ color: "var(--txt)" }}>{c.content}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{c.user_id === userId ? "You" : "Team"} · {formatDate(c.created_at)}</p>
          </div>
          {c.user_id === userId && (
            <button onClick={() => del(c.id)} className="text-xs self-start mt-1 hover:opacity-60" style={{ color: "var(--red-t)" }}>×</button>
          )}
        </div>
      ))}
      <form onSubmit={post} className="flex gap-2 mt-2">
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Add a comment…"
          style={{ flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "#f1f5f9", outline: "none" }} />
        <button type="submit" disabled={posting} className="rounded-lg px-3 text-xs font-bold disabled:opacity-50"
          style={{ background: "var(--accent)", color: "#fff" }}>Post</button>
      </form>
    </div>
  );
}

// ─── Apply Template Button ─────────────────────────────────────────────────────
function ApplyTemplateButton({ project, userId, onApplied }: { project: Project; userId: string; onApplied: () => void }) {
  const supabase = createClient();
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    supabase.from("cf_templates").select("id, name").order("created_at", { ascending: false })
      .then(({ data }) => setTemplates(data ?? []));
  }, []);

  async function apply(templateId: string, templateName: string) {
    setApplying(true);
    const { data: items } = await supabase.from("cf_template_items").select("*").eq("template_id", templateId).order("position") as any;
    const { data: cl } = await supabase.from("cf_checklists").insert({ project_id: project.id, name: templateName, created_by: userId }).select().single() as any;
    if (cl && items?.length) {
      await supabase.from("cf_checklist_items").insert(items.map((i: any) => ({ checklist_id: cl.id, label: i.label, requires_photo: i.requires_photo, position: i.position })));
    }
    setOpen(false); setApplying(false); onApplied();
  }

  if (templates.length === 0) return null;

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="text-xs font-semibold rounded-lg px-3 py-1.5"
        style={{ background: "var(--surfB)", border: "1px solid var(--bdr)", color: "var(--muted-hi)" }}>
        📋 Apply Template
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-2 left-0 z-50 rounded-xl p-2 min-w-48 shadow-xl space-y-1"
            style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
            {templates.map(t => (
              <button key={t.id} disabled={applying} onClick={() => apply(t.id, t.name)}
                className="w-full text-left rounded-lg px-3 py-2 text-sm hover:opacity-80 disabled:opacity-40"
                style={{ background: "var(--surfB)", color: "var(--txt)" }}>
                {t.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Walkthrough Tab ───────────────────────────────────────────────────────────
function WalkthroughTab({ project, userId, onSave }: { project: Project; userId: string; onSave: (log: DailyLog) => void }) {
  const supabase = createClient();
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const recognitionRef = useRef<any>(null);

  const supported = typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  function startRecording() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = true; r.interimResults = true; r.lang = "en-US";
    let final = transcript;
    r.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      setTranscript(final + interim);
    };
    r.onerror = () => setError("Microphone error — check browser permissions.");
    r.onend = () => setRecording(false);
    recognitionRef.current = r;
    r.start(); setRecording(true); setError("");
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  async function generateReport() {
    if (!transcript.trim()) return;
    setGenerating(true); setReport(""); setError("");
    const res = await fetch("/api/camfolder/generate-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectName: project.name, address: project.address, trade: project.trade, date: new Date().toISOString().slice(0, 10), fieldNotes: transcript }),
    });
    const json = await res.json();
    if (!res.ok) setError(json.error ?? "Failed");
    else setReport(json.log);
    setGenerating(false);
  }

  async function saveReport() {
    if (!report.trim()) return;
    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    const { data, error: err } = await supabase.from("cf_daily_logs").upsert({
      project_id: project.id, user_id: userId, log_date: today,
      content: report, raw_notes: transcript,
    }, { onConflict: "project_id,log_date" }).select().single() as any;
    if (err) setError(err.message);
    else { setSaved(true); onSave(data); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
        <h3 className="text-sm font-bold mb-1" style={{ color: "var(--txt-hi)" }}>🎙️ Walkthrough Notes</h3>
        <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Walk the job and talk out loud — AI turns your voice into a formatted daily log.</p>

        {!supported && <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>Speech recognition requires Chrome or Safari.</p>}

        {supported && (
          <div className="flex flex-col items-center gap-3">
            <button onClick={recording ? stopRecording : startRecording}
              className="w-24 h-24 rounded-full text-3xl font-bold transition-all"
              style={{ background: recording ? "rgba(239,68,68,0.2)" : "var(--surfB)", border: `3px solid ${recording ? "#ef4444" : "var(--bdr)"}`, color: recording ? "#ef4444" : "var(--muted-hi)", boxShadow: recording ? "0 0 0 8px rgba(239,68,68,0.1)" : "none" }}>
              {recording ? "⏹" : "🎙️"}
            </button>
            <p className="text-xs font-semibold" style={{ color: recording ? "#ef4444" : "var(--muted)" }}>
              {recording ? "Recording… tap to stop" : "Tap to start recording"}
            </p>
          </div>
        )}

        {transcript && (
          <div className="mt-4 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-hi)" }}>Transcript</label>
            <textarea value={transcript} onChange={e => setTranscript(e.target.value)}
              rows={5} style={{ ...inputStyle, fontSize: 13, resize: "vertical" }} />
          </div>
        )}

        {error && <p className="text-xs rounded-lg px-3 py-2 mt-3" style={{ background: "rgba(220,38,38,0.15)", color: "var(--red-t)" }}>{error}</p>}

        {transcript && (
          <button onClick={generateReport} disabled={generating}
            className="w-full mt-3 rounded-xl py-3 text-sm font-bold disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#5b5cf6,#7b7cfa)", color: "#fff" }}>
            {generating ? "✨ Generating…" : "✨ Generate Report from Voice"}
          </button>
        )}
      </div>

      {report && (
        <div className="rounded-2xl p-4" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold" style={{ color: "var(--txt-hi)" }}>Generated Report</h3>
            <button onClick={saveReport} disabled={saving}
              className="text-xs font-bold rounded-lg px-3 py-1.5 disabled:opacity-50"
              style={{ background: "var(--green)", color: "#fff" }}>
              {saving ? "Saving…" : saved ? "✓ Saved!" : "Save as Log"}
            </button>
          </div>
          <textarea value={report} onChange={e => setReport(e.target.value)}
            rows={16} style={{ ...inputStyle, fontSize: 13, lineHeight: 1.6, resize: "vertical" }} />
        </div>
      )}
    </div>
  );
}

// ─── Recap Tab ─────────────────────────────────────────────────────────────────
function RecapTab({ project }: { project: Project }) {
  const [recap, setRecap] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setGenerating(true); setError(""); setRecap("");
    const res = await fetch("/api/camfolder/generate-recap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id }),
    });
    const json = await res.json();
    if (!res.ok) setError(json.error ?? "Failed");
    else setRecap(json.recap);
    setGenerating(false);
  }

  function copy() {
    navigator.clipboard.writeText(recap);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
        <h3 className="text-sm font-bold mb-1" style={{ color: "var(--txt-hi)" }}>📊 Progress Recap</h3>
        <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
          AI generates a professional summary of all project activity — perfect to share with clients or stakeholders.
        </p>
        {error && <p className="text-xs rounded-lg px-3 py-2 mb-3" style={{ background: "rgba(220,38,38,0.15)", color: "var(--red-t)" }}>{error}</p>}
        <button onClick={generate} disabled={generating}
          className="w-full rounded-xl py-3 text-sm font-bold disabled:opacity-60"
          style={{ background: "linear-gradient(135deg,#5b5cf6,#7b7cfa)", color: "#fff" }}>
          {generating ? "✨ Generating recap…" : "✨ Generate Progress Recap"}
        </button>
      </div>

      {recap && (
        <div className="rounded-2xl p-4" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold" style={{ color: "var(--txt-hi)" }}>Project Recap</h3>
            <div className="flex gap-2">
              <button onClick={copy} className="text-xs font-semibold rounded-lg px-3 py-1.5"
                style={{ background: "var(--surfB)", border: "1px solid var(--bdr)", color: "var(--txt)" }}>
                {copied ? "✓ Copied" : "Copy"}
              </button>
              <button onClick={generate} disabled={generating} className="text-xs font-semibold rounded-lg px-3 py-1.5"
                style={{ background: "var(--surfB)", border: "1px solid var(--bdr)", color: "var(--muted-hi)" }}>
                Regenerate
              </button>
            </div>
          </div>
          <textarea value={recap} onChange={e => setRecap(e.target.value)}
            rows={16} style={{ ...inputStyle, fontSize: 13, lineHeight: 1.7, resize: "vertical" }} />
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
        <div className="rounded-2xl p-4 space-y-3" style={{ background: "var(--surf)", border: "1px dashed var(--bdr)" }}>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--muted)" }}>New Checklist</p>
          <form onSubmit={createChecklist} className="flex gap-2">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Checklist name…" style={{ ...inputStyle, flex: 1, fontSize: 13 }} />
            <button type="submit" disabled={addingList} className="rounded-lg px-3 text-xs font-bold disabled:opacity-50"
              style={{ background: "var(--accent)", color: "#fff" }}>
              {addingList ? "…" : "Create"}
            </button>
          </form>
          <ApplyTemplateButton project={project} userId={userId} onApplied={async () => {
            const { data } = await supabase.from("cf_checklists").select("*").eq("project_id", project.id).order("created_at");
            setChecklists(data ?? []);
          }} />
        </div>
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

// ─── Estimates Tab ────────────────────────────────────────────────────────────
interface Estimate { id: string; title: string; status: string; accepted_tier: string | null; token: string; notes: string | null; created_at: string; }
interface EstimateTier { id: string; tier: string; label: string; price_cents: number; description: string; includes: string[]; }

function EstimatesTab({ project, userId }: { project: Project; userId: string }) {
  const supabase = createClient();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [tiers, setTiers] = useState([
    { tier: "good",   label: "Good",   price: "", description: "", includes: [""] },
    { tier: "better", label: "Better", price: "", description: "", includes: [""] },
    { tier: "best",   label: "Best",   price: "", description: "", includes: [""] },
  ]);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  useEffect(() => {
    supabase.from("cf_estimates").select("*").eq("project_id", project.id).order("created_at", { ascending: false })
      .then(({ data }) => { setEstimates(data ?? []); setLoading(false); });
  }, [project.id]);

  function updateTierIncludes(idx: number, bIdx: number, val: string) {
    setTiers(prev => prev.map((t, i) => i !== idx ? t : { ...t, includes: t.includes.map((b, j) => j === bIdx ? val : b) }));
  }
  function addInclude(idx: number) {
    setTiers(prev => prev.map((t, i) => i !== idx || t.includes.length >= 5 ? t : { ...t, includes: [...t.includes, ""] }));
  }
  function removeInclude(idx: number, bIdx: number) {
    setTiers(prev => prev.map((t, i) => i !== idx ? t : { ...t, includes: t.includes.filter((_, j) => j !== bIdx) }));
  }
  function updateTierField(idx: number, field: string, val: string) {
    setTiers(prev => prev.map((t, i) => i !== idx ? t : { ...t, [field]: val }));
  }

  async function saveEstimate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: est } = await supabase.from("cf_estimates").insert({
      project_id: project.id, created_by: userId, title: title.trim(),
      notes: notes.trim() || null, status: "draft",
      token: crypto.randomUUID(),
    }).select().single() as any;
    if (est) {
      await supabase.from("cf_estimate_tiers").insert(
        tiers.map((t, i) => ({
          estimate_id: est.id, tier: t.tier, label: t.label,
          price_cents: Math.round(parseFloat(t.price || "0") * 100),
          description: t.description,
          includes: t.includes.filter(Boolean),
          position: i,
        }))
      );
      setEstimates(prev => [est, ...prev]);
    }
    setShowForm(false); setTitle(""); setNotes("");
    setTiers([
      { tier: "good",   label: "Good",   price: "", description: "", includes: [""] },
      { tier: "better", label: "Better", price: "", description: "", includes: [""] },
      { tier: "best",   label: "Best",   price: "", description: "", includes: [""] },
    ]);
    setSaving(false);
  }

  async function sendEstimate(est: Estimate) {
    setSending(est.id);
    await supabase.from("cf_estimates").update({ status: "sent" }).eq("id", est.id);
    setEstimates(prev => prev.map(e => e.id === est.id ? { ...e, status: "sent" } : e));
    setSending(null);
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${siteUrl}/estimate/${token}`);
    setCopiedId(token);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    draft:    { bg: "#f1f5f9", color: "#64748b" },
    sent:     { bg: "#dbeafe", color: "#1d4ed8" },
    accepted: { bg: "#dcfce7", color: "#16a34a" },
    declined: { bg: "#fee2e2", color: "#dc2626" },
  };

  if (loading) return <p style={{ color: "#94a3b8", textAlign: "center", padding: 32 }}>Loading…</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1a2a38", margin: 0 }}>💰 Estimates</h3>
        <button onClick={() => setShowForm(s => !s)}
          style={{ background: "#4a7a9b", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          {showForm ? "Cancel" : "+ New Estimate"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={saveEstimate} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 5 }}>Estimate Title *</label>
            <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. HVAC System Replacement"
              style={{ width: "100%", boxSizing: "border-box", background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", color: "#1a2a38" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 5 }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              style={{ width: "100%", boxSizing: "border-box", background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", color: "#1a2a38", resize: "vertical" }} />
          </div>

          {tiers.map((t, idx) => (
            <div key={t.tier} style={{ background: "#f3f7fa", borderRadius: 12, padding: 16, border: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2a38", marginBottom: 12 }}>
                {t.tier === "good" ? "✅" : t.tier === "better" ? "⭐" : "🏆"} {t.label}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Label</label>
                  <input value={t.label} onChange={e => updateTierField(idx, "label", e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 7, padding: "7px 10px", fontSize: 13, outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Price ($)</label>
                  <input type="number" step="0.01" min="0" value={t.price} onChange={e => updateTierField(idx, "price", e.target.value)}
                    placeholder="0.00"
                    style={{ width: "100%", boxSizing: "border-box", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 7, padding: "7px 10px", fontSize: 13, outline: "none" }} />
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Description</label>
                <input value={t.description} onChange={e => updateTierField(idx, "description", e.target.value)}
                  placeholder="Short description…"
                  style={{ width: "100%", boxSizing: "border-box", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 7, padding: "7px 10px", fontSize: 13, outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>What's Included</label>
                {t.includes.map((bullet, bIdx) => (
                  <div key={bIdx} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                    <input value={bullet} onChange={e => updateTierIncludes(idx, bIdx, e.target.value)}
                      placeholder={`Item ${bIdx + 1}…`}
                      style={{ flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 7, padding: "6px 10px", fontSize: 13, outline: "none" }} />
                    {t.includes.length > 1 && (
                      <button type="button" onClick={() => removeInclude(idx, bIdx)}
                        style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</button>
                    )}
                  </div>
                ))}
                {t.includes.length < 5 && (
                  <button type="button" onClick={() => addInclude(idx)}
                    style={{ fontSize: 12, color: "#4a7a9b", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}>
                    + Add item
                  </button>
                )}
              </div>
            </div>
          ))}

          <button type="submit" disabled={saving}
            style={{ background: "#4a7a9b", color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving…" : "💾 Save Estimate"}
          </button>
        </form>
      )}

      {estimates.length === 0 && !showForm && (
        <div style={{ textAlign: "center", padding: 40, border: "1px dashed #e2e8f0", borderRadius: 16 }}>
          <p style={{ fontSize: 28, marginBottom: 8 }}>💰</p>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>No estimates yet — create your first Good/Better/Best estimate</p>
        </div>
      )}

      {estimates.map(est => {
        const ss = STATUS_STYLE[est.status] ?? STATUS_STYLE.draft;
        return (
          <div key={est.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1a2a38", margin: 0 }}>{est.title}</p>
                {est.notes && <p style={{ fontSize: 12, color: "#64748b", margin: "3px 0 0" }}>{est.notes}</p>}
                <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0" }}>{formatDate(est.created_at)}</p>
              </div>
              <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, borderRadius: 99, padding: "3px 10px", background: ss.bg, color: ss.color, textTransform: "capitalize" }}>
                {est.status}
              </span>
            </div>

            {est.accepted_tier && (
              <div style={{ background: "#dcfce7", borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
                <p style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, margin: 0 }}>
                  ✓ Customer selected: {est.accepted_tier.charAt(0).toUpperCase() + est.accepted_tier.slice(1)} plan
                </p>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {est.status === "draft" && (
                <button onClick={() => sendEstimate(est)} disabled={sending === est.id}
                  style={{ background: "#4a7a9b", color: "#fff", border: "none", borderRadius: 7, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: sending === est.id ? 0.6 : 1 }}>
                  {sending === est.id ? "Sending…" : "📤 Send to Customer"}
                </button>
              )}
              {est.status !== "draft" && (
                <button onClick={() => copyLink(est.token)}
                  style={{ background: "#f1f5f9", color: "#4a7a9b", border: "1px solid #e2e8f0", borderRadius: 7, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {copiedId === est.token ? "✓ Copied!" : "🔗 Copy Link"}
                </button>
              )}
              <a href={`/estimate/${est.token}`} target="_blank" rel="noreferrer"
                style={{ background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 7, padding: "7px 14px", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                Preview
              </a>
            </div>
          </div>
        );
      })}
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
    <h1>Daily Log</h1><p class="meta">${log.log_date} · Generated by CamBBC</p>
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

// ─── Briefing Tab ──────────────────────────────────────────────────────────────
function BriefingTab({ project, photos, logs }: { project: Project; photos: Photo[]; logs: DailyLog[] }) {
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true); setError(""); setBriefing(null);
    try {
      const res = await fetch("/api/camfolder/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project, photos: photos.slice(0, 10), logs: logs.slice(0, 5) }),
      });
      if (!res.ok) throw new Error("Failed to generate briefing");
      const json = await res.json();
      setBriefing(json.briefing);
    } catch (e: any) {
      setError(e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function parseSections(text: string) {
    const sections = [
      { key: "Job Summary",                icon: "📋" },
      { key: "Recent Site Conditions",      icon: "📸" },
      { key: "Watch Out For",              icon: "⚠️" },
      { key: "Recommended Parts to Bring", icon: "🔧" },
    ];
    const result: { icon: string; title: string; body: string }[] = [];
    const lines = text.split("\n");
    let current: { icon: string; title: string; body: string } | null = null;
    for (const line of lines) {
      const match = sections.find(s => line.toLowerCase().includes(s.key.toLowerCase()));
      if (match) {
        if (current) result.push(current);
        current = { icon: match.icon, title: match.key, body: "" };
      } else if (current) {
        current.body += (current.body ? "\n" : "") + line;
      }
    }
    if (current) result.push(current);
    if (result.length === 0) return [{ icon: "🧠", title: "Briefing", body: text }];
    return result.map(s => ({ ...s, body: s.body.trim() }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {(project.customer_name || project.customer_email || project.customer_phone) && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "16px 18px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Customer Info</p>
          {project.customer_name && <p style={{ fontSize: 15, fontWeight: 700, color: "#1a2a38", margin: "0 0 4px" }}>{project.customer_name}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {project.customer_email && (
              <a href={`mailto:${project.customer_email}`} style={{ fontSize: 13, color: "#4a7a9b", textDecoration: "none" }}>✉️ {project.customer_email}</a>
            )}
            {project.customer_phone && (
              <a href={`tel:${project.customer_phone}`} style={{ fontSize: 13, color: "#4a7a9b", textDecoration: "none" }}>📞 {project.customer_phone}</a>
            )}
          </div>
        </div>
      )}

      <button onClick={generate} disabled={loading}
        style={{
          background: loading ? "#94a3b8" : "#4a7a9b", color: "#fff", border: "none", borderRadius: 12,
          padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
        {loading ? "🧠 Analyzing job history…" : "🧠 Generate Briefing"}
      </button>

      {error && (
        <div style={{ background: "#fdf2f3", border: "1px solid #f5c2c7", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#d4838d" }}>{error}</div>
      )}

      {briefing && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {parseSections(briefing).map((section, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "16px 18px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2a38", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 18 }}>{section.icon}</span>
                {section.title}
              </p>
              <p style={{ fontSize: 13, color: "#475569", margin: 0, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{section.body}</p>
            </div>
          ))}
          <button onClick={generate}
            style={{ background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 0", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>
            ↻ Regenerate
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Costs Tab ─────────────────────────────────────────────────────────────────
interface JobCost { id: string; type: string; description: string; amount_cents: number; quantity: number; cost_date: string; created_at: string; }

function CostsTab({ project, userId, role }: { project: Project; userId: string; role: string }) {
  const supabase = createClient();
  const canEdit = role === "owner" || role === "staff";
  const [costs, setCosts] = useState<JobCost[]>([]);
  const [costsLoading, setCostsLoading] = useState(true);
  const [budgetCents, setBudgetCents] = useState<number | null>(project.budget_cents ?? null);
  const [budgetInput, setBudgetInput] = useState(project.budget_cents ? String(project.budget_cents / 100) : "");
  const [savingBudget, setSavingBudget] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({ type: "labor", description: "", quantity: "1", unit_cost: "", cost_date: new Date().toISOString().split("T")[0] });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    supabase.from("cf_job_costs").select("*").eq("project_id", project.id).order("cost_date", { ascending: false })
      .then(({ data }) => { setCosts(data ?? []); setCostsLoading(false); });
  }, [project.id]);

  async function saveBudget() {
    const val = parseFloat(budgetInput);
    if (isNaN(val) || val < 0) return;
    setSavingBudget(true);
    const cents = Math.round(val * 100);
    await supabase.from("cf_projects").update({ budget_cents: cents }).eq("id", project.id);
    setBudgetCents(cents);
    setSavingBudget(false);
  }

  async function addCost() {
    const desc = form.description.trim();
    const qty = parseFloat(form.quantity) || 1;
    const unitCents = Math.round((parseFloat(form.unit_cost) || 0) * 100);
    if (!desc || unitCents <= 0) return;
    setAdding(true);
    const { data } = await supabase.from("cf_job_costs").insert({
      project_id: project.id, created_by: userId, type: form.type,
      description: desc, amount_cents: unitCents, quantity: qty, cost_date: form.cost_date,
    }).select().single() as any;
    if (data) setCosts(prev => [data, ...prev]);
    setForm({ type: "labor", description: "", quantity: "1", unit_cost: "", cost_date: new Date().toISOString().split("T")[0] });
    setAdding(false);
  }

  async function deleteCost(id: string) {
    if (!confirm("Delete this cost entry?")) return;
    setDeleting(id);
    await supabase.from("cf_job_costs").delete().eq("id", id);
    setCosts(prev => prev.filter(c => c.id !== id));
    setDeleting(null);
  }

  const fmtMoney = (cents: number) => "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const totalCents = costs.reduce((sum, c) => sum + c.amount_cents * (c.quantity ?? 1), 0);
  const TYPE_LABELS: Record<string, string> = { labor: "Labor", material: "Material", subcontractor: "Subcontractor", overhead: "Overhead", other: "Other" };
  const COST_TYPES = Object.keys(TYPE_LABELS);
  const grouped = COST_TYPES.map(t => ({
    type: t, label: TYPE_LABELS[t],
    items: costs.filter(c => c.type === t),
    total: costs.filter(c => c.type === t).reduce((s, c) => s + c.amount_cents * (c.quantity ?? 1), 0),
  })).filter(g => g.items.length > 0);
  const remaining = budgetCents != null ? budgetCents - totalCents : null;

  if (costsLoading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading costs…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Budget section */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "16px 18px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Project Budget</p>
        {budgetCents != null && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: "#475569" }}>Budget: <strong style={{ color: "#1a2a38" }}>{fmtMoney(budgetCents)}</strong></span>
              <span style={{ fontSize: 13, color: "#475569" }}>Spent: <strong style={{ color: totalCents > budgetCents ? "#dc2626" : "#1a2a38" }}>{fmtMoney(totalCents)}</strong></span>
            </div>
            <div style={{ height: 8, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, (totalCents / budgetCents) * 100)}%`, background: totalCents > budgetCents ? "#dc2626" : "#4a7a9b", borderRadius: 99, transition: "width 0.3s" }} />
            </div>
          </div>
        )}
        {role === "owner" && (
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input type="number" min="0" step="0.01" placeholder="Set budget ($)" value={budgetInput} onChange={e => setBudgetInput(e.target.value)}
              style={{ flex: 1, background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#1a2a38", outline: "none" }} />
            <button onClick={saveBudget} disabled={savingBudget}
              style={{ background: "#4a7a9b", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {savingBudget ? "…" : "Save"}
            </button>
          </div>
        )}
      </div>

      {/* Grouped cost entries */}
      {grouped.length === 0 && (
        <div style={{ border: "1px dashed #e2e8f0", borderRadius: 14, padding: 40, textAlign: "center" }}>
          <p style={{ fontSize: 28, margin: "0 0 8px" }}>💵</p>
          <p style={{ fontSize: 14, color: "#94a3b8" }}>No costs recorded yet</p>
        </div>
      )}
      {grouped.map(group => (
        <div key={group.type} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "10px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2a38" }}>{group.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#4a7a9b" }}>{fmtMoney(group.total)}</span>
          </div>
          {group.items.map(c => (
            <div key={c.id} style={{ padding: "10px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#1a2a38", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.description}</p>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{c.cost_date} · {c.quantity} × {fmtMoney(c.amount_cents)}</p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2a38", flexShrink: 0 }}>{fmtMoney(c.amount_cents * (c.quantity ?? 1))}</span>
              {canEdit && (
                <button onClick={() => deleteCost(c.id)} disabled={deleting === c.id}
                  style={{ fontSize: 11, color: "#d4838d", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
                  {deleting === c.id ? "…" : "Delete"}
                </button>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Summary footer */}
      {costs.length > 0 && (
        <div style={{ background: "#1a2a38", borderRadius: 14, padding: "16px 18px", color: "#fff" }}>
          {COST_TYPES.filter(t => costs.some(c => c.type === t)).map(t => {
            const sub = costs.filter(c => c.type === t).reduce((s, c) => s + c.amount_cents * (c.quantity ?? 1), 0);
            return (
              <div key={t} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "#94a3b8" }}>Total {TYPE_LABELS[t]}</span>
                <span style={{ fontSize: 13, color: "#e2e8f0" }}>{fmtMoney(sub)}</span>
              </div>
            );
          })}
          <div style={{ borderTop: "1px solid #2d4a60", margin: "10px 0", paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 16, fontWeight: 800 }}>TOTAL</span>
            <span style={{ fontSize: 16, fontWeight: 800 }}>{fmtMoney(totalCents)}</span>
          </div>
          {remaining != null && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>Budget Remaining</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: remaining >= 0 ? "#4ade80" : "#f87171" }}>
                {remaining >= 0 ? fmtMoney(remaining) : `-${fmtMoney(Math.abs(remaining))}`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Add Cost Entry form */}
      {canEdit && (
        <div style={{ background: "#fff", border: "1px dashed #e2e8f0", borderRadius: 14, padding: "16px 18px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Add Cost Entry</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              style={{ background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#1a2a38", outline: "none" }}>
              {COST_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description"
              style={{ background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#1a2a38", outline: "none" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: 4 }}>Qty</label>
                <input type="number" min="0" step="any" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  style={{ width: "100%", boxSizing: "border-box", background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 8px", fontSize: 13, color: "#1a2a38", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: 4 }}>Unit ($)</label>
                <input type="number" min="0" step="0.01" value={form.unit_cost} onChange={e => setForm(f => ({ ...f, unit_cost: e.target.value }))}
                  placeholder="0.00" style={{ width: "100%", boxSizing: "border-box", background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 8px", fontSize: 13, color: "#1a2a38", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: 4 }}>Date</label>
                <input type="date" value={form.cost_date} onChange={e => setForm(f => ({ ...f, cost_date: e.target.value }))}
                  style={{ width: "100%", boxSizing: "border-box", background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 8px", fontSize: 13, color: "#1a2a38", outline: "none" }} />
              </div>
            </div>
            <button onClick={addCost} disabled={adding}
              style={{ background: "#4a7a9b", color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              {adding ? "Adding…" : "Add Cost Entry"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
