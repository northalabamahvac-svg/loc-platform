// ============================================================
// Optional Housecall Pro API integration.
// Requires a Housecall Pro API key (available on the MAX plan
// under App Store → API) set as HCP_API_KEY. When unset, the
// submit flow still emails the office with import-ready CSVs.
// ============================================================

import { type SurveyData, customerFullName, buildEstimateLineItems } from "@/lib/hvac-survey";

const HCP_BASE = "https://api.housecallpro.com";

function headers() {
  return {
    Authorization: `Token ${process.env.HCP_API_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export function hcpConfigured(): boolean {
  return !!process.env.HCP_API_KEY;
}

interface HcpResult {
  ok: boolean;
  message: string;
  customerId?: string;
}

/**
 * Create (or reuse) the customer in Housecall Pro, then attach a lead/estimate
 * request so the office can finish pricing inside HCP. Failures are reported
 * but never block the office email.
 */
export async function pushSurveyToHcp(data: SurveyData): Promise<HcpResult> {
  if (!hcpConfigured()) return { ok: false, message: "HCP_API_KEY not configured" };

  try {
    // 1. Look for an existing customer by phone/email to avoid duplicates
    let customerId: string | undefined;
    const q = String(data.customer_phone ?? data.customer_email ?? customerFullName(data));
    const searchRes = await fetch(`${HCP_BASE}/customers?q=${encodeURIComponent(q)}&page_size=1`, { headers: headers() });
    if (searchRes.ok) {
      const body = await searchRes.json();
      customerId = body?.customers?.[0]?.id;
    }

    // 2. Create the customer if not found
    if (!customerId) {
      const createRes = await fetch(`${HCP_BASE}/customers`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          first_name: data.customer_first_name ?? "",
          last_name: data.customer_last_name ?? "",
          email: data.customer_email || undefined,
          mobile_number: data.customer_phone || undefined,
          lead_source: data.lead_source || "Field Survey",
          notifications_enabled: true,
          tags: ["System Replacement"],
          addresses: [{
            street: data.street_address ?? "",
            city: data.city ?? "",
            state: data.state ?? "",
            zip: data.zip ?? "",
            country: "US",
          }],
        }),
      });
      if (!createRes.ok) {
        const text = await createRes.text();
        return { ok: false, message: `HCP customer create failed (${createRes.status}): ${text.slice(0, 300)}` };
      }
      const created = await createRes.json();
      customerId = created?.id;
    }

    if (!customerId) return { ok: false, message: "HCP did not return a customer id" };

    // 3. Create the estimate shell with the surveyed line items
    const items = buildEstimateLineItems(data);
    const estimateRes = await fetch(`${HCP_BASE}/estimates`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        customer_id: customerId,
        note: [
          `Field survey — ${data.job_type ?? "system replacement"}`,
          ...items.map(i => `• ${i.name}${i.unitPrice ? ` — $${i.unitPrice}` : ""}${i.description ? ` (${i.description})` : ""}`),
          data.office_notes ? `Office notes: ${data.office_notes}` : "",
        ].filter(Boolean).join("\n"),
        lead_source: data.lead_source || "Field Survey",
        tags: ["System Replacement"],
      }),
    });

    if (!estimateRes.ok) {
      const text = await estimateRes.text();
      return { ok: false, customerId, message: `Customer synced to HCP, but estimate create failed (${estimateRes.status}): ${text.slice(0, 300)}` };
    }

    return { ok: true, customerId, message: "Customer + estimate pushed to Housecall Pro" };
  } catch (e) {
    return { ok: false, message: `HCP push error: ${e instanceof Error ? e.message : "unknown"}` };
  }
}
