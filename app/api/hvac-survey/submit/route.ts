import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import {
  type SurveyData, missingRequired, surveySummary,
  customerFullName, fullAddress,
  buildHcpCustomerCsv, buildLineItemsCsv,
} from "@/lib/hvac-survey";
import { hcpConfigured, pushSurveyToHcp } from "@/lib/housecallpro";

export async function POST(request: Request) {
  // Only signed-in company users can submit
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing survey id" }, { status: 400 });

  const supabase = createServiceClient();
  const { data: survey, error } = await supabase
    .from("cf_hvac_surveys")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !survey) return NextResponse.json({ error: "Survey not found" }, { status: 404 });

  const data = (survey.data ?? {}) as SurveyData;

  // Server-side gate: every required item must be gathered before it goes to the office
  const missing = missingRequired(data);
  if (missing.length > 0) {
    return NextResponse.json({
      error: `Survey incomplete — ${missing.length} required item(s) missing: ${missing.slice(0, 5).map(m => m.field.label).join(", ")}${missing.length > 5 ? "…" : ""}`,
    }, { status: 400 });
  }

  const name = customerFullName(data) || "Customer";
  const estimatorName = user.user_metadata?.display_name ?? user.user_metadata?.full_name ?? user.email ?? "Estimator";

  // ── Optional: push straight into Housecall Pro ────────────
  let hcpMessage = "";
  let finalStatus = "submitted";
  if (hcpConfigured()) {
    const hcp = await pushSurveyToHcp(data);
    hcpMessage = hcp.message;
    if (hcp.ok) finalStatus = "sent_to_hcp";
  }

  // ── Email the office ──────────────────────────────────────
  let emailed = false;
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    const officeEmail = process.env.OFFICE_EMAIL || process.env.GMAIL_USER;
    const summary = surveySummary(data);

    const sectionsHtml = summary.map(s => `
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin-bottom:12px">
        <p style="margin:0 0 10px;font-weight:800;font-size:14px;color:#1a2a38">${s.icon} ${s.title}</p>
        <table style="width:100%;border-collapse:collapse">
          ${s.rows.map(r => `
            <tr>
              <td style="padding:5px 12px 5px 0;color:#64748b;font-size:12px;vertical-align:top;width:45%">${escapeHtml(r.label)}</td>
              <td style="padding:5px 0;color:#1a2a38;font-size:13px;font-weight:600;white-space:pre-wrap">${escapeHtml(r.value)}</td>
            </tr>`).join("")}
        </table>
      </div>`).join("");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "survey";
    try {
      await transporter.sendMail({
        from: `"System Surveys" <${process.env.GMAIL_USER}>`,
        to: officeEmail,
        subject: `❄️ System Survey — ${name} (${data.new_tonnage ?? ""} ${data.new_config ?? ""})`,
        html: `
<div style="font-family:sans-serif;max-width:640px;margin:0 auto">
  <div style="background:#1a2a38;padding:24px 28px;border-radius:14px 14px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800">❄️ System Replacement Survey</h1>
    <p style="color:#94a3b8;margin:6px 0 0;font-size:13px">
      ${escapeHtml(name)} · ${escapeHtml(fullAddress(data))}<br/>
      Submitted by ${escapeHtml(String(estimatorName))} · ${new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })}
    </p>
  </div>
  <div style="background:#f3f7fa;padding:24px;border-radius:0 0 14px 14px">
    ${sectionsHtml}
    <div style="margin-top:8px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8">
      Attachments: customer CSV (Housecall Pro import format) and estimate line items CSV.
      ${hcpMessage ? `<br/>Housecall Pro sync: ${escapeHtml(hcpMessage)}` : ""}
    </div>
  </div>
</div>`,
        attachments: [
          { filename: `hcp-customer-${slug}.csv`, content: buildHcpCustomerCsv(data) },
          { filename: `estimate-line-items-${slug}.csv`, content: buildLineItemsCsv(data) },
        ],
      });
      emailed = true;
    } catch {
      // fall through — surface below
    }
  }

  if (!emailed && finalStatus === "submitted" && !hcpConfigured()) {
    return NextResponse.json({ error: "Email is not configured (GMAIL_USER / GMAIL_APP_PASSWORD) — survey not sent" }, { status: 500 });
  }

  await supabase
    .from("cf_hvac_surveys")
    .update({ status: finalStatus, submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);

  const parts = [
    emailed ? "Survey emailed to the office with Housecall Pro import files." : "Survey saved, but the office email could not be sent.",
    hcpMessage,
  ].filter(Boolean);

  return NextResponse.json({ ok: true, status: finalStatus, message: parts.join(" ") });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
