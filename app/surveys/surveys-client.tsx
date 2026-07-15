"use client";

import { useState } from "react";
import Link from "next/link";
import { missingRequired, type SurveyData } from "@/lib/hvac-survey";

export interface SurveyListRow {
  id: string;
  customer_name: string;
  address: string | null;
  status: string;
  data: SurveyData;
  submitted_at: string | null;
  created_at: string;
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  draft:       { bg: "#fef3c7", color: "#92400e", label: "Draft" },
  submitted:   { bg: "#dcfce7", color: "#16a34a", label: "Sent to Office" },
  sent_to_hcp: { bg: "#dbeafe", color: "#1d4ed8", label: "In Housecall Pro" },
};

type Filter = "all" | "draft" | "submitted";

export default function SurveysClient({ surveys }: { surveys: SurveyListRow[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const visible = surveys.filter(s =>
    filter === "all" ? true :
    filter === "draft" ? s.status === "draft" :
    s.status !== "draft"
  );
  const draftCount = surveys.filter(s => s.status === "draft").length;

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "draft", label: "Drafts" },
    { key: "submitted", label: "Submitted" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{
              padding: "7px 16px", borderRadius: 99, fontSize: 13, fontWeight: filter === f.key ? 700 : 500,
              background: filter === f.key ? "#4a7a9b" : "#fff",
              color: filter === f.key ? "#fff" : "#475569",
              border: filter === f.key ? "1px solid #4a7a9b" : "1px solid #e2e8f0",
              cursor: "pointer",
            }}>
            {f.label}
            {f.key === "draft" && draftCount > 0 && (
              <span style={{ marginLeft: 6, background: "#d4838d", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 800, padding: "1px 6px" }}>
                {draftCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: 28, marginBottom: 8 }}>❄️</p>
          <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 16px" }}>No surveys yet — start one at the customer&apos;s house</p>
          <Link href="/surveys/new" style={{ background: "#4a7a9b", color: "#fff", fontWeight: 700, fontSize: 13, padding: "10px 18px", borderRadius: 10, textDecoration: "none" }}>
            + New Survey
          </Link>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {visible.map(s => {
          const ss = STATUS_STYLE[s.status] ?? STATUS_STYLE.draft;
          const missing = s.status === "draft" ? missingRequired(s.data).length : 0;
          return (
            <Link key={s.id} href={`/surveys/${s.id}`} style={{ textDecoration: "none" }}>
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "#1a2a38", margin: "0 0 2px" }}>
                      {s.customer_name || "Unnamed customer"}
                    </p>
                    <p style={{ fontSize: 13, color: "#475569", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {[s.data.new_tonnage, s.data.new_config].filter(Boolean).join(" ") || s.data.job_type || "—"}
                      {s.address ? ` · ${s.address}` : ""}
                    </p>
                  </div>
                  <span style={{ background: ss.bg, color: ss.color, borderRadius: 99, padding: "4px 12px", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    {ss.label}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: "10px 0 0" }}>
                  {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {s.status === "draft" && missing > 0 && <span style={{ color: "#b45309" }}> · {missing} required item{missing === 1 ? "" : "s"} left</span>}
                  {s.status === "draft" && missing === 0 && <span style={{ color: "#16a34a" }}> · ready to send</span>}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
