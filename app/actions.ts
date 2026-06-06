"use server";

import { GoogleGenAI } from "@google/genai";
import { ARTISAN_CATEGORIES, ArtisanCategory, JobDiagnosis, Urgency } from "@/lib/types";

const categories = ARTISAN_CATEGORIES.join(", ");

export async function diagnoseIssue(description: string, imageBase64: string | null): Promise<JobDiagnosis> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return mockDiagnosis(description);

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
You are FixMate AI, a careful Nigerian home/service repair triage assistant.
Return JSON only. Do not include markdown.

Use one artisan_category from: ${categories}.
Use urgency: High, Medium, or Low.
All naira estimate fields must be numbers only. Do not return strings like "15,000 - 25,000".
For electrical, gas, generator smoke/fumes, exposed wires, sparking, burning smells, or fuel leaks, warn the user to stop using the equipment, isolate power/fuel only if safe, ventilate the area, keep children away, and wait for a professional.

Input description:
${description || "No text description provided."}
Image provided: ${imageBase64 ? "yes" : "no"}

Expected JSON shape:
{
  "issue_title": "Short title",
  "summary": "Brief diagnosis summary",
  "artisan_category": "Plumber",
  "urgency": "High",
  "estimated_min_naira": 15000,
  "estimated_max_naira": 25000,
  "estimated_labor_naira": 10000,
  "estimated_materials_naira": 15000,
  "safety_warning": "Safety warning or null",
  "first_aid_steps": ["step 1", "step 2"],
  "follow_up_questions": ["question 1?", "question 2?"]
}`;

    const contents: Array<string | { inlineData: { mimeType: string; data: string } }> = [prompt];
    const match = imageBase64?.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
    if (match) {
      contents.push({ inlineData: { mimeType: match[1], data: match[2] } });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: { responseMimeType: "application/json" },
    });

    return validateDiagnosis(parseJson(response.text || "{}"), description);
  } catch (error) {
    console.error("Gemini diagnosis failed:", error);
    return { ...mockDiagnosis(description), error: "Gemini unavailable. Showing a safe demo diagnosis." };
  }
}

export async function getMapsApiKey() {
  return process.env.GOOGLE_MAPS_PLATFORM_KEY || "";
}

function parseJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const raw = fenced?.[1] ?? text.match(/\{[\s\S]*\}/)?.[0] ?? text;
  return JSON.parse(raw);
}

function validateDiagnosis(value: unknown, description: string): JobDiagnosis {
  const fallback = mockDiagnosis(description);
  const data = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const category = ARTISAN_CATEGORIES.includes(data.artisan_category as ArtisanCategory)
    ? (data.artisan_category as ArtisanCategory)
    : fallback.artisan_category;
  const urgency = ["High", "Medium", "Low"].includes(data.urgency as Urgency) ? (data.urgency as Urgency) : fallback.urgency;
  const max = asMoney(data.estimated_max_naira, fallback.estimated_max_naira);
  const min = Math.min(asMoney(data.estimated_min_naira, fallback.estimated_min_naira), max);

  return {
    issue_title: asText(data.issue_title, fallback.issue_title),
    summary: asText(data.summary, fallback.summary),
    artisan_category: category,
    urgency,
    estimated_min_naira: min,
    estimated_max_naira: max,
    estimated_labor_naira: asMoney(data.estimated_labor_naira, fallback.estimated_labor_naira),
    estimated_materials_naira: asMoney(data.estimated_materials_naira, fallback.estimated_materials_naira),
    safety_warning: typeof data.safety_warning === "string" ? data.safety_warning : fallback.safety_warning,
    first_aid_steps: asStringArray(data.first_aid_steps, fallback.first_aid_steps),
    follow_up_questions: asStringArray(data.follow_up_questions, fallback.follow_up_questions),
  };
}

function asText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asMoney(value: unknown, fallback: number) {
  const parsed = typeof value === "number" ? value : Number(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback;
}

function asStringArray(value: unknown, fallback: string[]) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 5) : fallback;
}

function mockDiagnosis(desc: string): JobDiagnosis {
  const text = desc.toLowerCase();
  const dangerous = ["smoke", "sparking", "shock", "burning", "gas", "fuel", "generator"].some((word) => text.includes(word));
  const category: ArtisanCategory = text.includes("generator")
    ? "Generator Repair"
    : text.includes("wire") || text.includes("socket") || text.includes("light")
      ? "Electrician"
      : text.includes("pipe") || text.includes("leak") || text.includes("tap")
        ? "Plumber"
        : text.includes("ac") || text.includes("air conditioner")
          ? "AC Repair"
          : "Other";

  return {
    issue_title: category === "Other" ? "General repair request" : `${category} inspection needed`,
    summary: "FixMate AI generated a safe preliminary assessment and matched the likely artisan category for a Nigerian service visit.",
    artisan_category: category,
    urgency: dangerous ? "High" : "Medium",
    estimated_min_naira: dangerous ? 25000 : 12000,
    estimated_max_naira: dangerous ? 55000 : 30000,
    estimated_labor_naira: dangerous ? 20000 : 10000,
    estimated_materials_naira: dangerous ? 35000 : 20000,
    safety_warning: dangerous
      ? "Stop using the equipment immediately. If it is safe, switch off power or fuel supply, ventilate the area, keep children away, and wait for a verified professional."
      : null,
    first_aid_steps: dangerous
      ? ["Stop using the equipment.", "Move people away from smoke, fumes, fuel, or exposed wires.", "Do not attempt repairs yourself."]
      : ["Avoid forcing the faulty item.", "Take a clear photo for the artisan.", "Keep the area accessible for inspection."],
    follow_up_questions: ["When did the issue start?", "Has anyone attempted a repair already?", "What area of your city should the artisan visit?"],
  };
}
