"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface Article {
  title: string;
  steps: string[];
}

interface Category {
  icon: string;
  title: string;
  color: string;
  articles: Article[];
}

const CATEGORIES: Category[] = [
  {
    icon: "🚀",
    title: "Getting Started",
    color: "#4a7a9b",
    articles: [
      {
        title: "Creating your first project",
        steps: [
          "From the Projects page, tap the + New Project button (top right)",
          "Enter a project name and optionally the customer name, phone, and address",
          "Set the status to Active and tap Save",
          "Your new project appears in the list — tap it to open the project dashboard",
        ],
      },
      {
        title: "Setting up your profile",
        steps: [
          "Click your name or avatar at the bottom of the sidebar → Profile",
          "Set your Display Name — this is what appears throughout the app",
          "Add your Google Review URL to enable the customer review request feature",
          "Change your password from the same page",
        ],
      },
      {
        title: "Adding team members",
        steps: [
          "Your team members each sign in with their own CamBBC account",
          "They are automatically visible in the Dispatch board and can be assigned jobs",
          "Each person's name comes from their profile Display Name",
          "Owners see extra tabs inside projects (Share, Team, Signatures)",
        ],
      },
    ],
  },
  {
    icon: "📷",
    title: "Photos & Documentation",
    color: "#4a7a9b",
    articles: [
      {
        title: "Uploading photos to a project",
        steps: [
          "Open a project and tap the Photos tab",
          "Tap Upload or the + button to select one or multiple photos from your device",
          "Photos are saved to the project with a timestamp automatically",
          "Tap any photo thumbnail to view it full-screen or delete it",
        ],
      },
      {
        title: "Before / After comparisons",
        steps: [
          "Open a project → Before/After tab",
          "Select one photo for the 'Before' slot and one for the 'After' slot",
          "The slider lets you drag between them side by side",
          "This view can be shared with customers via the Share tab",
        ],
      },
      {
        title: "Checklists and templates",
        steps: [
          "Open the Templates page from the sidebar to see pre-built HVAC checklists",
          "Inside a project, go to the Checklist tab and select a template to use",
          "Check items off as work is completed — progress is saved automatically",
          "Create a custom template from scratch on the Templates page",
        ],
      },
    ],
  },
  {
    icon: "💰",
    title: "Estimates",
    color: "#d4838d",
    articles: [
      {
        title: "Building a Good / Better / Best estimate",
        steps: [
          "Open a project → Estimates tab (second row of tabs)",
          "Tap New Estimate and give it a title",
          "Set a price, description, and line-item 'includes' list for each of the 3 tiers",
          "Tap Save Estimate — a unique customer link is generated automatically",
        ],
      },
      {
        title: "Sharing an estimate with a customer",
        steps: [
          "From the Estimates tab, tap Copy Link next to any saved estimate",
          "Send the link via text, email, or any messaging app — no login needed to view it",
          "The customer sees all three tiers with prices and can select one",
          "You are notified in the Estimates tab when a tier is accepted",
        ],
      },
      {
        title: "Tracking accepted estimates",
        steps: [
          "Accepted estimates are flagged with a green 'Accepted' badge in the list",
          "The Analytics page shows total Accepted Estimate Value in dollars",
          "Click the estimate to see which tier the customer chose",
          "Use the accepted tier info to proceed with ordering parts or scheduling",
        ],
      },
    ],
  },
  {
    icon: "📅",
    title: "Scheduling & Booking",
    color: "#4a7a9b",
    articles: [
      {
        title: "Using the Dispatch board",
        steps: [
          "Tap Dispatch in the sidebar to open the weekly grid",
          "Each column is a day of the week; each row is a technician",
          "Tap + Add to Schedule and fill in the job title, tech, date, and time",
          "Jobs appear as color-coded blocks — tap a block to view details",
        ],
      },
      {
        title: "Your public booking page",
        steps: [
          "Your booking page lives at your-site.com/book — no login required",
          "Share this URL on your Google Business profile, website, or in texts",
          "Customers fill out name, email, service type, address, and preferred time",
          "All submissions appear in the Bookings inbox in the sidebar",
        ],
      },
      {
        title: "Managing the Bookings inbox",
        steps: [
          "Open Bookings from the sidebar to see all incoming requests",
          "Filter by status: All / New / Contacted / Booked / Cancelled",
          "Tap a booking to cycle its status (New → Contacted → Booked → Cancelled)",
          "Assign a team member using the assign dropdown on each row",
        ],
      },
    ],
  },
  {
    icon: "🤖",
    title: "AI Features",
    color: "#8b5e3c",
    articles: [
      {
        title: "Generating an AI daily log",
        steps: [
          "Open a project → AI Log tab",
          "Type or paste your rough notes about the day's work",
          "Tap Generate Log — the AI rewrites it as a professional field report",
          "Tap Save to store the log or copy it to paste elsewhere",
        ],
      },
      {
        title: "Voice walkthrough → log",
        steps: [
          "Open a project → Walkthrough tab",
          "Tap the microphone button and speak your site walkthrough out loud",
          "Tap Stop — your voice is transcribed automatically",
          "Tap Generate Log to have AI clean up the transcript into a formal log",
        ],
      },
      {
        title: "Pre-job AI briefing",
        steps: [
          "Open a project → Briefing tab (second row of tabs)",
          "Tap Generate Briefing — AI reads the project history and photos",
          "The briefing includes: what's been done, what to bring, safety notes, customer info",
          "Read it before you arrive on-site — takes about 10 seconds to generate",
        ],
      },
      {
        title: "Project recap",
        steps: [
          "Open a project → Recap tab",
          "Tap Generate Recap once the job is complete",
          "AI produces a one-page summary of all work done, photos captured, and logs",
          "Use the recap for customer closeout emails or internal records",
        ],
      },
    ],
  },
  {
    icon: "🤝",
    title: "Memberships",
    color: "#d4838d",
    articles: [
      {
        title: "Adding a service member",
        steps: [
          "Go to Members in the sidebar",
          "Tap + New Member and enter customer name, email, phone, and address",
          "Select a plan tier: Basic, Standard, or Premium",
          "Set the agreement start date and renewal date — the app will flag expiring agreements",
        ],
      },
      {
        title: "Managing renewals",
        steps: [
          "The Members page shows a banner when any agreement expires within 30 days",
          "Filter by Expiring Soon to see everyone who needs attention",
          "Update the renewal date by editing the member record",
          "Status can be set to Active, Paused, or Cancelled",
        ],
      },
    ],
  },
  {
    icon: "✉️",
    title: "Follow-ups & Reviews",
    color: "#d4838d",
    articles: [
      {
        title: "Configuring follow-up rules",
        steps: [
          "Go to Follow-ups in the sidebar",
          "Three default rules are pre-configured: post-estimate (2d), post-booking (1d), completed job (7d)",
          "Toggle any rule on or off with the Active switch",
          "Edit the trigger, delay, and email template for any rule",
        ],
      },
      {
        title: "Requesting Google reviews",
        steps: [
          "Go to Profile and paste your Google Review link in the Google Review Link field",
          "Open any completed project → tap the ⭐ Request Review button in the project header",
          "Enter the customer's name and email — a pre-written message populates",
          "Tap Open in Email App to send directly or Copy Message to paste it elsewhere",
        ],
      },
    ],
  },
  {
    icon: "📊",
    title: "Analytics & Job Costing",
    color: "#4a7a9b",
    articles: [
      {
        title: "Reading the Analytics dashboard",
        steps: [
          "Go to Analytics in the sidebar for 8 live KPI cards",
          "Active Projects, Completed This Month, Photos, Bookings, Estimates, Revenue, Memberships, and Jobs This Week",
          "Tap any card with a View → link to jump to that section",
          "The Recent Bookings and Upcoming Schedule panels update on every page load",
        ],
      },
      {
        title: "Tracking job costs",
        steps: [
          "Open a project → Costs tab (second row of tabs)",
          "Set a total budget for the job",
          "Add line items: labor, materials, or subcontractor costs with amounts",
          "A progress bar shows how much of the budget has been used",
        ],
      },
    ],
  },
];

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [openCat, setOpenCat] = useState<number | null>(null);
  const [openArticle, setOpenArticle] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return CATEGORIES;
    const q = search.toLowerCase();
    return CATEGORIES.map(cat => ({
      ...cat,
      articles: cat.articles.filter(a =>
        a.title.toLowerCase().includes(q) || a.steps.some(s => s.toLowerCase().includes(q))
      ),
    })).filter(cat => cat.articles.length > 0 || cat.title.toLowerCase().includes(q));
  }, [search]);

  const hasSearch = search.trim().length > 0;

  return (
    <div style={{ minHeight: "100vh", background: "#f3f7fa" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "28px 16px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a2a38", margin: "0 0 4px" }}>❓ Help Center</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>
            Step-by-step guides for every feature ·{" "}
            <Link href="/camfolder/welcome" style={{ color: "#4a7a9b", fontWeight: 600, textDecoration: "none" }}>
              Relaunch the tutorial →
            </Link>
          </p>

          {/* Search */}
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#94a3b8", pointerEvents: "none" }}>🔍</span>
            <input
              type="text"
              placeholder="Search guides…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                background: "#fff", border: "1px solid #e2e8f0",
                borderRadius: 12, padding: "13px 14px 13px 40px",
                fontSize: 15, outline: "none", color: "#1a2a38",
              }}
            />
          </div>
        </div>

        {/* Categories */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.length === 0 && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "36px 24px", textAlign: "center", border: "1px solid #e2e8f0" }}>
              <p style={{ fontSize: 32, margin: "0 0 8px" }}>🔍</p>
              <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>No guides found for &ldquo;{search}&rdquo;</p>
            </div>
          )}

          {filtered.map((cat, ci) => {
            const isOpen = hasSearch || openCat === ci;
            return (
              <div key={cat.title} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>

                {/* Category header */}
                <button
                  onClick={() => setOpenCat(isOpen && !hasSearch ? null : ci)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "18px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left",
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: cat.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                      {cat.icon}
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#1a2a38", margin: 0 }}>{cat.title}</p>
                      <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>{cat.articles.length} {cat.articles.length === 1 ? "guide" : "guides"}</p>
                    </div>
                  </div>
                  <span style={{ color: "#94a3b8", fontSize: 18, transition: "transform 0.2s", transform: isOpen ? "rotate(90deg)" : "none" }}>›</span>
                </button>

                {/* Articles */}
                {isOpen && (
                  <div style={{ borderTop: "1px solid #f1f5f9" }}>
                    {cat.articles.map((article) => {
                      const key = cat.title + article.title;
                      const isArticleOpen = openArticle === key;
                      return (
                        <div key={article.title} style={{ borderTop: "1px solid #f8fafc" }}>
                          <button
                            onClick={() => setOpenArticle(isArticleOpen ? null : key)}
                            style={{
                              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "14px 20px 14px 72px", background: "none", border: "none", cursor: "pointer", textAlign: "left",
                            }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: "#1a2a38" }}>{article.title}</span>
                            <span style={{ color: "#94a3b8", fontSize: 14, transition: "transform 0.2s", transform: isArticleOpen ? "rotate(90deg)" : "none" }}>›</span>
                          </button>

                          {isArticleOpen && (
                            <div style={{ padding: "0 20px 18px 72px" }}>
                              <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                                {article.steps.map((step, si) => (
                                  <li key={si} style={{ fontSize: 14, color: "#475569", lineHeight: 1.6 }}>{step}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 32 }}>
          Missing something?{" "}
          <Link href="/camfolder/welcome" style={{ color: "#4a7a9b", textDecoration: "none", fontWeight: 600 }}>
            Relaunch the tutorial
          </Link>{" "}
          for a full walkthrough.
        </p>
      </div>
    </div>
  );
}
