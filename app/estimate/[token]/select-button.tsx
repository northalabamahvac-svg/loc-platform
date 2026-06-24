"use client";

import { useState } from "react";

export default function SelectClientButton({
  token,
  tier,
  tierLabel,
  accentColor,
}: {
  token: string;
  tier: string;
  tierLabel: string;
  accentColor: string;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function select() {
    setLoading(true);
    await fetch("/api/estimate/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, tier }),
    });
    setDone(true);
    setLoading(false);
    // Reload to show accepted banner
    window.location.reload();
  }

  return (
    <button
      onClick={select}
      disabled={loading || done}
      style={{
        width: "100%",
        background: done ? "#dcfce7" : accentColor,
        color: done ? "#16a34a" : "#fff",
        border: "none",
        borderRadius: 12,
        padding: "14px 0",
        fontSize: 15,
        fontWeight: 700,
        cursor: loading || done ? "default" : "pointer",
        opacity: loading ? 0.7 : 1,
        transition: "all 0.2s",
      }}
    >
      {loading ? "Selecting…" : done ? "✓ Selected!" : `Select ${tierLabel} Plan`}
    </button>
  );
}
