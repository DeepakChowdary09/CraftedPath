/**
 * Resume AI Service
 * Provider: Gemini Flash (ATS-optimized) — no fallback
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  AIResult,
  aiConfig,
  validateGeminiConfig,
  logAIRequest,
  logAIError,
} from "./config";

const TIMEOUT_MS = 30000;

function createGeminiClient() {
  validateGeminiConfig();
  const genAI = new GoogleGenerativeAI(aiConfig.geminiApiKey!);
  return genAI.getGenerativeModel(
    { model: "gemini-1.5-flash-latest" },
    { apiVersion: "v1beta" }
  );
}

async function improveWithGemini(
  content: string,
  type: string,
  industry: string
): Promise<AIResult<string>> {
  logAIRequest("Gemini", "improveResume");

  const shortCurrent = content.slice(0, 500);
  const prompt = `Improve this ${type} for a ${industry} resume. Use action verbs, metrics, achievements. Return only the improved text, no explanations.
Original: "${shortCurrent}"`;

  try {
    const model = createGeminiClient();
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 1024 },
    });

    const text = result.response.text();
    if (!text?.trim()) {
      return { success: false, data: null, error: "Gemini returned empty content" };
    }

    return { success: true, data: text.trim(), error: null };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logAIError("Gemini", err, false);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Improve resume content using AI
 * Uses Gemini as primary provider, falls back to Groq on failure
 * @param content - The current resume content to improve
 * @param type - The type of content being improved (e.g., "experience", "summary")
 * @param industry - User's industry for context
 * @returns Promise<AIResult<string>> - Improved content or error
 * @throws Never throws - errors returned in result object
 * @example
 * const result = await improveResumeContent("Managed a team", "experience", "Software Engineering");
 * if (result.success) {
 *   console.log(result.data); // "Led cross-functional team of 5 engineers..."
 * }
 */
export async function improveResumeContent(
  content: string,
  type: string,
  industry: string
): Promise<AIResult<string>> {
  return improveWithGemini(content, type, industry);
}
