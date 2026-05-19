/**
 * Cover Letter AI Service
 * Uses callAI() from lib/ai/client.ts — Gemini primary, Groq fallback
 */

import { callAI } from "./client";

/**
 * Input data for cover letter generation
 */
export interface CoverLetterData {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  candidateIndustry: string;
  candidateExperience: string;
  candidateSkills: string;
  candidateBio: string;
}

export interface AIResult<T = string> {
  success: boolean;
  data: T | null;
  error: string | null;
}

/**
 * Generate professional cover letter using AI
 * @param data - Cover letter generation parameters
 * @returns Promise<AIResult<string>> - Generated cover letter markdown or error
 * @throws Never throws - errors returned in result object
 */
export async function generateCoverLetter(data: CoverLetterData): Promise<AIResult<string>> {
  const shortDesc = data.jobDescription.slice(0, 800);
  const prompt = `Write a professional cover letter in Markdown (300 words max) for:
Role: ${data.jobTitle} at ${data.companyName}
Candidate: ${data.candidateExperience} yrs exp, industry: ${data.candidateIndustry}, skills: ${data.candidateSkills}, bio: ${data.candidateBio}
Job summary: ${shortDesc}
Tone: confident, specific. No placeholder brackets. Include greeting, 3 paragraphs, sign-off.`;

  try {
    const result = await callAI(prompt);
    return { success: true, data: result.text.trim(), error: null };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, data: null, error: msg };
  }
}
