import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import SurveyForm from "../survey-form";

export default async function NewSurveyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div style={{ minHeight: "100vh", background: "#f3f7fa" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 16px 80px" }}>
        <div style={{ marginBottom: 20 }}>
          <Link href="/camfolder/surveys" style={{ fontSize: 13, color: "#4a7a9b", textDecoration: "none", fontWeight: 600 }}>← All surveys</Link>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1a2a38", margin: "8px 0 4px" }}>❄️ New System Survey</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Work through each section — required items are marked with *</p>
        </div>
        <SurveyForm initialSurvey={null} />
      </div>
    </div>
  );
}
