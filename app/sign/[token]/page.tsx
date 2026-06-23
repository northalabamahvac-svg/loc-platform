"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignPage({ params }: { params: { token: string } }) {
  const supabase = createClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sig, setSig] = useState<any>(null);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const drawing = useRef(false);
  const lastPt = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    supabase.from("cf_signature_requests").select("*, cf_projects(name,address)")
      .eq("token", params.token).single()
      .then(({ data }) => setSig(data));
  }, [params.token]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [sig]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => { e.preventDefault(); drawing.current = true; lastPt.current = getPos(e); };
  const doDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing.current || !lastPt.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const pos = getPos(e);
    ctx.beginPath(); ctx.moveTo(lastPt.current.x, lastPt.current.y); ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1a1a2e"; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.stroke();
    lastPt.current = pos;
  };
  const endDraw = (e: React.MouseEvent | React.TouchEvent) => { e.preventDefault(); drawing.current = false; lastPt.current = null; };

  function clearSig() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  async function submit() {
    if (!name.trim()) { setError("Please enter your name."); return; }
    setSubmitting(true); setError("");
    const canvas = canvasRef.current!;
    const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), "image/png"));
    const path = `signatures/${params.token}.png`;
    await supabase.storage.from("camfolder-photos").upload(path, blob, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from("camfolder-photos").getPublicUrl(path);
    const { error: err } = await supabase.from("cf_signature_requests").update({
      status: "signed", signer_name: name.trim(), signature_url: publicUrl, signed_at: new Date().toISOString(),
    }).eq("token", params.token);
    if (err) { setError(err.message); setSubmitting(false); return; }
    setDone(true);
  }

  if (!sig) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#08080f", color: "#94a3b8", fontFamily: "system-ui" }}>Loading…</div>;

  if (sig.status === "signed" || done) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#08080f", color: "#e2e8f0", fontFamily: "system-ui", padding: 24, textAlign: "center" }}>
      <p style={{ fontSize: 48, marginBottom: 16 }}>✅</p>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Signed!</h1>
      <p style={{ color: "#94a3b8", fontSize: 14 }}>Thank you{sig.signer_name ? `, ${sig.signer_name}` : ""}. Your signature has been recorded.</p>
    </div>
  );

  const project = (sig as any).cf_projects;

  return (
    <div style={{ minHeight: "100vh", background: "#08080f", color: "#e2e8f0", fontFamily: "system-ui,sans-serif" }}>
      <header style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(15,15,30,0.9)" }}>
        <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>✍️ Signature Request</p>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>{sig.title}</h1>
        {project?.name && <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Project: {project.name}{project.address ? ` · ${project.address}` : ""}</p>}
      </header>

      <main style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px 80px" }}>
        {sig.message && (
          <div style={{ borderRadius: 12, padding: 16, marginBottom: 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#cbd5e1", margin: 0 }}>{sig.message}</p>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", marginBottom: 6 }}>Your Full Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name"
            style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#f1f5f9", outline: "none", boxSizing: "border-box" }} />
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8" }}>Signature</label>
            <button onClick={clearSig} style={{ fontSize: 11, color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>Clear</button>
          </div>
          <canvas ref={canvasRef} width={480} height={180}
            style={{ width: "100%", borderRadius: 10, border: "2px solid rgba(255,255,255,0.15)", background: "#fff", touchAction: "none", cursor: "crosshair", display: "block" }}
            onMouseDown={startDraw} onMouseMove={doDraw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={doDraw} onTouchEnd={endDraw} />
          <p style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>Sign above using your finger or mouse</p>
        </div>

        {error && <p style={{ fontSize: 12, color: "#f87171", marginBottom: 12 }}>{error}</p>}

        <button onClick={submit} disabled={submitting}
          style={{ width: "100%", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 800, background: submitting ? "#475569" : "#5b5cf6", color: "#fff", border: "none", cursor: submitting ? "default" : "pointer", marginTop: 8 }}>
          {submitting ? "Submitting…" : "Submit Signature"}
        </button>

        <p style={{ fontSize: 11, color: "#334155", textAlign: "center", marginTop: 16 }}>
          By submitting, you confirm your agreement to the above.
        </p>
      </main>
    </div>
  );
}
