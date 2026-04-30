/**
 * AI Service Configuration
 * Validates environment variables and provides shared types for all AI providers
 */

/**
 * Configuration interface for AI provider API keys
 */
export interface AIConfig {
  /** Groq API key for LLM inference */
  groqApiKey: string | undefined;
  /** Google Gemini API key */
  geminiApiKey: string | undefined;
  /** Together.ai API key for open source models */
  togetherApiKey: string | undefined;
}

/**
 * Standardized result type for all AI operations
 * @template T - The type of data returned on success
 */
export interface AIResult<T = string> {
  /** Whether the operation succeeded */
  success: boolean;
  /** The result data (null if error) */
  data: T | null;
  /** Error message (null if success) */
  error: string | null;
}

/**
 * Runtime configuration loaded from environment variables
 */
export const aiConfig: AIConfig = {
  groqApiKey: process.env.GROQ_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  togetherApiKey: process.env.TOGETHER_API_KEY,
};

/**
 * Validate Groq API key is configured
 * @throws Error if GROQ_API_KEY is not set
 */
export function validateGroqConfig(): void {
  if (!aiConfig.groqApiKey) {
    throw new Error("GROQ_API_KEY environment variable is not set");
  }
}

/**
 * Validate Gemini API key is configured
 * @throws Error if GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY is not set
 */
export function validateGeminiConfig(): void {
  if (!aiConfig.geminiApiKey) {
    throw new Error(
      "GEMINI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY) environment variable is not set"
    );
  }
}

/**
 * Validate Together.ai API key is configured
 * @throws Error if TOGETHER_API_KEY is not set
 */
export function validateTogetherConfig(): void {
  if (!aiConfig.togetherApiKey) {
    throw new Error("TOGETHER_API_KEY environment variable is not set");
  }
}

/**
 * Log AI request for observability
 * @param provider - The AI provider name (e.g., "Groq", "Gemini")
 * @param operation - The operation being performed
 */
export function logAIRequest(provider: string, operation: string): void {
  console.log(`[AI Request] Provider: ${provider}, Operation: ${operation}`);
}

/**
 * Log AI error for observability
 * @param provider - The AI provider name
 * @param error - The error that occurred
 * @param isRetry - Whether this is a retry attempt
 */
export function logAIError(provider: string, error: Error, isRetry: boolean): void {
  console.error(
    `[AI Error] Provider: ${provider}, Retry: ${isRetry}, Message: ${error.message}`
  );
}
