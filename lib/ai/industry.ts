/**
 * Industry Insights AI Service
 * Uses callAI() from lib/ai/client.ts — Gemini primary, Groq fallback
 */

import { generateJSON } from "./client";

/**
 * Industry insights data structure
 */
export interface IndustryInsightsData {
  salaryRanges: Array<{
    role: string;
    min: number;
    max: number;
    median: number;
    location: string;
  }>;
  growthRate: number;
  demandLevel: "High" | "Medium" | "Low";
  topSkills: string[];
  marketOutlook: "Positive" | "Neutral" | "Negative";
  keyTrends: string[];
  recommendedSkills: string[];
}

export interface AIResult<T = string> {
  success: boolean;
  data: T | null;
  error: string | null;
}

/**
 * Generate AI-powered industry insights
 * @param industry - The industry to analyze (e.g., "Software Engineering")
 * @returns Promise<AIResult<IndustryInsightsData>> - Insights data or error
 * @throws Never throws - errors returned in result object
 */
export async function generateIndustryInsights(
  industry: string
): Promise<AIResult<IndustryInsightsData>> {
  const prompt = `Return ONLY valid JSON for the ${industry} industry. No extra text.
{"salaryRanges":[{"role":"string","min":0,"max":0,"median":0,"location":"string"}],"growthRate":0,"demandLevel":"High","topSkills":["skill"],"marketOutlook":"Positive","keyTrends":["trend"],"recommendedSkills":["skill"]}
Rules: 5 roles in salaryRanges, growthRate is a number, 5 items each in topSkills/keyTrends/recommendedSkills, demandLevel one of High/Medium/Low, marketOutlook one of Positive/Neutral/Negative.`;

  try {
    const parsed = await generateJSON(prompt) as IndustryInsightsData;
    return { success: true, data: parsed, error: null };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, data: null, error: msg };
  }
}
