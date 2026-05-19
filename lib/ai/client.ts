/**
 * AI Client — re-exports from the primary hybrid client (lib/ai/groq-client.ts).
 * Also exports initialized Anthropic + Groq singletons and the Claude safety throttle.
 */

import Anthropic from "@anthropic-ai/sdk";
import Groq from "groq-sdk";

// ============================================================================
// CLIENT SINGLETONS
// ============================================================================

let _anthropicClient: Anthropic | null = null;
let _groqClient: Groq | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set in environment");
    _anthropicClient = new Anthropic({ apiKey });
  }
  return _anthropicClient;
}

export function getGroqClientSingleton(): Groq {
  if (!_groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY not set in environment");
    _groqClient = new Groq({ apiKey });
  }
  return _groqClient;
}

// ============================================================================
// CLAUDE SAFETY THROTTLE (50 RPM = 1 req / 1200ms; we use 1500ms to be safe)
// ============================================================================

const CLAUDE_MIN_INTERVAL_MS = 1500;
let _claudeLastCall = 0;

export async function claudeThrottle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - _claudeLastCall;
  if (elapsed < CLAUDE_MIN_INTERVAL_MS) {
    const wait = CLAUDE_MIN_INTERVAL_MS - elapsed;
    await new Promise<void>(resolve => setTimeout(resolve, wait));
  }
  _claudeLastCall = Date.now();
}

// ============================================================================
// RE-EXPORTS from primary hybrid client (backward compat)
// ============================================================================

export {
  callAI,
  callAIWithAgent,
  runAgentWithTools,
  parseJSONSafe,
  generateJSON,
  checkRateLimit,
  recordRequest,
  waitForRateLimit,
  type CallAIOptions,
  type CallAIResult,
  type AgentType,
  type ToolCall,
  type ToolResult,
  type ToolHandler,
} from "./groq-client";

