/**
 * Observability Layer for Unified AI Agents
 * Tracks token usage, latency, failures, and agent performance
 */

import { db as prisma } from "@/lib/prisma";

// ============================================================================
// OBSERVABILITY TYPES
// ============================================================================

export interface AgentMetrics {
  agentType: string;
  userId: string;
  workflowId?: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  success: boolean;
  error?: string;
  toolCalls: ToolCallMetrics[];
  promptVersion: string;
  retries: number;
  provider: string;
}

export interface ToolCallMetrics {
  tool: string;
  durationMs: number;
  success: boolean;
  error?: string;
}

export interface LogEntry {
  timestamp: Date;
  level: "info" | "warn" | "error" | "debug";
  agentType: string;
  workflowId?: string;
  userId: string;
  message: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// IN-MEMORY LOG BUFFER (for streaming)
// ============================================================================

const logBuffer: LogEntry[] = [];
const MAX_BUFFER_SIZE = 1000;

// ============================================================================
// LOGGER CLASS
// ============================================================================

class AgentLogger {
  private metrics: AgentMetrics[] = [];

  // -------------------------------------------------------------------------
  // Logging Methods
  // -------------------------------------------------------------------------

  info(
    agentType: string,
    userId: string,
    message: string,
    metadata?: Record<string, unknown>,
    workflowId?: string
  ): void {
    this.log("info", agentType, userId, message, metadata, workflowId);
  }

  warn(
    agentType: string,
    userId: string,
    message: string,
    metadata?: Record<string, unknown>,
    workflowId?: string
  ): void {
    this.log("warn", agentType, userId, message, metadata, workflowId);
  }

  error(
    agentType: string,
    userId: string,
    message: string,
    error?: Error,
    workflowId?: string
  ): void {
    this.log("error", agentType, userId, message, { error: error?.message, stack: error?.stack }, workflowId);
  }

  debug(
    agentType: string,
    userId: string,
    message: string,
    metadata?: Record<string, unknown>,
    workflowId?: string
  ): void {
    if (process.env.NODE_ENV === "development") {
      this.log("debug", agentType, userId, message, metadata, workflowId);
    }
  }

  private log(
    level: LogEntry["level"],
    agentType: string,
    userId: string,
    message: string,
    metadata?: Record<string, unknown>,
    workflowId?: string
  ): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      agentType,
      userId,
      workflowId,
      message,
      metadata,
    };

    // Add to buffer
    logBuffer.push(entry);
    if (logBuffer.length > MAX_BUFFER_SIZE) {
      logBuffer.shift();
    }

    // Console output with formatting
    const prefix = workflowId 
      ? `[${agentType}] [${workflowId}] ${message}`
      : `[${agentType}] ${message}`;

    switch (level) {
      case "info":
        console.log(`[AI] ${prefix}`, metadata || "");
        break;
      case "warn":
        console.warn(`[AI Warning] ${prefix}`, metadata || "");
        break;
      case "error":
        console.error(`[AI Error] ${prefix}`, metadata || "");
        break;
      case "debug":
        console.debug(`[AI Debug] ${prefix}`, metadata || "");
        break;
    }
  }

  // -------------------------------------------------------------------------
  // Metrics Tracking
  // -------------------------------------------------------------------------

  startMetrics(agentType: string, userId: string, workflowId?: string): AgentMetrics {
    const metrics: AgentMetrics = {
      agentType,
      userId,
      workflowId,
      startTime: Date.now(),
      toolCalls: [],
      promptVersion: "1.0", // Can be updated based on prompt registry
      retries: 0,
      provider: "unknown",
      success: false,
    };

    this.metrics.push(metrics);
    return metrics;
  }

  completeMetrics(metrics: AgentMetrics, success: boolean, error?: string): void {
    metrics.endTime = Date.now();
    metrics.durationMs = metrics.endTime - metrics.startTime;
    metrics.success = success;
    if (error) metrics.error = error;

    // Persist to database
    this.persistMetrics(metrics);
  }

  recordTokenUsage(metrics: AgentMetrics, prompt: number, completion: number): void {
    metrics.tokenUsage = {
      prompt,
      completion,
      total: prompt + completion,
    };
  }

  recordToolCall(metrics: AgentMetrics, tool: string, durationMs: number, success: boolean, error?: string): void {
    metrics.toolCalls.push({
      tool,
      durationMs,
      success,
      error,
    });
  }

  recordRetry(metrics: AgentMetrics): void {
    metrics.retries++;
  }

  setProvider(metrics: AgentMetrics, provider: string): void {
    metrics.provider = provider;
  }

  // -------------------------------------------------------------------------
  // Persistence
  // -------------------------------------------------------------------------

  private async persistMetrics(metrics: AgentMetrics): Promise<void> {
    try {
      await prisma.agentRun.create({
        data: {
          userId: metrics.userId,
          agentType: metrics.agentType,
          status: metrics.success ? "completed" : "failed",
          inputSummary: `Workflow: ${metrics.workflowId || "none"}`,
          outputSummary: metrics.success 
            ? `Completed in ${metrics.durationMs}ms` 
            : `Failed: ${metrics.error}`,
          toolCallLog: metrics.toolCalls.map(tc => ({
            tool: tc.tool,
            durationMs: tc.durationMs,
            success: tc.success,
            error: tc.error,
          })),
          durationMs: metrics.durationMs,
        },
      });
    } catch (err) {
      console.error("[Observability] Failed to persist metrics:", err);
    }
  }

  // -------------------------------------------------------------------------
  // Query Methods
  // -------------------------------------------------------------------------

  async getAgentStats(userId: string, days: number = 30): Promise<{
    totalRuns: number;
    successRate: number;
    averageDuration: number;
    agentBreakdown: Record<string, { runs: number; successRate: number }>;
  }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const runs = await prisma.agentRun.findMany({
      where: {
        userId,
        createdAt: { gte: since },
      },
    });

    const totalRuns = runs.length;
    const successfulRuns = runs.filter(r => r.status === "completed").length;
    const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0;
    const averageDuration = totalRuns > 0 
      ? runs.reduce((sum, r) => sum + (r.durationMs || 0), 0) / totalRuns 
      : 0;

    const agentBreakdown: Record<string, { runs: number; successRate: number }> = {};
    
    runs.forEach(run => {
      if (!agentBreakdown[run.agentType]) {
        agentBreakdown[run.agentType] = { runs: 0, successRate: 0 };
      }
      agentBreakdown[run.agentType].runs++;
    });

    Object.keys(agentBreakdown).forEach(agentType => {
      const agentRuns = runs.filter(r => r.agentType === agentType);
      const agentSuccess = agentRuns.filter(r => r.status === "completed").length;
      agentBreakdown[agentType].successRate = (agentSuccess / agentRuns.length) * 100;
    });

    return {
      totalRuns,
      successRate,
      averageDuration,
      agentBreakdown,
    };
  }

  getRecentLogs(agentType?: string, limit: number = 100): LogEntry[] {
    let logs = logBuffer;
    if (agentType) {
      logs = logs.filter(l => l.agentType === agentType);
    }
    return logs.slice(-limit);
  }

  clearBuffer(): void {
    logBuffer.length = 0;
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const agentLogger = new AgentLogger();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function emitAgentEvent(event: {
  workflowId: string;
  agentType: string;
  step: string;
  status: "started" | "in_progress" | "completed" | "failed" | "waiting_approval";
  message: string;
  metadata?: Record<string, unknown>;
}): void {
  const fullEvent = {
    ...event,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };

  // Log the event
  agentLogger.info(
    event.agentType,
    "system",
    `[${event.step}] ${event.status}: ${event.message}`,
    event.metadata,
    event.workflowId
  );

  // Emit to any subscribers (can be extended with EventEmitter or WebSocket)
  if (typeof globalThis !== "undefined" && (globalThis as any).agentEventSubscribers) {
    (globalThis as any).agentEventSubscribers.forEach((callback: (e: typeof fullEvent) => void) => {
      try {
        callback(fullEvent);
      } catch (err) {
        console.error("[Observability] Error in event subscriber:", err);
      }
    });
  }
}

export function subscribeToAgentEvents(callback: (event: unknown) => void): () => void {
  if (typeof globalThis === "undefined") {
    return () => {};
  }

  const subscribers = (globalThis as any).agentEventSubscribers || new Set();
  subscribers.add(callback);
  (globalThis as any).agentEventSubscribers = subscribers;

  return () => {
    subscribers.delete(callback);
  };
}
