"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  SURVEY_SECTIONS, type SurveyData, type SurveyField,
  isSectionVisible, isFieldVisible, sectionProgress, missingRequired,
  customerFullName, fullAddress, surveySummary,
} from "@/lib/hvac-survey";

export interface SurveyRow {
  id: string;
  status: string;
  data: SurveyData;
  submitted_at: string | null;
  created_at: string;
}

const INPUT_STYLE: React.CSSProperties = {
  width: "100%", padding: "11px 12px", borderRadius: 10, border: "1px solid #d7e0e8",
  fontSize: 15, color: "#1a2a38", background: "#fff", outline: "none", boxSizing: "border-box",
};

export default function SurveyForm({ initialSurvey }: { initialSurvey: SurveyRow | null }) {
  const router = useRouter();
  const supabase = createClient();

  const [surveyId, setSurveyId] = useState<string | null>(initialSurvey?.id ?? null);
  const [data, setData] = useState<SurveyData>(initialSurvey?.data ?? {});
  const [status, setStatus] = useState(initialSurvey?.status ?? "draft");
  const [sectionIdx, setSectionIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const visibleSections = useMemo(() => SURVEY_SECTIONS.filter(s => isSectionVisible(s, data)), [data]);
  const section = visibleSections[Math.min(sectionIdx, visibleSections.length - 1)];
  const missing = useMemo(() => missingRequired(data), [data]);
  const readOnly = status !== "draft";

  function setField(key: string, value: string | string[]) {
    setData(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  async function save(): Promise<string | null> {
    setSaving(true);
    setMessage(null);
    const row = {
      customer_name: customerFullName(data) || "Unnamed customer",
      address: fullAddress(data),
      data,
      updated_at: new Date().toISOString(),
    };
    let id = surveyId;
    if (id) {
      const { error } = await supabase.from("cf_hvac_surveys").update(row).eq("id", id);
      if (error) { setMessage({ kind: "err", text: `Save failed: ${error.message}` }); setSaving(false); return null; }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: inserted, error } = await supabase
        .from("cf_hvac_surveys")
        .insert({ ...row, created_by: user?.id })
        .select("id")
        .single();
      if (error || !inserted) { setMessage({ kind: "err", text: `Save failed: ${error?.message ?? "unknown"}` }); setSaving(false); return null; }
      id = inserted.id as string;
      setSurveyId(id);
      // Keep the URL in sync without remounting the form
      window.history.replaceState(null, "", `/surveys/${id}`);
    }
    setDirty(false);
    setSaving(false);
    return id;
  }

  async function goTo(idx: number) {
    if (!readOnly && dirty) await save();
    setSectionIdx(Math.max(0, Math.min(idx, visibleSections.length - 1)));
    window.scrollTo({ top: 0 });
  }

  async function submit() {
    setSubmitting(true);
    setMessage(null);
    const id = await save();
    if (!id) { setSubmitting(false); return; }
    try {
      const res = await fetch("/api/hvac-survey/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Submit failed");
      setStatus(body.status ?? "submitted");
      setMessage({ kind: "ok", text: body.message ?? "Survey sent to the office." });
      router.refresh();
    } catch (e) {
      setMessage({ kind: "err", text: e instanceof Error ? e.message : "Submit failed" });
    }
    setSubmitting(false);
  }

  async function reopen() {
    if (!surveyId) return;
    await supabase.from("cf_hvac_surveys").update({ status: "draft" }).eq("id", surveyId);
    setStatus("draft");
    router.refresh();
  }

  // ── Submitted: read-only summary ─────────────────────────
  if (readOnly) {
    const summary = surveySummary(data);
    return (
      <div>
        <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#166534" }}>
              ✅ Submitted to the office{status === "sent_to_hcp" ? " · pushed to Housecall Pro" : ""}
            </p>
            {initialSurvey?.submitted_at && (
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#15803d" }}>
                {new Date(initialSurvey.submitted_at).toLocaleString("en-US")}
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {surveyId && (
              <>
                <a href={`/api/hvac-survey/${surveyId}/csv?type=customer`} style={{ background: "#fff", border: "1px solid #86efac", color: "#166534", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                  ⬇ Customer CSV
                </a>
                <a href={`/api/hvac-survey/${surveyId}/csv?type=lineitems`} style={{ background: "#fff", border: "1px solid #86efac", color: "#166534", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                  ⬇ Line Items CSV
                </a>
              </>
            )}
            <button onClick={reopen} style={{ background: "#fff", border: "1px solid #fbbf24", color: "#92400e", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              ✏️ Reopen for edits
            </button>
          </div>
        </div>

        {message && <Banner message={message} />}

        {summary.map(s => (
          <div key={s.title} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20, marginBottom: 14 }}>
            <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: 15, color: "#1a2a38" }}>{s.icon} {s.title}</p>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {s.rows.map(r => (
                  <tr key={r.label}>
                    <td style={{ padding: "6px 12px 6px 0", fontSize: 13, color: "#64748b", verticalAlign: "top", width: "45%" }}>{r.label}</td>
                    <td style={{ padding: "6px 0", fontSize: 14, color: "#1a2a38", fontWeight: 600, whiteSpace: "pre-wrap" }}>{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  }

  // ── Draft: multi-step form ───────────────────────────────
  return (
    <div>
      {/* Section chips with progress */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10, marginBottom: 14, WebkitOverflowScrolling: "touch" }}>
        {visibleSections.map((s, i) => {
          const prog = sectionProgress(s, data);
          const complete = prog.total > 0 && prog.done === prog.total;
          const active = i === sectionIdx;
          return (
            <button key={s.key} onClick={() => goTo(i)}
              style={{
                flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
                padding: "8px 13px", borderRadius: 99, fontSize: 12.5, fontWeight: active ? 700 : 500,
                background: active ? "#4a7a9b" : complete ? "#dcfce7" : "#fff",
                color: active ? "#fff" : complete ? "#166534" : "#475569",
                border: active ? "1px solid #4a7a9b" : complete ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                cursor: "pointer", whiteSpace: "nowrap",
              }}>
              <span>{complete && !active ? "✓" : s.icon}</span>
              {s.title}
              {prog.total > 0 && <span style={{ opacity: 0.75, fontSize: 11 }}>{prog.done}/{prog.total}</span>}
            </button>
          );
        })}
      </div>

      {message && <Banner message={message} />}

      {/* Current section */}
      {section && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "22px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ marginBottom: 18 }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1a2a38" }}>{section.icon} {section.title}</p>
            {section.description && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>{section.description}</p>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {section.fields.filter(f => isFieldVisible(f, data)).map(f => (
              <FieldInput key={f.key} field={f} data={data} onChange={setField} />
            ))}
          </div>
        </div>
      )}

      {/* Footer nav */}
      <div style={{ display: "flex", gap: 10, marginTop: 18, alignItems: "center" }}>
        <button onClick={() => goTo(sectionIdx - 1)} disabled={sectionIdx === 0}
          style={{ padding: "12px 18px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: sectionIdx === 0 ? "#cbd5e1" : "#475569", fontWeight: 700, fontSize: 14, cursor: sectionIdx === 0 ? "default" : "pointer" }}>
          ← Back
        </button>
        <button onClick={() => save()} disabled={saving}
          style={{ padding: "12px 18px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#4a7a9b", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          {saving ? "Saving…" : dirty ? "Save draft" : "Saved ✓"}
        </button>
        <div style={{ flex: 1 }} />
        {sectionIdx < visibleSections.length - 1 ? (
          <button onClick={() => goTo(sectionIdx + 1)}
            style={{ padding: "12px 22px", borderRadius: 10, border: "none", background: "#4a7a9b", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Next →
          </button>
        ) : (
          <button onClick={submit} disabled={submitting || missing.length > 0}
            style={{ padding: "12px 22px", borderRadius: 10, border: "none", background: missing.length > 0 ? "#cbd5e1" : "#16a34a", color: "#fff", fontWeight: 800, fontSize: 14, cursor: missing.length > 0 ? "default" : "pointer" }}>
            {submitting ? "Sending…" : "📤 Send to Office"}
          </button>
        )}
      </div>

      {/* Missing-required checklist on final section */}
      {sectionIdx === visibleSections.length - 1 && missing.length > 0 && (
        <div style={{ marginTop: 16, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 18px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 800, color: "#92400e" }}>
            ⚠️ {missing.length} required item{missing.length === 1 ? "" : "s"} still needed before sending:
          </p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {missing.map(m => (
              <li key={m.field.key} style={{ fontSize: 13, color: "#92400e", marginBottom: 3 }}>
                <button onClick={() => goTo(visibleSections.findIndex(s => s.key === m.section.key))}
                  style={{ background: "none", border: "none", padding: 0, color: "#b45309", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
                  {m.section.title}
                </button>
                {" — "}{m.field.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Banner({ message }: { message: { kind: "ok" | "err"; text: string } }) {
  const ok = message.kind === "ok";
  return (
    <div style={{ background: ok ? "#dcfce7" : "#fee2e2", border: `1px solid ${ok ? "#86efac" : "#fca5a5"}`, color: ok ? "#166534" : "#b91c1c", borderRadius: 10, padding: "11px 16px", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
      {message.text}
    </div>
  );
}

function FieldInput({ field, data, onChange }: {
  field: SurveyField;
  data: SurveyData;
  onChange: (key: string, value: string | string[]) => void;
}) {
  const value = data[field.key];

  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 6 }}>
        {field.label}
        {field.unit && field.unit !== "$" && <span style={{ color: "#94a3b8", fontWeight: 500 }}> ({field.unit})</span>}
        {field.required && <span style={{ color: "#d4838d" }}> *</span>}
      </label>

      {(field.type === "text" || field.type === "tel" || field.type === "email" || field.type === "date") && (
        <input type={field.type} value={typeof value === "string" ? value : ""} placeholder={field.placeholder}
          onChange={e => onChange(field.key, e.target.value)} style={INPUT_STYLE} />
      )}

      {field.type === "number" && (
        <div style={{ position: "relative" }}>
          {field.unit === "$" && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 15 }}>$</span>}
          <input type="number" inputMode="decimal" value={typeof value === "string" ? value : ""} placeholder={field.placeholder}
            onChange={e => onChange(field.key, e.target.value)}
            style={{ ...INPUT_STYLE, paddingLeft: field.unit === "$" ? 26 : 12 }} />
        </div>
      )}

      {field.type === "textarea" && (
        <textarea value={typeof value === "string" ? value : ""} placeholder={field.placeholder} rows={3}
          onChange={e => onChange(field.key, e.target.value)} style={{ ...INPUT_STYLE, resize: "vertical" }} />
      )}

      {field.type === "select" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(field.options ?? []).map(opt => {
            const selected = value === opt;
            return (
              <button key={opt} type="button" onClick={() => onChange(field.key, selected ? "" : opt)}
                style={{
                  padding: "9px 14px", borderRadius: 10, fontSize: 13.5, fontWeight: selected ? 700 : 500,
                  background: selected ? "#4a7a9b" : "#f8fafc", color: selected ? "#fff" : "#475569",
                  border: selected ? "1px solid #4a7a9b" : "1px solid #e2e8f0", cursor: "pointer",
                }}>
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {field.type === "multi" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(field.options ?? []).map(opt => {
            const arr = Array.isArray(value) ? value : [];
            const selected = arr.includes(opt);
            return (
              <button key={opt} type="button"
                onClick={() => onChange(field.key, selected ? arr.filter(o => o !== opt) : [...arr, opt])}
                style={{
                  padding: "9px 14px", borderRadius: 10, fontSize: 13.5, fontWeight: selected ? 700 : 500,
                  background: selected ? "#edf3f7" : "#f8fafc", color: selected ? "#4a7a9b" : "#475569",
                  border: selected ? "1.5px solid #4a7a9b" : "1px solid #e2e8f0", cursor: "pointer",
                }}>
                {selected ? "✓ " : ""}{opt}
              </button>
            );
          })}
        </div>
      )}

      {field.type === "yesno" && (
        <div style={{ display: "flex", gap: 8 }}>
          {(["yes", "no"] as const).map(opt => {
            const selected = value === opt;
            return (
              <button key={opt} type="button" onClick={() => onChange(field.key, selected ? "" : opt)}
                style={{
                  flex: 1, maxWidth: 120, padding: "10px 0", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  background: selected ? (opt === "yes" ? "#4a7a9b" : "#64748b") : "#f8fafc",
                  color: selected ? "#fff" : "#475569",
                  border: selected ? "1px solid transparent" : "1px solid #e2e8f0", cursor: "pointer",
                }}>
                {opt === "yes" ? "Yes" : "No"}
              </button>
            );
          })}
        </div>
      )}

      {field.hint && <p style={{ margin: "5px 0 0", fontSize: 12, color: "#94a3b8" }}>{field.hint}</p>}
    </div>
  );
}
