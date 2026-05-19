/**
 * Resume AI Service
 * Uses callAI() from lib/ai/client.ts — Gemini primary, Groq fallback
 */

import { callAI } from "./client";

export interface AIResult<T = string> {
  success: boolean;
  data: T | null;
  error: string | null;
}

/**
 * Improve resume content using AI
 * @param content - The current resume content to improve
 * @param type - The type of content being improved (e.g., "experience", "summary")
 * @param industry - User's industry for context
 * @returns Promise<AIResult<string>> - Improved content or error
 * @throws Never throws - errors returned in result object
 */
export async function improveResumeContent(
  content: string,
  type: string,
  industry: string
): Promise<AIResult<string>> {
  const shortCurrent = content.slice(0, 500);
  const prompt = `Improve this ${type} for a ${industry} resume. Use action verbs, metrics, achievements. Return only the improved text, no explanations.
Original: "${shortCurrent}"`;

  try {
    const result = await callAI(prompt);
    return { success: true, data: result.text.trim(), error: null };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, data: null, error: msg };
  }
}
