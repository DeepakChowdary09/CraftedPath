/**
 * AI Router
 * Centralized exports and fallback orchestration for all AI services
 *
 * This module provides a unified interface to all AI providers with automatic fallback:
 * - Interview (Quiz): Groq → Gemini
 * - Resume Improvement: Gemini → Groq
 * - Cover Letter: Together.ai → Gemini
 * - Industry Insights: Gemini → Groq
 *
 * All functions return AIResult<T> for consistent error handling
 */

export { generateQuiz, generateImprovementTip } from "./interview";
export { improveResumeContent } from "./resume";
export { generateCoverLetter } from "./coverLetter";
export { generateIndustryInsights } from "./industry";
export type { AIResult } from "./config";
export type { IndustryInsightsData } from "./industry";
export type { CoverLetterData } from "./coverLetter";
export type { QuizQuestion } from "./interview";
