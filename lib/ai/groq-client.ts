/**
 * Hybrid AI Client — Anthropic (Claude) + Groq
 *
 * Features:
 * - Groq: llama-3.3-70b-versatile (30 RPM, sliding-window rate limiter)
 * - Claude: claude-sonnet-4-6 / claude-haiku-4-5 (50 RPM hard cap)
 *     → Throttled to 1 req / 1500 ms (~40 RPM) to stay safely under the limit
 *     → Exponential backoff on 429 responses
 * - Provider is resolved per-agent from AgentRegistry
 * - All existing exports preserved for backward compatibility
 */

import Groq from "groq-sdk";
import Anthropic from "@anthropic-ai/sdk";
import { AgentService } from "@/lib/services/agent-service";

// ============================================================================
// CONFIGURATION
// ============================================================================

const GROQ_MODEL = "llama-3.3-70b-versatile";
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 2000;
const MAX_RETRY_DELAY_MS = 30000;
const GROQ_RPM = 30;

// Claude throttle: 1 request per 1500 ms ≈ 40 RPM (safely under 50 RPM limit)
const CLAUDE_MIN_INTERVAL_MS = 1500;

// ============================================================================
// GROQ RATE LIMITER (sliding window)
// ============================================================================

interface RateLimitState {
  timestamps: number[];
  rpm: number;
  windowMs: number;
}

const rateLimitState: RateLimitState = {
  timestamps: [],
  rpm: GROQ_RPM,
  windowMs: 60000,
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function checkRateLimit(): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  
  // Clean old timestamps outside the window
  rateLimitState.timestamps = rateLimitState.timestamps.filter(
    ts => now - ts < rateLimitState.windowMs
  );
  
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
    console.log(`[Groq RateLimiter] Rate limit hit. Waiting ${Math.ceil(retryAfterMs / 1000)}s...`);
    await sleep(retryAfterMs + 100);
  }
}

// ============================================================================
// CLAUDE THROTTLE QUEUE (fixed-interval, 1 req / 1500 ms)
// ============================================================================

let claudeLastRequestTime = 0;

async function waitForClaudeThrottle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - claudeLastRequestTime;
  if (elapsed < CLAUDE_MIN_INTERVAL_MS) {
    const wait = CLAUDE_MIN_INTERVAL_MS - elapsed;
    console.log(`[Claude Throttle] Waiting ${wait}ms to respect 50 RPM limit...`);
    await sleep(wait);
  }
  claudeLastRequestTime = Date.now();
}

// ============================================================================
// CLIENT FACTORIES
// ============================================================================

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not set in environment");
  }
  return new Groq({ apiKey });
}

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not set in environment");
  }
  return new Anthropic({ apiKey });
}

// ============================================================================
// EXPONENTIAL BACKOFF
// ============================================================================

function calculateBackoff(attempt: number, retryAfterMs?: number): number {
  if (retryAfterMs && retryAfterMs > 0) {
    return retryAfterMs + 1000;
  }
  const exponentialDelay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.random() * 1000;
  return Math.min(exponentialDelay + jitter, MAX_RETRY_DELAY_MS);
}

function isRateLimitError(error: any): boolean {
  if (!error) return false;
  if (error.status === 429) return true;
  const message = error.message || String(error);
  return message.includes("429") || 
         message.includes("Too Many Requests") || 
         message.includes("rate limit") ||
         message.includes("quota") ||
         message.includes("RateLimitError");
}

// ============================================================================
// MAIN CALL OPTIONS / RESULT INTERFACES
// ============================================================================

export interface CallAIOptions {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  json?: boolean;
  maxRetries?: number;
  provider?: "groq" | "claude";
  modelName?: string;
}

export interface CallAIResult {
  text: string;
  retries: number;
  durationMs: number;
}

// ============================================================================
// GROQ CALL
// ============================================================================

async function callGroq(
  prompt: string,
  options: CallAIOptions = {}
): Promise<CallAIResult> {
  const {
    systemPrompt,
    maxTokens = 4096,
    temperature = 0.3,
    json = false,
    maxRetries = MAX_RETRIES,
    modelName = GROQ_MODEL,
  } = options;

  const startTime = Date.now();
  const client = getGroqClient();

  const messages: any[] = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await waitForRateLimit();

      const { allowed, retryAfterMs } = checkRateLimit();
      if (!allowed) {
        const delay = calculateBackoff(attempt, retryAfterMs);
        console.log(`[Groq] Rate limited. Waiting ${Math.round(delay / 1000)}s...`);
        await sleep(delay);
        continue;
      }

      recordRequest();

      const completion = await client.chat.completions.create({
        messages,
        model: modelName,
        max_tokens: maxTokens,
        temperature,
        response_format: json ? { type: "json_object" } : undefined,
      });

      const text = completion.choices[0]?.message?.content ?? "";
      const durationMs = Date.now() - startTime;

      console.log(`[Groq] Request completed in ${durationMs}ms (retries: ${attempt})`);

      return {
        text: json ? stripJsonFences(text) : text,
        retries: attempt,
        durationMs,
      };

    } catch (error: any) {
      lastError = error;

      if (isRateLimitError(error) && attempt < maxRetries) {
        const retryMatch = error.message?.match(/retry in ([\d.]+)s/i);
        const extractedRetryMs = retryMatch ? parseFloat(retryMatch[1]) * 1000 : undefined;
        const delay = calculateBackoff(attempt, extractedRetryMs);
        console.log(`[Groq] Rate limit (attempt ${attempt + 1}/${maxRetries}). Retrying in ${Math.round(delay / 1000)}s...`);
        await sleep(delay);
        continue;
      }

      break;
    }
  }

  throw lastError || new Error(`Groq API call failed after ${maxRetries} retries`);
}

// ============================================================================
// CLAUDE CALL
// ============================================================================

async function callClaude(
  prompt: string,
  options: CallAIOptions = {}
): Promise<CallAIResult> {
  const {
    systemPrompt,
    maxTokens = 4096,
    temperature = 0.3,
    json = false,
    maxRetries = MAX_RETRIES,
    modelName = "claude-sonnet-4-6",
  } = options;

  const startTime = Date.now();
  const client = getAnthropicClient();

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await waitForClaudeThrottle();

      const response = await client.messages.create({
        model: modelName,
        max_tokens: maxTokens,
        temperature,
        ...(systemPrompt ? { system: systemPrompt } : {}),
        messages: [{ role: "user", content: prompt }],
      });

      const block = response.content[0];
      const rawText = block.type === "text" ? block.text : "";
      const text = json ? stripJsonFences(rawText) : rawText;
      const durationMs = Date.now() - startTime;

      console.log(`[Claude] Request completed in ${durationMs}ms (retries: ${attempt})`);

      return { text, retries: attempt, durationMs };

    } catch (error: any) {
      lastError = error;

      if (isRateLimitError(error) && attempt < maxRetries) {
        const retryAfterHeader = error.headers?.["retry-after"];
        const retryAfterMs = retryAfterHeader ? parseFloat(retryAfterHeader) * 1000 : undefined;
        const delay = calculateBackoff(attempt, retryAfterMs);
        console.log(`[Claude] Rate limit 429 (attempt ${attempt + 1}/${maxRetries}). Retrying in ${Math.round(delay / 1000)}s...`);
        await sleep(delay);
        continue;
      }

      break;
    }
  }

  throw lastError || new Error(`Claude API call failed after ${maxRetries} retries`);
}

// ============================================================================
// UNIFIED callAI — dispatches to Groq or Claude based on provider option
// ============================================================================

export async function callAI(
  prompt: string,
  options: CallAIOptions = {}
): Promise<CallAIResult> {
  if (options.provider === "claude") {
    return callClaude(prompt, options);
  }
  return callGroq(prompt, options);
}

// ============================================================================
// AGENT-SPECIFIC CALL WITH LOGGING
// ============================================================================

export type AgentType = 
  | "job-match" 
  | "ats" 
  | "resume" 
  | "interview" 
  | "coach" 
  | "cover-letter";

export interface AgentSystemPrompts {
  "job-match": string;
  "ats": string;
  "resume": string;
  "interview": string;
  "coach": string;
  "cover-letter": string;
}

const AGENT_SYSTEM_PROMPTS: AgentSystemPrompts = {
  "job-match": `You are a Job Match Agent. Analyze resumes against job descriptions.
Output valid JSON with: matchScore (0-100), breakdown (skillsMatch, experienceMatch, educationMatch, roleFit all 0-100), skillGaps (array with skill, importance [critical|high|medium|low], userHas [boolean], recommendation), strengths (array), quickWins (array), recommendedActions (array with action, priority [high|medium|low], estimatedImpact [string]), confidenceScore (0-1).
Be objective and data-driven.`,

  "ats": `You are an ATS Optimization Agent. Score resumes for ATS compatibility.
Output valid JSON with: overallScore (0-100), sectionScores (contactInfo, summary, experience, education, skills all 0-100), keywordAnalysis (array of keyword, found [boolean], count, importance), issues (array of severity [critical|warning|info], section, description, suggestion), optimizationTips (array).
Focus on keyword matching and formatting.`,

  "resume": `You are a Resume Optimization Agent. Propose changes to improve resume.
Output valid JSON with: proposedChanges (array of section, originalText, proposedText, reason, confidence 0-1), guardrailReport (passed [boolean], issues [array]), requiresApproval [boolean], estimatedImpact [string].
Focus on improvements that address ATS feedback and job match gaps.`,

  "interview": `You are an Interview Preparation Agent. Generate relevant questions.
Be concise and actionable. Output valid JSON with: questions (array of question, category, difficulty, suggestedAnswer).`,

  "coach": `You are a Career Coach. Provide personalized career guidance.
Be encouraging but realistic. Output valid JSON with: insights (array), actionItems (array of action, priority, timeframe), resources (array).`,

  "cover-letter": `You are a Cover Letter Writer. Create tailored, professional cover letters.
Highlight relevant skills and enthusiasm for the role. Output valid JSON with: coverLetter (string), highlights (array), tone (string).`,
};

export async function callAIWithAgent(
  agentType: AgentType,
  prompt: string,
  options: CallAIOptions = {}
): Promise<CallAIResult> {
  const systemPrompt = AGENT_SYSTEM_PROMPTS[agentType];

  // Resolve provider + modelName from AgentRegistry when not overridden
  if (!options.provider) {
    try {
      const { AgentRegistry } = await import("@/lib/agents/registry");
      const config = AgentRegistry[agentType];
      if (config) {
        options = {
          ...options,
          provider: config.model as "groq" | "claude",
          modelName: options.modelName ?? config.modelName,
        };
      }
    } catch {
      // Registry unavailable — fall back to Groq
    }
  }

  return callAI(prompt, { ...options, systemPrompt });
}

// ============================================================================
// TOOL HANDLING
// ============================================================================

export interface ToolCall {
  name: string;
  args: any;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export type ToolHandler = (args: any) => Promise<ToolResult>;

export async function runAgentWithTools(
  agentType: AgentType,
  prompt: string,
  tools: Array<{ name: string; description: string; parameters: any }>,
  toolHandlers: Record<string, ToolHandler>,
  options: CallAIOptions = {},
  audit?: { userId: string; inputSummary: string; runId?: string }
): Promise<{ text: string; toolLog: ToolCall[] }> {
  const toolLog: ToolCall[] = [];
  const startTime = Date.now();
  
  // Build tool-enabled prompt
  const toolDescriptions = tools.map(t => 
    `- ${t.name}: ${t.description}\n  Parameters: ${JSON.stringify(t.parameters)}`
  ).join("\n\n");
  
  const enhancedPrompt = `${prompt}

## AVAILABLE TOOLS
${toolDescriptions}

## INSTRUCTIONS
If you need to use a tool, respond with a JSON object in this exact format:
{"tool_call": {"name": "tool_name", "arguments": {...}}}

If you don't need any tools, respond normally.`;
  
  // Call AI
  const result = await callAIWithAgent(agentType, enhancedPrompt, options);
  
  // Check for tool calls in response
  const toolCallMatch = result.text.match(/\{["']tool_call["']:\s*\{["']name["']:\s*["']([^"']+)["'],\s*["']arguments["']:\s*(\{[^}]*\})\}\}/);
  
  if (toolCallMatch) {
    const toolName = toolCallMatch[1];
    const toolArgs = JSON.parse(toolCallMatch[2]);
    
    if (toolHandlers[toolName]) {
      toolLog.push({ name: toolName, args: toolArgs });
      
      try {
        const toolResult = await toolHandlers[toolName](toolArgs);
        
        // Follow-up prompt with tool result
        const followUpPrompt = `${enhancedPrompt}\n\n## TOOL RESULT\nTool: ${toolName}\nResult: ${JSON.stringify(toolResult)}\n\nContinue with your response.`;
        
        const followUp = await callAIWithAgent(agentType, followUpPrompt, options);
        
        return { text: followUp.text, toolLog };
      } catch (error: any) {
        console.error(`[Tool Error] ${toolName}:`, error.message);
        return { text: result.text, toolLog };
      }
    }
  }
  
  // Log the run if audit info provided
  if (audit?.userId) {
    const durationMs = Date.now() - startTime;
    
    if (audit.runId) {
      // Update existing run
      await AgentService.updateRun(audit.runId, {
        toolCallLog: toolLog,
        durationMs,
      });
    } else {
      // Create new run
      await AgentService.logRun({
        userId: audit.userId,
        agentType,
        status: "COMPLETED",
        inputSummary: audit.inputSummary,
        outputSummary: result.text.slice(0, 300),
        toolCallLog: toolLog,
        durationMs,
      });
    }
  }
  
  return { text: result.text, toolLog };
}

// ============================================================================
// UTILITIES
// ============================================================================

function stripJsonFences(text: string): string {
  return text
    .replace(/```json\s*/g, "")
    .replace(/```\s*$/g, "")
    .trim();
}

export function parseJSONSafe<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

/**
 * Generate JSON from a prompt (backward compatibility for inngest functions)
 */
export async function generateJSON(prompt: string): Promise<any> {
  const result = await callAI(prompt, { json: true, temperature: 0.2 });
  return parseJSONSafe(result.text, {});
}
