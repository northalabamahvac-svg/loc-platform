import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { project, photos, logs } = await req.json();

  const photoSummary = (photos ?? []).slice(0, 10).map((p: any, i: number) =>
    `Photo ${i + 1}: ${p.note ?? "(no note)"} | Tags: ${(p.tags ?? []).join(", ") || "none"} | Date: ${p.taken_at}`
  ).join("\n");

  const logSummary = (logs ?? []).slice(0, 5).map((l: any) =>
    `Log ${l.log_date}: ${l.content.slice(0, 300)}`
  ).join("\n\n");

  const prompt = `You are a field service dispatcher briefing a technician before a job. Based on this project data, generate a concise briefing with 4 sections: Job Summary, Recent Site Conditions (from photos/notes), Watch Out For (issues, risks), Recommended Parts to Bring. Be specific and practical.

Project:
${JSON.stringify({ name: project.name, address: project.address, trade: project.trade, status: project.status, customer: project.customer_name }, null, 2)}

Recent Photos (last 10):
${photoSummary || "No photos on file."}

Recent Logs (last 5):
${logSummary || "No logs on file."}

Format your response with clear section headers exactly as:
**Job Summary**
[content]

**Recent Site Conditions**
[content]

**Watch Out For**
[content]

**Recommended Parts to Bring**
[content]`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }],
  });

  const briefing = (message.content[0] as any).text;
  return NextResponse.json({ briefing });
}
