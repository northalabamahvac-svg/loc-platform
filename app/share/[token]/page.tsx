import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createServiceClient();

  const { data: project } = await supabase
    .from("cf_projects").select("*").eq("share_token", token).single() as any;
  if (!project) notFound();

  const [{ data: photos }, { data: logs }] = await Promise.all([
    supabase.from("cf_photos").select("*").eq("project_id", project.id).order("taken_at", { ascending: false }),
    supabase.from("cf_daily_logs").select("*").eq("project_id", project.id).order("log_date", { ascending: false }),
  ]);

  const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div style={{ minHeight: "100vh", background: "#08080f", color: "#e2e8f0", fontFamily: "system-ui,sans-serif" }}>
      <header style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(15,15,30,0.9)" }}>
        <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>📷 CamFolder — Project Update</p>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>{project.name}</h1>
        {project.address && <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>📍 {project.address}</p>}
      </header>

      <main style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 80px" }}>
        {(photos ?? []).length === 0 && (logs ?? []).length === 0 && (
          <p style={{ textAlign: "center", color: "#64748b", padding: 40 }}>No updates yet.</p>
        )}

        {(photos ?? []).length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748b", marginBottom: 12 }}>
              Site Photos ({(photos ?? []).length})
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {(photos ?? []).map((p: any) => (
                <div key={p.id} style={{ borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,0.05)" }}>
                  <img src={p.storage_url} alt={p.note ?? ""} style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} />
                  {p.note && <p style={{ fontSize: 11, padding: "6px 8px", color: "#94a3b8" }}>{p.note}</p>}
                  {p.tags?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "0 8px 6px" }}>
                      {p.tags.map((t: string) => (
                        <span key={t} style={{ fontSize: 10, borderRadius: 99, padding: "1px 6px", background: "rgba(91,92,246,0.25)", color: "#a5b4fc" }}>{t}</span>
                      ))}
                    </div>
                  )}
                  <p style={{ fontSize: 10, padding: "0 8px 6px", color: "#475569" }}>{fmt(p.taken_at)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {(logs ?? []).length > 0 && (
          <section>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748b", marginBottom: 12 }}>
              Daily Logs
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(logs ?? []).map((log: any) => (
                <div key={log.id} style={{ borderRadius: 12, padding: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 8 }}>
                    {new Date(log.log_date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                  </p>
                  <pre style={{ fontSize: 13, whiteSpace: "pre-wrap", color: "#cbd5e1", fontFamily: "inherit", lineHeight: 1.6, margin: 0 }}>{log.content}</pre>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer style={{ textAlign: "center", padding: "16px", fontSize: 11, color: "#334155", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        Shared via CamFolder · Read-only view
      </footer>
    </div>
  );
}
