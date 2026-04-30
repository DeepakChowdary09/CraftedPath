/**
 * Structured Logging Utility
 * Provides consistent logging across the application
 * No secrets or PII should ever be logged
 */

interface LogContext {
  operation?: string;
  userId?: string;
  provider?: string;
  durationMs?: number;
  [key: string]: unknown;
}

/**
 * Log levels
 */
type LogLevel = "info" | "warn" | "error" | "debug";

/**
 * Create a structured log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): Record<string, unknown> {
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    };
  }

  return entry;
}

/**
 * Logger instance for application-wide logging
 */
export const logger = {
  /**
   * Log informational message
   * @param message - Log message
   * @param context - Additional context
   */
  info: (message: string, context?: LogContext): void => {
    const entry = createLogEntry("info", message, context);
    console.log(JSON.stringify(entry));
  },

  /**
   * Log warning message
   * @param message - Warning message
   * @param context - Additional context
   */
  warn: (message: string, context?: LogContext): void => {
    const entry = createLogEntry("warn", message, context);
    console.warn(JSON.stringify(entry));
  },

  /**
   * Log error message
   * @param message - Error description
   * @param error - Error object
   * @param context - Additional context
   */
  error: (message: string, error: Error, context?: LogContext): void => {
    const entry = createLogEntry("error", message, context, error);
    console.error(JSON.stringify(entry));
  },

  /**
   * Log debug message (only in development)
   * @param message - Debug message
   * @param context - Additional context
   */
  debug: (message: string, context?: LogContext): void => {
    if (process.env.NODE_ENV === "development") {
      const entry = createLogEntry("debug", message, context);
      console.debug(JSON.stringify(entry));
    }
  },

  /**
   * Log AI operation
   * @param provider - AI provider name
   * @param operation - Operation name
   * @param success - Whether operation succeeded
   * @param durationMs - Operation duration
   * @param context - Additional context
   */
  ai: (
    provider: string,
    operation: string,
    success: boolean,
    durationMs?: number,
    context?: LogContext
  ): void => {
    const entry = createLogEntry(
      success ? "info" : "error",
      `AI operation: ${operation}`,
      {
        provider,
        operation,
        success,
        durationMs,
        ...context,
      }
    );
    console.log(JSON.stringify(entry));
  },
};

export default logger;
