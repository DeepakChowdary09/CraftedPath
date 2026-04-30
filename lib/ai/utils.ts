import type { AIResult } from "./config";

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
