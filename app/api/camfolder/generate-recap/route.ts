import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await req.json();

  const [{ data: project }, { data: photos }, { data: logs }] = await Promise.all([
    supabase.from("cf_projects").select("*").eq("id", projectId).single(),
    supabase.from("cf_photos").select("*").eq("project_id", projectId).order("taken_at"),
    supabase.from("cf_daily_logs").select("*").eq("project_id", projectId).order("log_date"),
  ]);

  const photoNotes = (photos ?? []).filter((p: any) => p.note).map((p: any) => `• ${p.note} (${p.taken_at?.slice(0,10)})`).join("\n");
  const logSummaries = (logs ?? []).map((l: any) => `[${l.log_date}] ${l.content.slice(0, 200)}`).join("\n\n");
  const firstDate = photos?.[0]?.taken_at?.slice(0,10) ?? logs?.[0]?.log_date ?? "unknown";
  const lastDate = photos?.[photos.length-1]?.taken_at?.slice(0,10) ?? logs?.[logs.length-1]?.log_date ?? "unknown";

  const prompt = `You are writing a professional project progress recap for a contractor's client.

Project: ${(project as any)?.name}
Address: ${(project as any)?.address ?? "Not specified"}
Trade: ${(project as any)?.trade ?? "Not specified"}
Active period: ${firstDate} to ${lastDate}
Total photos: ${(photos ?? []).length}
Daily logs recorded: ${(logs ?? []).length}

Photo notes:
${photoNotes || "No photo notes recorded"}

Daily log summaries:
${logSummaries || "No daily logs recorded"}

Write a clear, professional 3-5 paragraph progress recap suitable to share with a homeowner or client. Cover: what work has been done, current project status, notable milestones, and next steps if apparent. Use plain language, no jargon. Do not use bullet points — write in flowing paragraphs. Sound confident and professional.`;

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const recap = (msg.content[0] as any).text;
  return NextResponse.json({ recap });
}
