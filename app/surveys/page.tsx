import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import SurveysClient, { type SurveyListRow } from "./surveys-client";

export default async function SurveysPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();
  const { data: surveys } = await service
    .from("cf_hvac_surveys")
    .select("id, customer_name, address, status, data, submitted_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <div style={{ minHeight: "100vh", background: "#f3f7fa" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 16px 80px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a2a38", margin: "0 0 4px" }}>❄️ System Surveys</h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Replacement estimate walkthroughs — gather everything the office needs to build the quote</p>
          </div>
          <Link href="/surveys/new"
            style={{ background: "#4a7a9b", color: "#fff", fontWeight: 700, fontSize: 13, padding: "10px 18px", borderRadius: 10, textDecoration: "none", flexShrink: 0 }}>
            + New Survey
          </Link>
        </div>
        <SurveysClient surveys={(surveys ?? []) as SurveyListRow[]} />
      </div>
    </div>
  );
}
