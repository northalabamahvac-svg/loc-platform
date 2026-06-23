"use client";

import { useState, useRef, useEffect } from "react";

const MONO = 'ui-monospace,"SF Mono",Menlo,monospace';

interface Doc {
  id: string;
  name: string;
  type: string;
  date: string;
  size: number;
  data: string; // base64 data URL
}

interface Note {
  id: string;
  text: string;
  date: string;
  time: string;
}

function uid() { return Math.random().toString(36).slice(2, 10); }
function td() { return new Date().toISOString().split("T")[0]; }

function loadDocs(locId: string): Doc[] {
  try {
    const r = localStorage.getItem(`loc-docs-${locId}`);
    return r ? JSON.parse(r) : [];
  } catch { return []; }
}

function saveDocs(locId: string, docs: Doc[]): boolean {
  try {
    localStorage.setItem(`loc-docs-${locId}`, JSON.stringify(docs));
    return true;
  } catch { return false; }
}

function loadNotes(locId: string): Note[] {
  try {
    const r = localStorage.getItem(`loc-notes-${locId}`);
    return r ? JSON.parse(r) : [];
  } catch { return []; }
}

function saveNotes(locId: string, notes: Note[]) {
  try { localStorage.setItem(`loc-notes-${locId}`, JSON.stringify(notes)); } catch {}
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// ─── Camera Capture ────────────────────────────────────────────────────────────
function CameraCapture({ onSave, onClose }: { onSave: (doc: Doc) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let s: MediaStream;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } })
      .then(st => {
        s = st; setStream(st);
        if (videoRef.current) { videoRef.current.srcObject = st; videoRef.current.play(); }
      })
      .catch(() => setErr("Camera access denied. Check your browser permissions."));
    return () => { if (s) s.getTracks().forEach(t => t.stop()); };
  }, []);

  function capture() {
    const v = videoRef.current!, c = canvasRef.current!;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    setCaptured(c.toDataURL("image/jpeg", 0.75));
    if (stream) stream.getTracks().forEach(t => t.stop());
  }

  function retake() {
    setCaptured(null);
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then(st => { setStream(st); if (videoRef.current) { videoRef.current.srcObject = st; videoRef.current.play(); } });
  }

  function save() {
    if (!captured) return;
    const name = "Photo_" + new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-") + ".jpg";
    onSave({ id: uid(), name, type: "image/jpeg", date: td(), size: Math.round(captured.length * 0.75), data: captured });
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 999, overflow: "hidden" }}>
      {err ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 24 }}>
          <p style={{ color: "#f87171", fontSize: 14, textAlign: "center" }}>{err}</p>
          <button onClick={onClose} style={{ background: "var(--surf)", color: "var(--txt)", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, cursor: "pointer" }}>Close</button>
        </div>
      ) : !captured ? (
        <>
          <video ref={videoRef} autoPlay playsInline muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 20px 50px", display: "flex", gap: 12, background: "linear-gradient(transparent,rgba(0,0,0,0.85))" }}>
            <button onClick={onClose} style={{ flex: 1, background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 12, padding: 16, fontSize: 15, cursor: "pointer" }}>Cancel</button>
            <button onClick={capture} style={{ flex: 2, background: "#fff", color: "#000", border: "none", borderRadius: 12, padding: 16, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Capture</button>
          </div>
        </>
      ) : (
        <>
          <img src={captured} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 20px 50px", display: "flex", gap: 12, background: "linear-gradient(transparent,rgba(0,0,0,0.85))" }}>
            <button onClick={retake} style={{ flex: 1, background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 12, padding: 16, fontSize: 15, cursor: "pointer" }}>Retake</button>
            <button onClick={save} style={{ flex: 2, background: "var(--accent)", color: "#fff", border: "none", borderRadius: 12, padding: 16, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Save Photo</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Doc Viewer ────────────────────────────────────────────────────────────────
function DocViewer({ doc, onClose }: { doc: Doc; onClose: () => void }) {
  const isImage = doc.type.startsWith("image/");
  const isPdf = doc.type === "application/pdf";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 998, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--bdr)", flexShrink: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--txt-hi)", flex: 1, marginRight: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <a href={doc.data} download={doc.name} style={{ background: "var(--surfB)", color: "var(--accent-hi)", border: "1px solid var(--bdr)", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>
            Download
          </a>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--muted-hi)", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        {isImage ? (
          <img src={doc.data} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }} />
        ) : isPdf ? (
          <iframe src={doc.data} style={{ width: "100%", height: "100%", border: "none", borderRadius: 8 }} />
        ) : (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "var(--muted)", marginBottom: 16 }}>Preview not available for this file type.</p>
            <a href={doc.data} download={doc.name} style={{ background: "var(--accent)", color: "#fff", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
              Download File
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main DocsTab ──────────────────────────────────────────────────────────────
export default function DocsTab({ locId, role }: { locId: string; role: string }) {
  const [docs, setDocs] = useState<Doc[]>(() => loadDocs(locId));
  const [notes, setNotes] = useState<Note[]>(() => loadNotes(locId));
  const [section, setSection] = useState<"files" | "notes">("files");
  const [showCamera, setShowCamera] = useState(false);
  const [viewDoc, setViewDoc] = useState<Doc | null>(null);
  const [noteText, setNoteText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function addDoc(doc: Doc) {
    const next = [doc, ...docs];
    if (!saveDocs(locId, next)) { alert("Storage full. Delete some documents first."); return; }
    setDocs(next);
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("File too large (max 5MB)."); return; }
    const reader = new FileReader();
    reader.onload = () => addDoc({ id: uid(), name: file.name, type: file.type, date: td(), size: file.size, data: reader.result as string });
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function deleteDoc(id: string) {
    if (!window.confirm("Delete this document?")) return;
    const next = docs.filter(d => d.id !== id);
    saveDocs(locId, next); setDocs(next);
  }

  function addNote() {
    if (!noteText.trim()) return;
    const n: Note = { id: uid(), text: noteText.trim(), date: td(), time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) };
    const next = [n, ...notes]; saveNotes(locId, next); setNotes(next); setNoteText("");
  }

  function deleteNote(id: string) {
    const next = notes.filter(n => n.id !== id); saveNotes(locId, next); setNotes(next);
  }

  const canEdit = role === "owner";

  return (
    <div className="space-y-4">
      {showCamera && <CameraCapture onSave={addDoc} onClose={() => setShowCamera(false)} />}
      {viewDoc && <DocViewer doc={viewDoc} onClose={() => setViewDoc(null)} />}
      <input ref={fileRef} type="file" accept="*/*" style={{ display: "none" }} onChange={handleUpload} />

      {/* Section toggle */}
      <div className="flex gap-1 rounded-xl p-1" style={{ background: "var(--surfB)" }}>
        {(["files", "notes"] as const).map(s => (
          <button key={s} onClick={() => setSection(s)}
            className="flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition-all"
            style={{
              background: section === s ? "var(--surf)" : "transparent",
              color: section === s ? "var(--txt-hi)" : "var(--muted)",
              border: section === s ? "1px solid var(--bdr)" : "1px solid transparent",
            }}
          >
            {s === "files" ? "Files" : "Notes"}
          </button>
        ))}
      </div>

      {section === "files" && (
        <>
          {canEdit && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowCamera(true)}
                className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-opacity hover:opacity-80"
                style={{ background: "var(--surf)", border: "1px solid var(--bdrA)", color: "var(--accent-hi)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                Camera
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-opacity hover:opacity-80"
                style={{ background: "var(--surf)", border: "1px solid var(--bdrA)", color: "var(--accent-hi)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload File
              </button>
            </div>
          )}

          {docs.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
              <p className="text-sm" style={{ color: "var(--muted)" }}>No documents yet.</p>
              {canEdit && <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Use Camera or Upload to add files.</p>}
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
              {docs.map((doc, i) => (
                <div key={doc.id} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: i > 0 ? "1px solid var(--bdr)" : "none" }}>
                  <div style={{ fontSize: 22 }}>
                    {doc.type.startsWith("image/") ? "🖼️" : doc.type === "application/pdf" ? "📄" : "📎"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--txt-hi)" }}>{doc.name}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{doc.date} · {fmtSize(doc.size)}</p>
                  </div>
                  <button onClick={() => setViewDoc(doc)} className="text-xs font-semibold flex-shrink-0 hover:opacity-70" style={{ color: "var(--accent-hi)" }}>
                    View
                  </button>
                  {canEdit && (
                    <button onClick={() => deleteDoc(doc.id)} className="text-xs flex-shrink-0 hover:opacity-70" style={{ color: "var(--red-t)" }}>
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {section === "notes" && (
        <>
          {canEdit && (
            <div className="rounded-2xl p-4" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Add a note…"
                rows={3}
                style={{ width: "100%", background: "var(--surfB)", border: "1px solid var(--bdr)", color: "var(--txt)", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", resize: "vertical" }}
                onKeyDown={e => { if (e.key === "Enter" && e.metaKey) addNote(); }}
              />
              <button
                onClick={addNote}
                disabled={!noteText.trim()}
                className="mt-2 w-full rounded-lg py-2.5 text-sm font-bold transition-opacity disabled:opacity-40"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                Add Note
              </button>
            </div>
          )}

          {notes.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
              <p className="text-sm" style={{ color: "var(--muted)" }}>No notes yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map(note => (
                <div key={note.id} className="rounded-2xl p-4" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
                  <p className="text-sm" style={{ color: "var(--txt)", whiteSpace: "pre-wrap" }}>{note.text}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{note.date} at {note.time}</p>
                    {canEdit && (
                      <button onClick={() => deleteNote(note.id)} className="text-xs hover:opacity-70" style={{ color: "var(--red-t)" }}>Delete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
