import type { AIResult } from "./config";

/**
 * Robustly extract the first JSON object or array from an LLM response.
 * Handles markdown code fences, leading/trailing prose, and nested structures.
 * @throws SyntaxError if no valid JSON object or array is found
 */
export function extractJSON<T = unknown>(text: string): T {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1].trim()) as T;
  }
  const start = text.search(/[{[]/);
  if (start === -1) throw new SyntaxError("No JSON object or array found in response");
  const trimmed = text.slice(start);
  const end = Math.max(trimmed.lastIndexOf("}"), trimmed.lastIndexOf("]"));
  if (end === -1) throw new SyntaxError("No closing brace or bracket found in response");
  return JSON.parse(trimmed.slice(0, end + 1)) as T;
}

/**
 * Retry an AI call with exponential backoff.
 * @param fn - Async function returning AIResult
 * @param maxRetries - Max retry attempts (default 2)
 * @param baseDelayMs - Initial delay in ms (default 500)
 */
export async function withRetry<T>(
  fn: () => Promise<AIResult<T>>,
  maxRetries = 2,
  baseDelayMs = 500
): Promise<AIResult<T>> {
  let lastError = "";

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await fn();
    if (result.success) return result;

    lastError = result.error ?? "Unknown error";

    const isQuotaError =
      lastError.includes("quota") ||
      lastError.includes("rate limit") ||
      lastError.includes("429");

    if (isQuotaError) break;

    if (attempt < maxRetries) {
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  return { success: false, data: null, error: lastError };
}
