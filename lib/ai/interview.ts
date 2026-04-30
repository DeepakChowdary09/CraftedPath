/**
 * Interview AI Service
 * Provider: Groq (LLaMA 3) — no fallback
 */

import Groq from "groq-sdk";
import {
  AIResult,
  aiConfig,
  validateGroqConfig,
  logAIRequest,
  logAIError,
} from "./config";

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
 * Response structure from quiz generation
 */
interface QuizResponse {
  /** Array of quiz questions */
  questions: QuizQuestion[];
}

const TIMEOUT_MS = 30000;

function createGroqClient(): Groq {
  validateGroqConfig();
  return new Groq({ apiKey: aiConfig.groqApiKey });
}

async function generateQuizWithGroq(
  industry: string,
  skills: string[]
): Promise<AIResult<QuizQuestion[]>> {
  logAIRequest("Groq", "generateQuiz");

  const safeSkills = Array.isArray(skills) ? skills : [];
  const skillsNote = safeSkills.length
    ? `, skills: ${safeSkills.slice(0, 5).join(", ")}`
    : "";
  const prompt = `Generate 5 multiple-choice technical interview questions for a ${industry} professional${skillsNote}.
Return ONLY valid JSON, no extra text:
{"questions":[{"question":"string","options":["a","b","c","d"],"correctAnswer":"string","explanation":"string"}]}`;

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

    const cleaned = content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const parsed: QuizResponse = JSON.parse(cleaned);

    return { success: true, data: parsed.questions, error: null };
  } catch (error) {
    clearTimeout(timeoutId);
    const err = error instanceof Error ? error : new Error(String(error));
    logAIError("Groq", err, false);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Generate technical interview quiz questions
 * Uses Groq as primary provider, falls back to Gemini on failure
 * @param industry - User's industry (e.g., "Software Engineering")
 * @param skills - Array of user skills
 * @returns Promise<AIResult<QuizQuestion[]>> - 5 quiz questions or error
 * @throws Never throws - errors returned in result object
 * @example
 * const result = await generateQuiz("Software Engineering", ["React", "Node.js"]);
 * if (result.success) {
 *   console.log(result.data); // QuizQuestion[]
 * }
 */
export async function generateQuiz(
  industry: string,
  skills: string[]
): Promise<AIResult<QuizQuestion[]>> {
  return generateQuizWithGroq(industry, skills);
}

async function generateImprovementTipWithGroq(
  industry: string,
  wrongQuestions: string
): Promise<AIResult<string>> {
  logAIRequest("Groq", "generateImprovementTip");

  const prompt = `A ${industry} professional got these wrong: ${wrongQuestions}. Give one concise 1-2 sentence improvement tip. Be encouraging.`;

  const client = createGroqClient();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const completion = await client.chat.completions.create(
      {
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-8b-instant",
        max_tokens: 256,
        temperature: 0.7,
      },
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      return { success: false, data: null, error: "Groq returned empty content" };
    }

    return { success: true, data: content, error: null };
  } catch (error) {
    clearTimeout(timeoutId);
    const err = error instanceof Error ? error : new Error(String(error));
    logAIError("Groq", err, false);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Generate personalized improvement tip based on wrong answers
 * Uses Groq as primary provider, falls back to Gemini on failure
 * @param industry - User's industry
 * @param wrongQuestions - Formatted string of wrong questions and correct answers
 * @returns Promise<AIResult<string>> - Encouraging improvement tip or error
 * @throws Never throws - errors returned in result object
 */
export async function generateImprovementTip(
  industry: string,
  wrongQuestions: string
): Promise<AIResult<string>> {
  return generateImprovementTipWithGroq(industry, wrongQuestions);
}
