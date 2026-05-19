/**
 * AI Router
 * Centralized re-exports for all AI services.
 * All AI calls flow through callAI() in lib/ai/client.ts.
 */

export { callAI, runAgentWithTools } from "./client";
export { generateQuiz, generateImprovementTip } from "./interview";
export { improveResumeContent } from "./resume";
export { generateCoverLetter } from "./coverLetter";
export { generateIndustryInsights } from "./industry";
export type { AIResult, IndustryInsightsData } from "./industry";
export type { CoverLetterData } from "./coverLetter";
export type { QuizQuestion } from "./interview";
