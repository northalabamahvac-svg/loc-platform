import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { customerName, customerEmail, projectName, projectAddress, projectTrade, googleReviewUrl, businessEmail } = await req.json();

  if (!customerEmail || !googleReviewUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const displayName = customerName || "there";
  const replyTo = businessEmail || user.email || undefined;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f7fa;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <!-- Header -->
        <tr>
          <td style="background:#1a2a38;padding:28px 32px;text-align:center;">
            <p style="color:#94a3b8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 6px;">Blossomwood Building Co.</p>
            <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0;">Thank you for your business!</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="color:#1a2a38;font-size:16px;margin:0 0 16px;">Hi ${displayName},</p>
            <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px;">
              Thank you for choosing us${projectTrade ? ` for your ${projectTrade.toLowerCase()} work` : ""}${projectAddress ? ` at <strong>${projectAddress}</strong>` : ""}. We truly appreciate your trust in our team.
            </p>
            <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 28px;">
              If you had a great experience, we&rsquo;d be incredibly grateful if you could take a moment to leave us a Google review &mdash; it makes a huge difference for a small team like ours.
            </p>
            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${googleReviewUrl}" target="_blank"
                    style="display:inline-block;background:#d4838d;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 36px;border-radius:12px;letter-spacing:0.01em;">
                    ⭐ Leave a Google Review
                  </a>
                </td>
              </tr>
            </table>
            <p style="color:#94a3b8;font-size:13px;text-align:center;margin:16px 0 0;">Only takes 30 seconds &mdash; it means the world to us!</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
            <p style="color:#1a2a38;font-size:14px;font-weight:700;margin:0 0 4px;">Blossomwood Building Co.</p>
            ${replyTo ? `<p style="margin:0;"><a href="mailto:${replyTo}" style="color:#4a7a9b;font-size:13px;text-decoration:none;">📧 ${replyTo}</a></p>` : ""}
            <p style="color:#94a3b8;font-size:11px;margin:8px 0 0;">You received this because you recently worked with us. Reply to this email if you have any questions.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: "Blossomwood Building Co. <onboarding@resend.dev>",
    to: [customerEmail],
    replyTo: replyTo,
    subject: `${projectName ? `Re: ${projectName} — ` : ""}We'd love your feedback! ⭐`,
    html: htmlBody,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
