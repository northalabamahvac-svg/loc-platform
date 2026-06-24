"use client";

import { useState, useMemo, type Dispatch, type SetStateAction } from "react";
import { createClient } from "@/lib/supabase/client";

interface ScheduleEntry {
  id: string;
  project_id: string | null;
  assigned_to: string | null;
  scheduled_date: string;
  start_time: string | null;
  end_time: string | null;
  title: string | null;
  notes: string | null;
  created_at: string;
}

interface Project { id: string; name: string; }

const TECH_COLORS = ["#4a7a9b", "#d4838d", "#22c55e", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444", "#a16207"];

function getMondayOfWeek(dateStr: string): Date {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fmtShort(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" });
}

function truncate(s: string, max: number) {
  return s.length <= max ? s : s.slice(0, max) + "…";
}

export default function DispatchClient({
  initialSchedule,
  projects,
  techIds,
  weekStartDate,
}: {
  initialSchedule: ScheduleEntry[];
  projects: Project[];
  techIds: string[];
  weekStartDate: string;
}) {
  const supabase = createClient();
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(initialSchedule);
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOfWeek(weekStartDate));
  const [showForm, setShowForm] = useState(false);
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const [form, setForm] = useState({
    project_id: "", assigned_to: "", scheduled_date: "", start_time: "", end_time: "", title: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  const today = toISODate(new Date());
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const projectMap = useMemo(() => Object.fromEntries(projects.map(p => [p.id, p.name])), [projects]);
  const allTechs = techIds.length > 0 ? techIds : ["unassigned"];

  function getColor(techIdx: number) {
    return TECH_COLORS[techIdx % TECH_COLORS.length];
  }

  function weekLabel() {
    const start = weekDays[0];
    const end = weekDays[6];
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  }

  function isThisWeek() {
    const todayMonday = getMondayOfWeek(today);
    return toISODate(weekStart) === toISODate(todayMonday);
  }

  function prevWeek() { setWeekStart(d => addDays(d, -7)); }
  function nextWeek() { setWeekStart(d => addDays(d, 7)); }
  function goToday() { setWeekStart(getMondayOfWeek(today)); }

  function getJobsForCell(techId: string, dateStr: string) {
    return schedule.filter(s => s.scheduled_date === dateStr && (s.assigned_to === techId || (!s.assigned_to && techId === "unassigned")));
  }

  function getJobsForDate(dateStr: string) {
    return schedule.filter(s => s.scheduled_date === dateStr);
  }

  async function saveJob(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await supabase.from("cf_schedule").insert({
      project_id: form.project_id || null,
      assigned_to: form.assigned_to || null,
      scheduled_date: form.scheduled_date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      title: form.title.trim() || null,
      notes: form.notes.trim() || null,
    }).select().single() as any;

    if (!error && data) {
      setSchedule(prev => [...prev, data]);
    }
    setForm({ project_id: "", assigned_to: "", scheduled_date: "", start_time: "", end_time: "", title: "", notes: "" });
    setShowForm(false);
    setSaving(false);
  }

  const inputS: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 8,
    padding: "9px 12px", fontSize: 13, outline: "none", color: "#1a2a38",
  };

  // ── Mobile: vertical list by date ──
  if (mobile) {
    return (
      <div>
        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <button onClick={prevWeek} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13 }}>← Prev</button>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1a2a38", flex: 1, textAlign: "center" }}>{weekLabel()}</span>
          <button onClick={nextWeek} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13 }}>Next →</button>
          {!isThisWeek() && <button onClick={goToday} style={{ background: "#4a7a9b", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Today</button>}
          <button onClick={() => setShowForm(s => !s)} style={{ background: "#1a2a38", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>+ Add</button>
          <button onClick={() => setMobile(false)} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 10px", cursor: "pointer", fontSize: 12, color: "#64748b" }}>Grid</button>
        </div>

        {showForm && <AddJobForm form={form} setForm={setForm} projects={projects} techIds={techIds} onSubmit={saveJob} saving={saving} inputS={inputS} onCancel={() => setShowForm(false)} />}

        {weekDays.map(day => {
          const ds = toISODate(day);
          const jobs = getJobsForDate(ds);
          const isToday = ds === today;
          return (
            <div key={ds} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: isToday ? "#4a7a9b" : "#1a2a38", margin: 0 }}>
                  {isToday ? "Today — " : ""}{fmtShort(day)}
                </p>
                {jobs.length > 0 && <span style={{ background: "#edf3f7", borderRadius: 99, padding: "2px 8px", fontSize: 11, fontWeight: 700, color: "#4a7a9b" }}>{jobs.length}</span>}
              </div>
              {jobs.length === 0 ? (
                <p style={{ fontSize: 12, color: "#cbd5e1", fontStyle: "italic", paddingLeft: 8 }}>No jobs</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {jobs.map(job => {
                    const tIdx = allTechs.indexOf(job.assigned_to ?? "unassigned");
                    const col = getColor(tIdx < 0 ? 0 : tIdx);
                    return (
                      <div key={job.id} style={{ background: col + "18", border: `1px solid ${col}44`, borderLeft: `3px solid ${col}`, borderRadius: 8, padding: "8px 12px" }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#1a2a38", margin: "0 0 2px" }}>
                          {job.title ?? (job.project_id ? truncate(projectMap[job.project_id] ?? "Project", 30) : "Job")}
                        </p>
                        {(job.start_time || job.end_time) && (
                          <p style={{ fontSize: 12, color: "#475569", margin: "0 0 2px" }}>{job.start_time ?? ""}{job.end_time ? ` – ${job.end_time}` : ""}</p>
                        )}
                        {job.assigned_to && <p style={{ fontSize: 11, color: col, fontWeight: 600, margin: 0 }}>Tech: {job.assigned_to.slice(0, 8)}…</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Desktop: grid ──
  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={prevWeek} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>← Prev Week</button>
        <button onClick={nextWeek} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Next Week →</button>
        {!isThisWeek() && (
          <button onClick={goToday} style={{ background: "#4a7a9b", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Today</button>
        )}
        <span style={{ fontSize: 14, fontWeight: 700, color: "#1a2a38", flex: 1, textAlign: "center" }}>{weekLabel()}</span>
        <button onClick={() => setMobile(true)} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 12, color: "#64748b" }}>List</button>
        <button onClick={() => setShowForm(s => !s)} style={{ background: "#1a2a38", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
          {showForm ? "Cancel" : "+ Add to Schedule"}
        </button>
      </div>

      {showForm && <AddJobForm form={form} setForm={setForm} projects={projects} techIds={techIds} onSubmit={saveJob} saving={saving} inputS={inputS} onCancel={() => setShowForm(false)} />}

      {/* Grid */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{ width: 120, padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: "1px solid #f1f5f9" }}>
                Tech
              </th>
              {weekDays.map(day => {
                const ds = toISODate(day);
                const isToday = ds === today;
                return (
                  <th key={ds} style={{
                    padding: "12px 8px", textAlign: "center", fontSize: 12, fontWeight: 700,
                    color: isToday ? "#4a7a9b" : "#64748b",
                    background: isToday ? "#f0f7ff" : "transparent",
                    borderBottom: "1px solid #f1f5f9",
                    borderLeft: "1px solid #f1f5f9",
                  }}>
                    <p style={{ margin: 0, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {day.toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>
                      {day.getDate()}
                    </p>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {allTechs.map((techId, tIdx) => (
              <tr key={techId}>
                <td style={{ padding: "10px 16px", borderTop: "1px solid #f8fafc", verticalAlign: "top" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: getColor(tIdx), flexShrink: 0 }} />
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#1a2a38", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {techId === "unassigned" ? "Unassigned" : techId.slice(0, 8) + "…"}
                    </p>
                  </div>
                </td>
                {weekDays.map(day => {
                  const ds = toISODate(day);
                  const isToday = ds === today;
                  const jobs = getJobsForCell(techId, ds);
                  const col = getColor(tIdx);
                  return (
                    <td key={ds} style={{
                      padding: "6px", verticalAlign: "top",
                      background: isToday ? "#f8fbff" : "transparent",
                      borderTop: "1px solid #f8fafc",
                      borderLeft: "1px solid #f8fafc",
                      minHeight: 60,
                    }}>
                      {jobs.map(job => (
                        <div key={job.id} style={{
                          background: col + "18",
                          border: `1px solid ${col}44`,
                          borderLeft: `3px solid ${col}`,
                          borderRadius: 6,
                          padding: "5px 7px",
                          marginBottom: 4,
                          cursor: "default",
                        }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: "#1a2a38", margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {job.title ?? (job.project_id ? truncate(projectMap[job.project_id] ?? "Job", 20) : "Job")}
                          </p>
                          {job.start_time && (
                            <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>{job.start_time}</p>
                          )}
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type FormState = { project_id: string; assigned_to: string; scheduled_date: string; start_time: string; end_time: string; title: string; notes: string; };

function AddJobForm({
  form, setForm, projects, techIds, onSubmit, saving, inputS, onCancel,
}: {
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
  projects: Project[];
  techIds: string[];
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  inputS: React.CSSProperties;
  onCancel: () => void;
}) {
  function set(k: keyof FormState, v: string) { setForm(prev => ({ ...prev, [k]: v })); }

  return (
    <form onSubmit={onSubmit} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20, marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <div style={{ gridColumn: "1/-1" }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 5 }}>Job Title</label>
        <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. AC Tune-up" style={inputS} />
      </div>
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 5 }}>Project</label>
        <select value={form.project_id} onChange={e => set("project_id", e.target.value)} style={{ ...inputS, appearance: "none" }}>
          <option value="">No project</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 5 }}>Technician</label>
        <select value={form.assigned_to} onChange={e => set("assigned_to", e.target.value)} style={{ ...inputS, appearance: "none" }}>
          <option value="">Unassigned</option>
          {techIds.map(uid => <option key={uid} value={uid}>{uid.slice(0, 8)}…</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 5 }}>Date *</label>
        <input required type="date" value={form.scheduled_date} onChange={e => set("scheduled_date", e.target.value)} style={inputS} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 5 }}>Start</label>
          <input type="time" value={form.start_time} onChange={e => set("start_time", e.target.value)} style={inputS} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 5 }}>End</label>
          <input type="time" value={form.end_time} onChange={e => set("end_time", e.target.value)} style={inputS} />
        </div>
      </div>
      <div style={{ gridColumn: "1/-1" }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 5 }}>Notes</label>
        <input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any notes…" style={inputS} />
      </div>
      <div style={{ gridColumn: "1/-1", display: "flex", gap: 10 }}>
        <button type="submit" disabled={saving} style={{ flex: 1, background: "#4a7a9b", color: "#fff", border: "none", borderRadius: 9, padding: "11px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving…" : "💾 Save"}
        </button>
        <button type="button" onClick={onCancel} style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 9, padding: "11px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}
