"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

interface FollowupRule {
  id: string;
  owner_id: string;
  trigger: string;
  delay_hours: number;
  subject: string;
  body: string;
  active: boolean;
  created_at: string;
}

interface QueueItem {
  id: string;
  rule_id: string;
  to_email: string;
  to_name: string | null;
  project_id: string | null;
  scheduled_at: string;
  sent_at: string | null;
  status: "pending" | "sent" | "failed" | "cancelled";
  created_at: string;
  cf_followup_rules?: { trigger: string } | null;
  cf_projects?: { name: string } | null;
}

const TRIGGER_LABELS: Record<string, string> = {
  estimate_sent:       "After estimate is sent",
  job_complete:        "After job is completed",
  membership_expiry:   "Before membership expires (30 days)",
  review_request:      "After review request",
};

const DEFAULT_RULES = [
  {
    trigger: "estimate_sent",
    delay_hours: 24,
    subject: "Following up on your estimate",
    body: "Hi {customer_name},\n\nI wanted to follow up on the estimate we sent for {project_name}. Do you have any questions? We'd love to help you get started.\n\nBest,\nThe Team",
  },
  {
    trigger: "job_complete",
    delay_hours: 48,
    subject: "How did we do?",
    body: "Hi {customer_name},\n\nThank you for choosing us for {project_name}! We hope everything went smoothly. If you have a moment, we'd really appreciate your feedback or a quick Google review.\n\n{review_link}\n\nThank you!",
  },
  {
    trigger: "membership_expiry",
    delay_hours: 720,
    subject: "Your service plan is renewing soon",
    body: "Hi {customer_name},\n\nJust a heads-up that your service membership is coming up for renewal. We appreciate your continued trust in us!\n\nIf you have any questions about your plan, please don't hesitate to reach out.\n\nBest,\nThe Team",
  },
];

const emptyRuleForm = {
  trigger: "estimate_sent",
  delay_hours: "24",
  subject: "",
  body: "",
  active: true,
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function FollowupsClient({ initialRules, initialQueue, userId }: {
  initialRules: FollowupRule[];
  initialQueue: QueueItem[];
  userId: string;
}) {
  const supabase = createClient();
  const [rules, setRules] = useState<FollowupRule[]>(initialRules);
  const [queue, setQueue] = useState<QueueItem[]>(initialQueue);
  const [section, setSection] = useState<"rules" | "queue">("rules");
  const [queueTab, setQueueTab] = useState<"pending" | "sent" | "failed">("pending");
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState<FollowupRule | null>(null);
  const [ruleForm, setRuleForm] = useState(emptyRuleForm);
  const [savingRule, setSavingRule] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Auto-seed default rules on first load
  useEffect(() => {
    if (rules.length === 0 && !seeding) {
      setSeeding(true);
      (async () => {
        const toInsert = DEFAULT_RULES.map(r => ({ ...r, owner_id: userId, active: true }));
        const { data } = await supabase.from("cf_followup_rules").insert(toInsert).select() as any;
        if (data) setRules(data);
        setSeeding(false);
      })();
    }
  }, []);

  function openNewRule() {
    setEditingRule(null);
    setRuleForm(emptyRuleForm);
    setShowRuleForm(true);
  }

  function openEditRule(rule: FollowupRule) {
    setEditingRule(rule);
    setRuleForm({
      trigger: rule.trigger,
      delay_hours: String(rule.delay_hours),
      subject: rule.subject,
      body: rule.body,
      active: rule.active,
    });
    setShowRuleForm(true);
  }

  async function saveRule() {
    if (!ruleForm.subject.trim() || !ruleForm.body.trim()) return;
    setSavingRule(true);
    const payload = {
      owner_id: userId,
      trigger: ruleForm.trigger,
      delay_hours: parseInt(ruleForm.delay_hours) || 24,
      subject: ruleForm.subject.trim(),
      body: ruleForm.body.trim(),
      active: ruleForm.active,
    };
    if (editingRule) {
      const { data } = await supabase.from("cf_followup_rules").update(payload).eq("id", editingRule.id).select().single() as any;
      if (data) setRules(prev => prev.map(r => r.id === editingRule.id ? data : r));
    } else {
      const { data } = await supabase.from("cf_followup_rules").insert(payload).select().single() as any;
      if (data) setRules(prev => [...prev, data]);
    }
    setSavingRule(false);
    setShowRuleForm(false);
  }

  async function toggleRule(rule: FollowupRule) {
    setTogglingId(rule.id);
    await supabase.from("cf_followup_rules").update({ active: !rule.active }).eq("id", rule.id);
    setRules(prev => prev.map(r => r.id === rule.id ? { ...r, active: !r.active } : r));
    setTogglingId(null);
  }

  async function deleteRule(id: string) {
    if (!confirm("Delete this rule?")) return;
    await supabase.from("cf_followup_rules").delete().eq("id", id);
    setRules(prev => prev.filter(r => r.id !== id));
  }

  async function cancelQueueItem(id: string) {
    setCancelling(id);
    await supabase.from("cf_followup_queue").update({ status: "cancelled" }).eq("id", id);
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: "cancelled" } : q));
    setCancelling(null);
  }

  const pendingItems = useMemo(() => queue.filter(q => q.status === "pending"), [queue]);
  const sentItems   = useMemo(() => queue.filter(q => q.status === "sent"), [queue]);
  const failedItems = useMemo(() => queue.filter(q => q.status === "failed"), [queue]);

  const queueItems = queueTab === "pending" ? pendingItems : queueTab === "sent" ? sentItems : failedItems;

  return (
    <div style={{ minHeight: "100vh", background: "#f3f7fa" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 16px 80px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a2a38", margin: 0 }}>✉️ Automated Follow-ups</h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>Rules and email queue</p>
          </div>
          {section === "rules" && (
            <button onClick={openNewRule}
              style={{ background: "#4a7a9b", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              + New Rule
            </button>
          )}
        </div>

        {/* Email provider notice */}
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 16px", marginBottom: 20, fontSize: 13, color: "#1d4ed8" }}>
          💡 Connect an email provider (Resend) to enable actual sending. For now, emails are marked as &ldquo;sent&rdquo; in the queue.
        </div>

        {/* Section toggle */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {(["rules", "queue"] as const).map(s => (
            <button key={s} onClick={() => setSection(s)}
              style={{
                padding: "9px 20px", borderRadius: 9, fontSize: 14, fontWeight: section === s ? 700 : 500, cursor: "pointer",
                background: section === s ? "#1a2a38" : "#fff",
                color: section === s ? "#fff" : "#475569",
                border: section === s ? "1px solid #1a2a38" : "1px solid #e2e8f0",
              }}>
              {s === "rules" ? "📋 Rules" : "📬 Queue"}
              {s === "queue" && pendingItems.length > 0 && (
                <span style={{ marginLeft: 6, background: "#d4838d", color: "#fff", borderRadius: 99, padding: "1px 6px", fontSize: 11, fontWeight: 700 }}>
                  {pendingItems.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Rules section ── */}
        {section === "rules" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {seeding && <p style={{ color: "#94a3b8", fontSize: 14 }}>Creating default rules…</p>}
            {rules.length === 0 && !seeding && (
              <div style={{ border: "1px dashed #e2e8f0", borderRadius: 14, padding: 48, textAlign: "center" }}>
                <p style={{ fontSize: 28, margin: "0 0 8px" }}>📋</p>
                <p style={{ fontSize: 14, color: "#94a3b8" }}>No rules yet — click New Rule to get started</p>
              </div>
            )}
            {rules.map(rule => (
              <div key={rule.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2a38" }}>{rule.subject}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                        background: rule.active ? "#dcfce7" : "#f1f5f9",
                        color: rule.active ? "#16a34a" : "#64748b",
                      }}>{rule.active ? "Active" : "Inactive"}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 4px" }}>
                      {TRIGGER_LABELS[rule.trigger] ?? rule.trigger} · {rule.delay_hours}h delay
                    </p>
                    <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {rule.body.slice(0, 80)}…
                    </p>
                  </div>
                  <button
                    onClick={() => toggleRule(rule)}
                    disabled={togglingId === rule.id}
                    style={{
                      flexShrink: 0, width: 40, height: 22, borderRadius: 99, border: "none", cursor: "pointer",
                      background: rule.active ? "#4a7a9b" : "#e2e8f0",
                      position: "relative", transition: "background 0.2s",
                    }}>
                    <span style={{
                      position: "absolute", top: 2, left: rule.active ? 20 : 2, width: 18, height: 18,
                      borderRadius: "50%", background: "#fff", transition: "left 0.2s",
                    }} />
                  </button>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
                  <button onClick={() => openEditRule(rule)}
                    style={{ fontSize: 12, fontWeight: 600, background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 7, padding: "5px 12px", cursor: "pointer", color: "#475569" }}>
                    Edit
                  </button>
                  <button onClick={() => deleteRule(rule.id)}
                    style={{ fontSize: 12, fontWeight: 600, background: "none", border: "none", padding: "5px 8px", cursor: "pointer", color: "#d4838d", marginLeft: "auto" }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Queue section ── */}
        {section === "queue" && (
          <div>
            {/* Queue tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {([
                { key: "pending", label: `Pending (${pendingItems.length})` },
                { key: "sent",    label: `Sent (${sentItems.length})` },
                { key: "failed",  label: `Failed (${failedItems.length})` },
              ] as const).map(t => (
                <button key={t.key} onClick={() => setQueueTab(t.key)}
                  style={{
                    padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: queueTab === t.key ? 700 : 500, cursor: "pointer",
                    background: queueTab === t.key ? "#4a7a9b" : "#fff",
                    color: queueTab === t.key ? "#fff" : "#475569",
                    border: queueTab === t.key ? "1px solid #4a7a9b" : "1px solid #e2e8f0",
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {queueItems.length === 0 ? (
              <div style={{ border: "1px dashed #e2e8f0", borderRadius: 14, padding: 48, textAlign: "center" }}>
                <p style={{ fontSize: 28, margin: "0 0 8px" }}>📬</p>
                <p style={{ fontSize: 14, color: "#94a3b8" }}>No {queueTab} emails</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {queueItems.map(item => (
                  <div key={item.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1a2a38" }}>{item.to_name ?? item.to_email}</span>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>{item.to_email}</span>
                      </div>
                      {item.cf_projects?.name && (
                        <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 2px" }}>Project: {item.cf_projects.name}</p>
                      )}
                      <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                        {item.status === "sent" ? `Sent ${fmtDateTime(item.sent_at!)}` : `Scheduled ${fmtDateTime(item.scheduled_at)}`}
                      </p>
                    </div>
                    {item.status === "pending" && (
                      <button onClick={() => cancelQueueItem(item.id)} disabled={cancelling === item.id}
                        style={{ fontSize: 12, fontWeight: 600, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 7, padding: "5px 10px", cursor: "pointer", color: "#ea580c", flexShrink: 0 }}>
                        {cancelling === item.id ? "…" : "Cancel"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rule form slide-up */}
      {showRuleForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setShowRuleForm(false)}>
          <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "8px 20px 48px", width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: "#e5e7eb", margin: "10px auto 20px" }} />
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a2a38", margin: "0 0 20px" }}>
              {editingRule ? "Edit Rule" : "New Follow-up Rule"}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em" }}>Trigger</label>
                <select value={ruleForm.trigger} onChange={e => setRuleForm(f => ({ ...f, trigger: e.target.value }))}
                  style={{ width: "100%", background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#1a2a38", outline: "none" }}>
                  {Object.entries(TRIGGER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em" }}>Delay (hours)</label>
                <input type="number" min="0" value={ruleForm.delay_hours} onChange={e => setRuleForm(f => ({ ...f, delay_hours: e.target.value }))}
                  style={{ width: "100%", boxSizing: "border-box", background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#1a2a38", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em" }}>Email Subject</label>
                <input value={ruleForm.subject} onChange={e => setRuleForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Following up on your estimate"
                  style={{ width: "100%", boxSizing: "border-box", background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#1a2a38", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em" }}>Email Body</label>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 6px" }}>Variables: {"{customer_name}"} {"{project_name}"} {"{review_link}"}</p>
                <textarea value={ruleForm.body} onChange={e => setRuleForm(f => ({ ...f, body: e.target.value }))} rows={6}
                  placeholder="Hi {customer_name},&#10;&#10;…"
                  style={{ width: "100%", boxSizing: "border-box", background: "#f3f7fa", border: "1px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#1a2a38", outline: "none", resize: "vertical" }} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={ruleForm.active} onChange={e => setRuleForm(f => ({ ...f, active: e.target.checked }))} />
                <span style={{ fontSize: 13, color: "#1a2a38" }}>Active</span>
              </label>
              <button onClick={saveRule} disabled={savingRule}
                style={{ background: "#4a7a9b", color: "#fff", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                {savingRule ? "Saving…" : editingRule ? "Save Changes" : "Create Rule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
