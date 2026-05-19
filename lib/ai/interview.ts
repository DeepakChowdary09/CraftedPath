/**
 * Interview AI Service
 * Uses callAI() from lib/ai/client.ts — Gemini primary, Groq fallback
 */

import { callAI, generateJSON } from "./client";

/**
 * Single quiz question structure
 */
export interface QuizQuestion {
  /** The question text */
  question: string;
  /** Array of 4 multiple choice options */
  options: string[];
  /** The correct answer (must match one of the options) */
  correctAnswer: string;
  /** Explanation of why the answer is correct */
  explanation: string;
}

/**
 * Standardized result type
 */
export interface AIResult<T = string> {
  success: boolean;
  data: T | null;
  error: string | null;
}

/**
 * Generate technical interview quiz questions
 * @param industry - User's industry (e.g., "Software Engineering")
 * @param skills - Array of user skills
 * @returns Promise<AIResult<QuizQuestion[]>> - 5 quiz questions or error
 * @throws Never throws - errors returned in result object
 */
export async function generateQuiz(
  industry: string,
  skills: string[]
): Promise<AIResult<QuizQuestion[]>> {
  const safeSkills = Array.isArray(skills) ? skills : [];
  const skillsNote = safeSkills.length
    ? `, skills: ${safeSkills.slice(0, 5).join(", ")}`
    : "";

  const prompt = `Generate 5 multiple-choice technical interview questions for a ${industry} professional${skillsNote}.
Return ONLY valid JSON, no extra text:
{"questions":[{"question":"string","options":["a","b","c","d"],"correctAnswer":"string","explanation":"string"}]}`;

  try {
    const parsed = await generateJSON(prompt) as { questions: QuizQuestion[] };
    return { success: true, data: parsed.questions, error: null };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, data: null, error: msg };
  }
}

/**
 * Generate personalized improvement tip based on wrong answers
 * @param industry - User's industry
 * @param wrongQuestions - Formatted string of wrong questions and correct answers
 * @returns Promise<AIResult<string>> - Encouraging improvement tip or error
 * @throws Never throws - errors returned in result object
 */
export async function generateImprovementTip(
  industry: string,
  wrongQuestions: string
): Promise<AIResult<string>> {
  const prompt = `A ${industry} professional got these wrong: ${wrongQuestions}. Give one concise 1-2 sentence improvement tip. Be encouraging.`;

  try {
    const result = await callAI(prompt);
    return { success: true, data: result.text.trim(), error: null };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, data: null, error: msg };
  }
}
