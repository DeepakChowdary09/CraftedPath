/**
 * AI Service Configuration (legacy)
 *
 * All AI logic now lives in lib/ai/client.ts.
 * This file is kept only for backward-compatible type re-exports.
 */

/**
 * Standardized result type for all AI operations
 * @template T - The type of data returned on success
 */
export interface AIResult<T = string> {
  success: boolean;
  data: T | null;
  error: string | null;
}
