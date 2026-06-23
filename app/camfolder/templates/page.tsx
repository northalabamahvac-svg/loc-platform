"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Template { id: string; name: string; created_at: string; }
interface TemplateItem { id: string; template_id: string; label: string; requires_photo: boolean; position: number; }

const inputStyle: React.CSSProperties = {
  background: "var(--surfB)", border: "1px solid var(--bdr)", color: "var(--txt)",
  borderRadius: 8, padding: "10px 14px", fontSize: 14, width: "100%", outline: "none",
};

export default function TemplatesPage() {
  const supabase = createClient();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [items, setItems] = useState<Record<string, TemplateItem[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newItemLabel, setNewItemLabel] = useState<Record<string, string>>({});
  const [newItemPhoto, setNewItemPhoto] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("cf_templates").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setTemplates(data ?? []); setLoading(false); });
  }, []);

  async function loadItems(id: string) {
    if (items[id]) return;
    const { data } = await supabase.from("cf_template_items").select("*").eq("template_id", id).order("position");
    setItems(prev => ({ ...prev, [id]: data ?? [] }));
  }

  async function createTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from("cf_templates").insert({ name: newName.trim(), owner_id: user!.id }).select().single() as any;
    if (data) { setTemplates(prev => [data, ...prev]); setItems(prev => ({ ...prev, [data.id]: [] })); }
    setNewName("");
  }

  async function addItem(templateId: string) {
    const label = newItemLabel[templateId]?.trim();
    if (!label) return;
    const requires_photo = newItemPhoto[templateId] ?? false;
    const pos = items[templateId]?.length ?? 0;
    const { data } = await supabase.from("cf_template_items").insert({ template_id: templateId, label, requires_photo, position: pos }).select().single() as any;
    if (data) setItems(prev => ({ ...prev, [templateId]: [...(prev[templateId] ?? []), data] }));
    setNewItemLabel(prev => ({ ...prev, [templateId]: "" }));
    setNewItemPhoto(prev => ({ ...prev, [templateId]: false }));
  }

  async function deleteItem(templateId: string, itemId: string) {
    await supabase.from("cf_template_items").delete().eq("id", itemId);
    setItems(prev => ({ ...prev, [templateId]: prev[templateId].filter(i => i.id !== itemId) }));
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Delete this template?")) return;
    await supabase.from("cf_templates").delete().eq("id", id);
    setTemplates(prev => prev.filter(t => t.id !== id));
  }

  return (
    <div className="min-h-screen">
      <header className="px-4 py-3 flex items-center gap-3 sticky top-0 z-50" style={{ background: "rgba(15,15,30,0.9)", borderBottom: "1px solid var(--bdr)", backdropFilter: "blur(8px)" }}>
        <Link href="/camfolder" className="text-xs font-semibold hover:opacity-70" style={{ color: "var(--muted-hi)" }}>← Projects</Link>
        <div style={{ width: 1, height: 16, background: "var(--bdr)" }} />
        <h1 className="text-sm font-bold" style={{ color: "var(--txt-hi)" }}>📋 Checklist Templates</h1>
      </header>

      <main className="max-w-2xl mx-auto px-3 py-5 space-y-3" style={{ paddingBottom: 80 }}>
        <p className="text-xs px-1" style={{ color: "var(--muted)" }}>Create reusable checklists you can apply to any project.</p>

        <form onSubmit={createTemplate} className="rounded-2xl p-4" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>New Template</p>
          <div className="flex gap-2">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. HVAC Install Checklist" style={{ ...inputStyle, flex: 1, fontSize: 13 }} />
            <button type="submit" className="rounded-lg px-3 text-xs font-bold" style={{ background: "var(--accent)", color: "#fff" }}>Create</button>
          </div>
        </form>

        {loading && <p className="text-xs text-center py-8" style={{ color: "var(--muted)" }}>Loading…</p>}

        {templates.map(t => {
          const tItems = items[t.id] ?? [];
          const isOpen = expanded === t.id;
          return (
            <div key={t.id} className="rounded-2xl overflow-hidden" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
              <div className="px-4 py-3 flex items-center justify-between cursor-pointer"
                onClick={() => { setExpanded(isOpen ? null : t.id); loadItems(t.id); }}>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--txt-hi)" }}>{t.name}</p>
                  {tItems.length > 0 && <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{tItems.length} item{tItems.length !== 1 ? "s" : ""}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={e => { e.stopPropagation(); deleteTemplate(t.id); }} className="text-xs hover:opacity-60" style={{ color: "var(--red-t)" }}>Delete</button>
                  <span style={{ color: "var(--muted)" }}>{isOpen ? "▲" : "▼"}</span>
                </div>
              </div>

              {isOpen && (
                <div style={{ borderTop: "1px solid var(--bdr)" }}>
                  {tItems.map(item => (
                    <div key={item.id} className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: "1px solid var(--bdr)" }}>
                      <div>
                        <p className="text-sm" style={{ color: "var(--txt)" }}>{item.label}</p>
                        {item.requires_photo && <p className="text-xs" style={{ color: "var(--accent-hi)" }}>📷 Photo required</p>}
                      </div>
                      <button onClick={() => deleteItem(t.id, item.id)} className="text-xs hover:opacity-60 ml-3" style={{ color: "var(--red-t)" }}>Remove</button>
                    </div>
                  ))}

                  <div className="px-4 py-3 space-y-2" style={{ borderTop: "1px solid var(--bdr)" }}>
                    <div className="flex gap-2">
                      <input value={newItemLabel[t.id] ?? ""} onChange={e => setNewItemLabel(prev => ({ ...prev, [t.id]: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && addItem(t.id)}
                        placeholder="New item…" style={{ ...inputStyle, flex: 1, fontSize: 13 }} />
                      <button onClick={() => addItem(t.id)} className="rounded-lg px-3 text-xs font-bold" style={{ background: "var(--accent)", color: "#fff" }}>Add</button>
                    </div>
                    <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--muted-hi)" }}>
                      <input type="checkbox" checked={newItemPhoto[t.id] ?? false} onChange={e => setNewItemPhoto(prev => ({ ...prev, [t.id]: e.target.checked }))} />
                      Require photo to complete
                    </label>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {!loading && templates.length === 0 && (
          <div className="rounded-2xl p-10 text-center" style={{ border: "1px dashed var(--bdr)" }}>
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>No templates yet — create one above</p>
          </div>
        )}
      </main>
    </div>
  );
}
