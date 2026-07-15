import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import SurveyForm, { type SurveyRow } from "../survey-form";

export default async function SurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();
  const { data: survey } = await service
    .from("cf_hvac_surveys")
    .select("id, status, data, submitted_at, created_at, customer_name")
    .eq("id", id)
    .single();

  if (!survey) notFound();

  return (
    <div style={{ minHeight: "100vh", background: "#f3f7fa" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 16px 80px" }}>
        <div style={{ marginBottom: 20 }}>
          <Link href="/camfolder/surveys" style={{ fontSize: 13, color: "#4a7a9b", textDecoration: "none", fontWeight: 600 }}>← All surveys</Link>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a2a38", margin: "8px 0 4px" }}>
            ❄️ {survey.customer_name || "System Survey"}
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
            Started {new Date(survey.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <SurveyForm initialSurvey={survey as SurveyRow} />
      </div>
    </div>
  );
}
