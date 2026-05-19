import { db } from "@/lib/prisma";

export const AgentService = {
  /**
   * Log a completed (or failed) agent run.
   * Call this after runAgentWithTools finishes.
   * @param {{ userId: string, agentType: string, status?: string, inputSummary: string, outputSummary: string, toolCallLog: Array, durationMs?: number }} data
   */
  async logRun({ userId, agentType, status = "completed", inputSummary, outputSummary, toolCallLog, durationMs = null }) {
    return db.agentRun.create({
      data: {
        userId,
        agentType,
        status,
        inputSummary,
        outputSummary,
        toolCallLog,
        durationMs,
      },
    });
  },

  /**
   * Get all agent runs for a user, newest first.
   * @param {string} userId
   * @param {{ agentType?: string, limit?: number }} [filters]
   */
  async getRunsByUser(userId, { agentType, limit = 20 } = {}) {
    return db.agentRun.findMany({
      where: {
        userId,
        ...(agentType && { agentType }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  /**
   * Get a single run by ID (with ownership check).
   * @param {string} runId
   * @param {string} userId
   */
  async getRunById(runId, userId) {
    return db.agentRun.findFirst({
      where: { id: runId, userId },
    });
  },

  /**
   * Update an existing agent run with partial data (tool logs, duration, etc.).
   * @param {string} runId
   * @param {{ toolCallLog?: any; durationMs?: number }} data
   */
  async updateRun(runId, data) {
    return db.agentRun.update({
      where: { id: runId },
      data: {
        ...(data.toolCallLog !== undefined ? { toolCallLog: data.toolCallLog } : {}),
        ...(typeof data.durationMs === "number" ? { durationMs: data.durationMs } : {}),
        updatedAt: new Date(),
      },
    });
  },

  /**
   * Count agent runs for a user within a date range.
   * @param {string} userId
   * @param {Date} [since] - Count runs after this date
   */
  async countRunsSince(userId, since) {
    return db.agentRun.count({
      where: {
        userId,
        ...(since && { createdAt: { gte: since } }),
      },
    });
  },
};
