import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectName, address, trade, date, crew, weather, fieldNotes, photoNotes, photoCount, todayPhotoCount } = await req.json();

  const prompt = `You are an experienced construction site superintendent writing a professional daily job log.

Generate a detailed, professional daily construction log report based on the following information:

PROJECT: ${projectName}
${address ? `ADDRESS: ${address}` : ""}
${trade ? `TRADE: ${trade}` : ""}
DATE: ${date}
${crew ? `CREW ON SITE: ${crew}` : ""}
${weather ? `WEATHER CONDITIONS: ${weather}` : ""}
TOTAL PHOTOS ON PROJECT: ${photoCount ?? 0}
PHOTOS TAKEN TODAY: ${todayPhotoCount ?? 0}

${fieldNotes ? `FIELD NOTES FROM SUPERINTENDENT:\n${fieldNotes}` : ""}

${photoNotes ? `PHOTO DOCUMENTATION NOTES:\n${photoNotes}` : ""}

Write a complete, professional daily log that includes:
1. **Daily Summary** — A 2-3 sentence overview of the day's work
2. **Work Performed** — Detailed bullet points of all tasks completed
3. **Site Conditions** — Weather, access, any site issues
4. **Materials & Equipment** — What was used/delivered today (infer from notes if not specified)
5. **Personnel** — Who was on site and their roles (if provided)
6. **Issues / RFIs / Delays** — Any problems, questions, or delays encountered
7. **Safety Notes** — Any safety observations or incidents (note "no incidents" if none mentioned)
8. **Photo Documentation** — Summary of what was documented with photos today
9. **Next Steps** — What is planned for the next work day

Use professional construction industry language. Be specific and factual based on the information provided. If information for a section is not provided, make a reasonable professional note based on context. Format clearly with section headers.`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const log = (message.content[0] as any).text;
  return NextResponse.json({ log });
}
