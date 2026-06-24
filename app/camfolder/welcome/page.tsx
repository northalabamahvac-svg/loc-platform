"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const STEPS = [
  {
    icon: "🎉",
    title: "Welcome to CamBBC!",
    sub: "Your field operations platform — built for Blossomwood Building Co.",
    body: "This 2-minute tour covers everything from job photos to AI-generated logs, estimates, dispatch, and memberships. You can revisit any of this in Help anytime.",
    tips: [],
    color: "#4a7a9b",
  },
  {
    icon: "📷",
    title: "Document every job site",
    sub: "Projects & Photos",
    body: "Create a project for each job. Upload photos from the field, tag them, annotate with notes, and capture GPS coordinates automatically.",
    tips: [
      "Tap + New Project from the Projects page or the camera pill",
      "Inside a project, open the Photos tab to upload from your device",
      "Use Before/After tab to compare any two photos side by side",
      "Tap any photo to annotate, comment, or delete",
    ],
    color: "#4a7a9b",
  },
  {
    icon: "💰",
    title: "Close more jobs with tiered estimates",
    sub: "Good · Better · Best",
    body: "Build a three-tier estimate, copy the customer link, and let them choose a plan on their phone — no back-and-forth calls needed.",
    tips: [
      "Open any project → Estimates tab (in the ⭐ tools row)",
      "Set a price and description for each tier",
      "Hit Send to Customer to get a shareable link",
      "Customer selects a tier — you see it update instantly",
    ],
    color: "#d4838d",
  },
  {
    icon: "📅",
    title: "Scheduling & 24/7 booking",
    sub: "Dispatch Board & /book",
    body: "Schedule jobs on the Dispatch board and share your public booking link on Google, your website, or in a text — customers book themselves.",
    tips: [
      "Go to Dispatch in the sidebar to see the week grid",
      "Tap + Add to Schedule to assign a job to a tech",
      "Share your-site.com/book anywhere — no login needed for customers",
      "New bookings appear in the Bookings inbox with a notification count",
    ],
    color: "#4a7a9b",
  },
  {
    icon: "🤖",
    title: "Let AI handle the paperwork",
    sub: "Logs · Briefings · Recaps",
    body: "Generate a professional daily log from voice notes, get a pre-job briefing before you arrive, and produce a full project recap in one click.",
    tips: [
      "AI Log tab → paste or speak your notes → AI writes the log",
      "Walkthrough tab → record voice → transcript becomes a log",
      "Briefing tab → AI summarizes site history and recommends parts to bring",
      "Recap tab → one-click professional project summary",
    ],
    color: "#8b5e3c",
  },
  {
    icon: "🤝",
    title: "Keep customers coming back",
    sub: "Memberships · Follow-ups · Reviews",
    body: "Track service agreements, send automatic follow-up emails after estimates and completed jobs, and request Google reviews from happy customers.",
    tips: [
      "Members sidebar → add customers with plan tier and renewal date",
      "Follow-ups sidebar → review the 3 default email rules and customize them",
      "Profile → paste your Google Business review URL once",
      "Inside any project, tap ⭐ Request Review to send a pre-written email",
    ],
    color: "#d4838d",
  },
  {
    icon: "📊",
    title: "Know your numbers",
    sub: "Analytics & Job Costing",
    body: "Live KPI cards show bookings, active projects, accepted estimate value, memberships, and jobs scheduled — all updated on page load.",
    tips: [
      "Analytics sidebar → 8 live stat cards at a glance",
      "Inside a project → Costs tab to set a budget and log labor & materials",
      "Budget progress bar shows % used and amount remaining",
      "Analytics links to Bookings and Dispatch for quick navigation",
    ],
    color: "#4a7a9b",
  },
];

export default function WelcomePage() {
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  async function finish() {
    setFinishing(true);
    await supabase.auth.updateUser({ data: { onboarded: true } });
    router.push("/camfolder");
  }

  async function skip() {
    await supabase.auth.updateUser({ data: { onboarded: true } });
    router.push("/camfolder");
  }

  return (
    <div style={{ minHeight: "calc(100vh - 52px)", background: "#f3f7fa", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px 80px" }}>
      <div style={{ width: "100%", maxWidth: 600 }}>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 32 }}>
          {STEPS.map((_, i) => (
            <button key={i} onClick={() => setStep(i)} style={{
              width: i === step ? 24 : 8, height: 8, borderRadius: 99,
              background: i === step ? current.color : i < step ? "#c8d8e4" : "#e2e8f0",
              border: "none", cursor: "pointer", padding: 0,
              transition: "all 0.25s ease",
            }} />
          ))}
        </div>

        {/* Card */}
        <div style={{ background: "#fff", borderRadius: 24, padding: "40px 36px", border: "1px solid #e2e8f0", boxShadow: "0 4px 32px rgba(26,42,56,0.07)" }}>

          {/* Icon */}
          <div style={{ width: 72, height: 72, borderRadius: 20, background: current.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, marginBottom: 24 }}>
            {current.icon}
          </div>

          {/* Heading */}
          <p style={{ fontSize: 12, fontWeight: 700, color: current.color, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px" }}>{current.sub}</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1a2a38", margin: "0 0 12px", lineHeight: 1.2 }}>{current.title}</h1>
          <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.7, margin: "0 0 24px" }}>{current.body}</p>

          {/* Tips */}
          {current.tips.length > 0 && (
            <div style={{ background: "#f3f7fa", borderRadius: 14, padding: "16px 20px", marginBottom: 24 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>How to use it</p>
              <ol style={{ paddingLeft: 18, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {current.tips.map((tip, i) => (
                  <li key={i} style={{ fontSize: 14, color: "#1a2a38", lineHeight: 1.5 }}>{tip}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                style={{ background: "#f3f7fa", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                ← Back
              </button>
            )}
            <button
              onClick={isLast ? finish : () => setStep(s => s + 1)}
              disabled={finishing}
              style={{ flex: 1, background: current.color, color: "#fff", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: finishing ? "default" : "pointer", opacity: finishing ? 0.7 : 1, transition: "opacity 0.2s" }}>
              {finishing ? "Setting up…" : isLast ? "🚀 Let's go!" : "Continue →"}
            </button>
          </div>

          {/* Skip */}
          {step === 0 && (
            <p style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}>
              <button onClick={skip} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 13, textDecoration: "underline" }}>
                Skip — I'll figure it out
              </button>
            </p>
          )}
        </div>

        {/* Step counter */}
        <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 16 }}>
          Step {step + 1} of {STEPS.length} · <Link href="/camfolder/help" style={{ color: "#4a7a9b", textDecoration: "none" }}>View full Help Center</Link>
        </p>
      </div>
    </div>
  );
}
