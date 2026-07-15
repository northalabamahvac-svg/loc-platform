import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  type SurveyData, buildHcpCustomerCsv, buildLineItemsCsv, customerFullName,
} from "@/lib/hvac-survey";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const type = new URL(request.url).searchParams.get("type") ?? "customer";

  const supabase = createServiceClient();
  const { data: survey } = await supabase
    .from("cf_hvac_surveys")
    .select("data")
    .eq("id", id)
    .single();

  if (!survey) return NextResponse.json({ error: "Survey not found" }, { status: 404 });

  const data = (survey.data ?? {}) as SurveyData;
  const slug = (customerFullName(data) || "survey").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const csv = type === "lineitems" ? buildLineItemsCsv(data) : buildHcpCustomerCsv(data);
  const filename = type === "lineitems" ? `estimate-line-items-${slug}.csv` : `hcp-customer-${slug}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
