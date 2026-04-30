/**
 * Cover Letter AI Service
 * Provider: Together.ai (via OpenAI SDK) — no fallback
 */

import OpenAI from "openai";
import {
  AIResult,
  aiConfig,
  validateTogetherConfig,
  logAIRequest,
  logAIError,
} from "./config";

const TIMEOUT_MS = 30000;

/**
 * Input data for cover letter generation
 */
export interface CoverLetterData {
  /** The job title being applied for */
  jobTitle: string;
  /** The company name */
  companyName: string;
  /** Full job description text */
  jobDescription: string;
  /** Candidate's industry */
  candidateIndustry: string;
  /** Years of experience as string */
  candidateExperience: string;
  /** Comma-separated skills */
  candidateSkills: string;
  /** Candidate's bio */
  candidateBio: string;
}

function createTogetherClient(): OpenAI {
  validateTogetherConfig();
  return new OpenAI({
    apiKey: aiConfig.togetherApiKey,
    baseURL: "https://api.together.xyz/v1",
  });
}

function createCoverLetterPrompt(data: CoverLetterData): string {
  const shortDesc = data.jobDescription.slice(0, 800);
  return `Write a professional cover letter in Markdown (300 words max) for:
Role: ${data.jobTitle} at ${data.companyName}
Candidate: ${data.candidateExperience} yrs exp, industry: ${data.candidateIndustry}, skills: ${data.candidateSkills}, bio: ${data.candidateBio}
Job summary: ${shortDesc}
Tone: confident, specific. No placeholder brackets. Include greeting, 3 paragraphs, sign-off.`;
}

async function generateWithTogether(data: CoverLetterData): Promise<AIResult<string>> {
  logAIRequest("Together", "generateCoverLetter");

  const prompt = createCoverLetterPrompt(data);
  const client = createTogetherClient();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const completion = await client.chat.completions.create(
      {
        messages: [{ role: "user", content: prompt }],
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        max_tokens: 1024,
        temperature: 0.7,
      },
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      return { success: false, data: null, error: "Together returned empty content" };
    }

    return { success: true, data: content, error: null };
  } catch (error) {
    clearTimeout(timeoutId);
    const err = error instanceof Error ? error : new Error(String(error));
    logAIError("Together", err, false);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Generate professional cover letter using AI
 * Uses Together.ai as primary provider, falls back to Gemini on failure
 * @param data - Cover letter generation parameters
 * @returns Promise<AIResult<string>> - Generated cover letter markdown or error
 * @throws Never throws - errors returned in result object
 * @example
 * const result = await generateCoverLetter({
 *   jobTitle: "Senior Engineer",
 *   companyName: "TechCorp",
 *   jobDescription: "Looking for a React expert...",
 *   candidateIndustry: "Software Engineering",
 *   candidateExperience: "5",
 *   candidateSkills: "React, Node.js, TypeScript",
 *   candidateBio: "Full-stack developer..."
 * });
 * if (result.success) {
 *   console.log(result.data); // Markdown cover letter
 * }
 */
export async function generateCoverLetter(data: CoverLetterData): Promise<AIResult<string>> {
  return generateWithTogether(data);
}
