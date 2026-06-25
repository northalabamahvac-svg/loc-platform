import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  const { token, tier } = await request.json();
  if (!token || !tier) {
    return NextResponse.json({ error: "Missing token or tier" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Update estimate and get project_id in one query
  const { data: updated, error } = await supabase
    .from("cf_estimates")
    .update({ accepted_tier: tier, status: "accepted" })
    .eq("token", token)
    .select("project_id, title")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send notification email to project owner if estimate_notifications is enabled
  if (updated?.project_id && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    const { data: memberData } = await supabase
      .from("cf_project_members")
      .select("user_id")
      .eq("project_id", updated.project_id)
      .eq("role", "owner")
      .single();

    if (memberData?.user_id) {
      const { data: { user: owner } } = await supabase.auth.admin.getUserById(memberData.user_id);
      const meta = owner?.user_metadata ?? {};

      if (meta.estimate_notifications !== false) {
        const businessName = meta.business_name ?? "Blossomwood Building Co.";
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
        });

        await transporter.sendMail({
          from: `"${businessName}" <${process.env.GMAIL_USER}>`,
          to: process.env.GMAIL_USER,
          subject: `✅ Estimate Accepted — ${tier} tier`,
          html: `
<div style="font-family:sans-serif;max-width:580px;margin:0 auto">
  <div style="background:#1a2a38;padding:24px 28px;border-radius:14px 14px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800">✅ Estimate Accepted</h1>
    <p style="color:#94a3b8;margin:6px 0 0;font-size:13px">A customer has accepted your estimate</p>
  </div>
  <div style="background:#f3f7fa;padding:28px;border-radius:0 0 14px 14px">
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td style="padding:10px 0;color:#64748b;font-size:13px;width:130px">Estimate</td>
        <td style="padding:10px 0;color:#1a2a38;font-weight:700;font-size:15px">${updated.title ?? "Estimate"}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#64748b;font-size:13px">Tier Selected</td>
        <td style="padding:10px 0"><span style="background:#edf3f7;color:#4a7a9b;font-weight:700;font-size:13px;padding:4px 10px;border-radius:6px">${tier}</span></td>
      </tr>
    </table>
    <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8">
      Log in to your CamBBC portal to view project details
    </div>
  </div>
</div>`,
        }).catch(() => {});
      }
    }
  }

  return NextResponse.json({ ok: true });
}
