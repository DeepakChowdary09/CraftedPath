/**
 * Agent Registry - Central configuration for all AI agents
 * Maps agent types to their optimal AI providers and settings
 */

import { z } from "zod";

// ============================================================================
// AGENT TYPE DEFINITIONS
// ============================================================================

export type AgentType = 
  | "job-match" 
  | "ats" 
  | "resume" 
  | "interview" 
  | "coach" 
  | "cover-letter";

export type AgentStatus = 
  | "PENDING" 
  | "PROCESSING" 
  | "PENDING_REVIEW" 
  | "COMPLETED" 
  | "FAILED";

export type ModelProvider = "groq" | "claude";

// ============================================================================
// AGENT CONFIGURATION
// ============================================================================

export interface AgentConfig {
  name: string;
  description: string;
  model: ModelProvider;
  modelName: string;
  maxTokens: number;
  temperature: number;
  rateLimitRPM: number; // Requests per minute (30 for Groq, 50 for Claude)
  supportsTools: boolean;
  requiresReview: boolean;
  systemPrompt: string;
}

// ============================================================================
// AGENT REGISTRY
// ============================================================================

export const AgentRegistry: Record<AgentType, AgentConfig> = {
  "job-match": {
    name: "Job Match Agent",
    description: "Analyzes resume against job descriptions to calculate match scores",
    model: "claude",
    modelName: "claude-sonnet-4-6",
    maxTokens: 4096,
    temperature: 0.3,
    rateLimitRPM: 50,
    supportsTools: false,
    requiresReview: false,
    systemPrompt: `You are a Job Match Agent. Analyze resumes against job descriptions.
Output valid JSON with: matchScore (0-100), breakdown (skillsMatch, experienceMatch, educationMatch, roleFit all 0-100), skillGaps (array with skill, importance [critical|high|medium|low], userHas [boolean], recommendation), strengths (array), quickWins (array), recommendedActions (array with action, priority [high|medium|low], estimatedImpact [string]), confidenceScore (0-1).
Be objective and data-driven.`,
  },

  "ats": {
    name: "ATS Agent",
    description: "Scores resume ATS compatibility and provides optimization tips",
    model: "claude",
    modelName: "claude-sonnet-4-6",
    maxTokens: 4096,
    temperature: 0.2,
    rateLimitRPM: 50,
    supportsTools: false,
    requiresReview: false,
    systemPrompt: `You are an ATS Optimization Agent. Score resumes for ATS compatibility.
Output valid JSON with: overallScore (0-100), sectionScores (contactInfo, summary, experience, education, skills all 0-100), keywordAnalysis (array of keyword, found [boolean], count, importance), issues (array of severity [critical|warning|info], section, description, suggestion), optimizationTips (array).
Focus on keyword matching and formatting.`,
  },

  "resume": {
    name: "Resume Agent",
    description: "Proposes and applies resume optimizations with human approval",
    model: "claude",
    modelName: "claude-haiku-4-5",
    maxTokens: 8192,
    temperature: 0.4,
    rateLimitRPM: 50,
    supportsTools: true,
    requiresReview: true,
    systemPrompt: `You are a Resume Optimization Agent. Propose changes to improve resume.
Use tools to save pending changes. Wait for human approval before applying.
Output valid JSON with: proposedChanges, guardrailReport, requiresApproval.`,
  },

  "interview": {
    name: "Interview Agent",
    description: "Generates interview questions and provides feedback",
    model: "groq",
    modelName: "llama-3.3-70b-versatile",
    maxTokens: 4096,
    temperature: 0.5,
    rateLimitRPM: 30,
    supportsTools: false,
    requiresReview: false,
    systemPrompt: `You are an Interview Preparation Agent. Generate relevant questions.
Be concise and actionable. Output valid JSON with: questions (array of question, category, difficulty, suggestedAnswer).`,
  },

  "coach": {
    name: "Career Coach Agent",
    description: "Provides career advice and guidance",
    model: "groq",
    modelName: "llama-3.3-70b-versatile",
    maxTokens: 4096,
    temperature: 0.6,
    rateLimitRPM: 30,
    supportsTools: false,
    requiresReview: false,
    systemPrompt: `You are a Career Coach. Provide personalized career guidance.
Be encouraging but realistic. Output valid JSON with: insights (array), actionItems (array of action, priority, timeframe), resources (array).`,
  },

  "cover-letter": {
    name: "Cover Letter Agent",
    description: "Generates tailored cover letters",
    model: "groq",
    modelName: "llama3-70b-8192",
    maxTokens: 4096,
    temperature: 0.5,
    rateLimitRPM: 30,
    supportsTools: false,
    requiresReview: true,
    systemPrompt: `You are a Cover Letter Writer. Create tailored, professional cover letters.
Highlight relevant skills and enthusiasm for the role. Output valid JSON with: coverLetter (string), highlights (array), tone (string).`,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getAgentConfig(type: AgentType): AgentConfig {
  const config = AgentRegistry[type];
  if (!config) {
    throw new Error(`Unknown agent type: ${type}`);
  }
  return config;
}

export function shouldRequireReview(type: AgentType): boolean {
  return AgentRegistry[type]?.requiresReview ?? false;
}

export function getModelForAgent(type: AgentType): { provider: ModelProvider; modelName: string } {
  const config = getAgentConfig(type);
  return { provider: config.model, modelName: config.modelName };
}

// ============================================================================
// RATE LIMITER WITH GLOBAL STATE
// ============================================================================

interface RateLimitState {
  timestamps: number[];
  rpm: number;
  windowMs: number;
}

const rateLimitState: RateLimitState = {
  timestamps: [],
  rpm: 30,
  windowMs: 60000,
};

export function checkRateLimit(): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  
  // Clean old timestamps
  rateLimitState.timestamps = rateLimitState.timestamps.filter(ts => now - ts < rateLimitState.windowMs);
  
  if (rateLimitState.timestamps.length >= rateLimitState.rpm) {
    const oldestTimestamp = rateLimitState.timestamps[0];
    const retryAfterMs = rateLimitState.windowMs - (now - oldestTimestamp);
    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1000) };
  }
  
  return { allowed: true, retryAfterMs: 0 };
}

export function recordRequest(): void {
  rateLimitState.timestamps.push(Date.now());
}

export async function waitForRateLimit(): Promise<void> {
  const { allowed, retryAfterMs } = checkRateLimit();
  if (!allowed) {
    console.log(`[RateLimiter] Rate limit hit. Waiting ${Math.ceil(retryAfterMs / 1000)}s...`);
    await new Promise(resolve => setTimeout(resolve, retryAfterMs + 100));
  }
}
