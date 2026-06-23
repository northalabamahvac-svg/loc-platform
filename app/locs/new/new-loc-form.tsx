"use client";

import { useState } from "react";
import Link from "next/link";
import { createLoc } from "./actions";

const inputStyle: React.CSSProperties = {
  background: "var(--surfB)",
  border: "1px solid var(--bdr)",
  color: "var(--txt)",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 13,
  width: "100%",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
  marginBottom: 6,
  color: "var(--muted-hi)",
};

export default function NewLocForm({ userId }: { userId: string }) {
  const [name, setName] = useState("");
  const [borrowerName, setBorrowerName] = useState("");
  const [lenderName, setLenderName] = useState("");
  const [ceilingDollars, setCeilingDollars] = useState("275000");
  const [apr, setApr] = useState("15");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await createLoc({
        name,
        borrower_name: borrowerName,
        lender_name: lenderName,
        ceiling_cents: Math.round(parseFloat(ceilingDollars) * 100),
        apr: parseFloat(apr) / 100,
        start_date: startDate,
        notes: notes || null,
      });
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl p-6" style={{ background: "var(--surf)", border: "1px solid var(--bdr)" }}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label style={labelStyle}>LOC Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Blossomwood Building LOC"
            required
            style={inputStyle}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={labelStyle}>Lender</label>
            <input
              value={lenderName}
              onChange={e => setLenderName(e.target.value)}
              placeholder="e.g. Steven Watwood"
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Borrower</label>
            <input
              value={borrowerName}
              onChange={e => setBorrowerName(e.target.value)}
              placeholder="e.g. Michael Johnson"
              required
              style={inputStyle}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={labelStyle}>Ceiling ($)</label>
            <input
              type="number"
              value={ceilingDollars}
              onChange={e => setCeilingDollars(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>APR (%)</label>
            <input
              type="number"
              step="0.1"
              value={apr}
              onChange={e => setApr(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
        {error && (
          <p className="text-xs rounded-lg px-3 py-2" style={{ background: "rgba(220,38,38,0.15)", color: "var(--red-t)" }}>
            {error}
          </p>
        )}
        <div className="flex gap-3 pt-1">
          <Link
            href="/dashboard"
            className="flex-1 rounded-lg py-3 text-center text-sm font-bold transition-opacity hover:opacity-80"
            style={{ background: "var(--surfB)", color: "var(--muted-hi)", border: "1px solid var(--bdr)" }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg py-3 text-sm font-bold transition-opacity disabled:opacity-50 hover:opacity-80"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {loading ? "Creating…" : "Create LOC"}
          </button>
        </div>
      </form>
    </div>
  );
}
