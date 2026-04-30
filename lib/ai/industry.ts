/**
 * Industry Insights AI Service
 * Generates AI-powered industry insights for career guidance
 * Primary: Gemini
 * Fallback: Groq
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import {
  AIResult,
  aiConfig,
  validateGeminiConfig,
  validateGroqConfig,
  logAIRequest,
  logAIError,
} from "./config";
import { extractJSON, withRetry } from "./utils";

const TIMEOUT_MS = 30000;

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

function createGeminiClient() {
  validateGeminiConfig();
  const genAI = new GoogleGenerativeAI(aiConfig.geminiApiKey!);
  return genAI.getGenerativeModel(
    { model: "gemini-1.5-flash-latest" },
    { apiVersion: "v1beta" }
  );
}

function createGroqClient(): Groq {
  validateGroqConfig();
  return new Groq({ apiKey: aiConfig.groqApiKey });
}

async function generateWithGemini(
  industry: string
): Promise<AIResult<IndustryInsightsData>> {
  logAIRequest("Gemini", "generateIndustryInsights");

  const prompt = `Return ONLY valid JSON for the ${industry} industry. No extra text.
{"salaryRanges":[{"role":"string","min":0,"max":0,"median":0,"location":"string"}],"growthRate":0,"demandLevel":"High","topSkills":["skill"],"marketOutlook":"Positive","keyTrends":["trend"],"recommendedSkills":["skill"]}
Rules: 5 roles in salaryRanges, growthRate is a number, 5 items each in topSkills/keyTrends/recommendedSkills, demandLevel one of High/Medium/Low, marketOutlook one of Positive/Neutral/Negative.`;

  try {
    const model = createGeminiClient();
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 2048 },
    });

    const text = result.response.text();
    const parsed = extractJSON<IndustryInsightsData>(text);

    return { success: true, data: parsed, error: null };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logAIError("Gemini", err, false);
    return { success: false, data: null, error: err.message };
  }
}

async function generateWithGroq(
  industry: string
): Promise<AIResult<IndustryInsightsData>> {
  logAIRequest("Groq", "generateIndustryInsights (fallback)");

  const prompt = `Return ONLY valid JSON for the ${industry} industry.
{"salaryRanges":[{"role":"string","min":0,"max":0,"median":0,"location":"string"}],"growthRate":0,"demandLevel":"High","topSkills":["skill"],"marketOutlook":"Positive","keyTrends":["trend"],"recommendedSkills":["skill"]}
Rules: 5 roles, growthRate number, 5 items each arrays, demandLevel High/Medium/Low, marketOutlook Positive/Neutral/Negative.`;

  const client = createGroqClient();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const completion = await client.chat.completions.create(
      {
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-8b-instant",
        max_tokens: 2048,
        temperature: 0.7,
      },
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return { success: false, data: null, error: "Groq returned empty content" };
    }

    const parsed = extractJSON<IndustryInsightsData>(content);

    return { success: true, data: parsed, error: null };
  } catch (error) {
    clearTimeout(timeoutId);
    const err = error instanceof Error ? error : new Error(String(error));
    logAIError("Groq", err, false);
    return { success: false, data: null, error: err.message };
  }
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
  let result = await withRetry(() => generateWithGemini(industry));

  if (!result.success) {
    console.log("[AI Fallback] Switching from Gemini to Groq for industry insights");
    result = await withRetry(() => generateWithGroq(industry));
  }

  return result;
}
