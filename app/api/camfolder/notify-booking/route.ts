import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  const { name, email, phone, service_type, address, preferred_date, preferred_time, notes } =
    await request.json();

  if (!name || !email || !address || !service_type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { error: dbErr } = await supabase.from("cf_booking_requests").insert({
    name: name.trim(),
    email: email.trim(),
    phone: phone?.trim() || null,
    service_type,
    address: address.trim(),
    preferred_date: preferred_date || null,
    preferred_time: preferred_time || null,
    notes: notes?.trim() || null,
    status: "new",
  });

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  // Send notification email to the site owner if booking_notifications is enabled
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1 });
    const owner = usersData?.users?.[0];
    const meta = owner?.user_metadata ?? {};

    if (meta.booking_notifications !== false) {
      const businessName = meta.business_name ?? "Blossomwood Building Co.";
      const timeMap: Record<string, string> = {
        morning: "Morning (8am–12pm)",
        afternoon: "Afternoon (12pm–5pm)",
        evening: "Evening (5pm–8pm)",
      };

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
      });

      await transporter.sendMail({
        from: `"${businessName}" <${process.env.GMAIL_USER}>`,
        to: process.env.GMAIL_USER,
        subject: `📅 New Booking Request — ${service_type}`,
        html: `
<div style="font-family:sans-serif;max-width:580px;margin:0 auto">
  <div style="background:#1a2a38;padding:24px 28px;border-radius:14px 14px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800">📅 New Booking Request</h1>
    <p style="color:#94a3b8;margin:6px 0 0;font-size:13px">Someone submitted a service request from your booking page</p>
  </div>
  <div style="background:#f3f7fa;padding:28px;border-radius:0 0 14px 14px">
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td style="padding:10px 0;color:#64748b;font-size:13px;width:130px;vertical-align:top">Name</td>
        <td style="padding:10px 0;color:#1a2a38;font-weight:700;font-size:15px">${name}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#64748b;font-size:13px">Email</td>
        <td style="padding:10px 0;color:#1a2a38"><a href="mailto:${email}" style="color:#4a7a9b">${email}</a></td>
      </tr>
      ${phone ? `<tr><td style="padding:10px 0;color:#64748b;font-size:13px">Phone</td><td style="padding:10px 0;color:#1a2a38"><a href="tel:${phone}" style="color:#4a7a9b">${phone}</a></td></tr>` : ""}
      <tr>
        <td style="padding:10px 0;color:#64748b;font-size:13px">Service</td>
        <td style="padding:10px 0"><span style="background:#edf3f7;color:#4a7a9b;font-weight:700;font-size:13px;padding:4px 10px;border-radius:6px">${service_type}</span></td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#64748b;font-size:13px">Address</td>
        <td style="padding:10px 0;color:#1a2a38">${address}</td>
      </tr>
      ${preferred_date ? `<tr><td style="padding:10px 0;color:#64748b;font-size:13px">Preferred Date</td><td style="padding:10px 0;color:#1a2a38">${preferred_date}</td></tr>` : ""}
      ${preferred_time ? `<tr><td style="padding:10px 0;color:#64748b;font-size:13px">Preferred Time</td><td style="padding:10px 0;color:#1a2a38">${timeMap[preferred_time] ?? preferred_time}</td></tr>` : ""}
      ${notes ? `<tr><td style="padding:10px 0;color:#64748b;font-size:13px;vertical-align:top">Notes</td><td style="padding:10px 0;color:#1a2a38;line-height:1.6">${notes}</td></tr>` : ""}
    </table>
    <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8">
      Sent from your CamBBC booking page · Reply directly to ${email} to respond
    </div>
  </div>
</div>`,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
