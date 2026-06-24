import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import SelectClientButton from "./select-button";

interface Tier {
  id: string;
  tier: string;
  label: string;
  price_cents: number;
  description: string;
  includes: string[];
  position: number;
}

export default async function EstimatePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: estimate } = await supabase
    .from("cf_estimates")
    .select("*")
    .eq("token", token)
    .single();

  if (!estimate) notFound();

  const { data: tiers } = await supabase
    .from("cf_estimate_tiers")
    .select("*")
    .eq("estimate_id", estimate.id)
    .order("position");

  const tierList: Tier[] = tiers ?? [];

  const TIER_COLORS: Record<string, { border: string; accent: string; badge: string }> = {
    good:   { border: "#22c55e", accent: "#16a34a", badge: "#f0fdf4" },
    better: { border: "#4a7a9b", accent: "#4a7a9b", badge: "#eff6ff" },
    best:   { border: "#d4838d", accent: "#be5a67", badge: "#fff1f2" },
  };

  const TIER_ICONS: Record<string, string> = { good: "✅", better: "⭐", best: "🏆" };

  return (
    <div style={{ minHeight: "100vh", background: "#f3f7fa", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#1a2a38", padding: "28px 24px 32px", textAlign: "center" }}>
        <p style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          Blossomwood Building Co. · HVAC · Plumbing · Electrical
        </p>
        <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "0 0 6px" }}>{estimate.title}</h1>
        <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>Review your options and select the plan that works best for you</p>
        {estimate.notes && (
          <p style={{ color: "#cbd5e1", fontSize: 13, marginTop: 12, maxWidth: 500, margin: "12px auto 0" }}>{estimate.notes}</p>
        )}
      </div>

      {/* Accepted banner */}
      {estimate.status === "accepted" && estimate.accepted_tier && (
        <div style={{ background: "#dcfce7", borderBottom: "1px solid #86efac", padding: "14px 24px", textAlign: "center" }}>
          <p style={{ color: "#16a34a", fontWeight: 700, fontSize: 15, margin: 0 }}>
            ✓ You selected the {estimate.accepted_tier.charAt(0).toUpperCase() + estimate.accepted_tier.slice(1)} plan — we&apos;ll be in touch soon!
          </p>
        </div>
      )}

      {/* Tier cards */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 16px 64px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {tierList.map(tier => {
            const colors = TIER_COLORS[tier.tier] ?? TIER_COLORS.better;
            const isAccepted = estimate.accepted_tier === tier.tier;
            return (
              <div key={tier.id} style={{
                background: "#fff",
                borderRadius: 20,
                border: `2px solid ${isAccepted ? colors.border : "#e2e8f0"}`,
                overflow: "hidden",
                boxShadow: isAccepted ? `0 4px 24px ${colors.border}44` : "0 2px 8px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
              }}>
                <div style={{ background: colors.badge, padding: "20px 24px 16px", borderBottom: `1px solid ${colors.border}33` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}>{TIER_ICONS[tier.tier] ?? "✅"}</span>
                    {isAccepted && (
                      <span style={{ background: colors.border, color: "#fff", borderRadius: 99, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>Selected</span>
                    )}
                  </div>
                  <p style={{ fontSize: 20, fontWeight: 800, color: "#1a2a38", margin: "0 0 4px" }}>{tier.label}</p>
                  <p style={{ fontSize: 28, fontWeight: 900, color: colors.accent, margin: 0 }}>
                    ${(tier.price_cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div style={{ padding: "20px 24px", flex: 1, display: "flex", flexDirection: "column" }}>
                  {tier.description && (
                    <p style={{ fontSize: 14, color: "#475569", marginBottom: 16, lineHeight: 1.6 }}>{tier.description}</p>
                  )}
                  {tier.includes && tier.includes.length > 0 && (
                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                      {tier.includes.map((item, i) => (
                        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, color: "#1a2a38" }}>
                          <span style={{ color: colors.accent, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div style={{ marginTop: "auto" }}>
                    {estimate.status === "accepted" ? (
                      isAccepted ? (
                        <div style={{ background: colors.badge, borderRadius: 12, padding: "14px 0", textAlign: "center", fontWeight: 700, color: colors.accent, fontSize: 15, border: `1px solid ${colors.border}44` }}>
                          ✓ {tier.label} plan selected
                        </div>
                      ) : (
                        <div style={{ borderRadius: 12, padding: "14px 0", textAlign: "center", fontWeight: 600, color: "#94a3b8", fontSize: 14, border: "1px solid #e2e8f0" }}>
                          Not selected
                        </div>
                      )
                    ) : (
                      <SelectClientButton token={token} tier={tier.tier} tierLabel={tier.label} accentColor={colors.accent} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, marginTop: 32 }}>
          Questions? Call or text us anytime — Blossomwood Building Co.
        </p>
      </div>
    </div>
  );
}
