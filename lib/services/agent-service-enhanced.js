import { db } from "@/lib/prisma";

/**
 * Enhanced Agent Service with Status Management
 * Supports the Agentic Career Architect workflow with human-in-the-loop
 */

export const AgentServiceEnhanced = {
  /**
   * Create a new agent run with PENDING status
   */
  async createRun({ userId, agentType, inputSummary, metadata = {} }) {
    return db.agentRun.create({
      data: {
        userId,
        agentType,
        status: "PENDING",
        inputSummary,
        outputSummary: "",
        toolCallLog: [],
        metadata,
      },
    });
  },

  /**
   * Update run status to PROCESSING
   */
  async startProcessing(runId) {
    return db.agentRun.update({
      where: { id: runId },
      data: {
        status: "PROCESSING",
        updatedAt: new Date(),
      },
    });
  },

  /**
   * Update run with results and set to PENDING_REVIEW or COMPLETED
   */
  async completeRun({ runId, outputSummary, toolCallLog = [], durationMs, metadata = {}, requiresReview = false }) {
    return db.agentRun.update({
      where: { id: runId },
      data: {
        status: requiresReview ? "PENDING_REVIEW" : "COMPLETED",
        outputSummary,
        toolCallLog,
        durationMs,
        metadata: {
          ...metadata,
          completedAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      },
    });
  },

  /**
   * Mark run as FAILED
   */
  async failRun(runId, errorMessage) {
    return db.agentRun.update({
      where: { id: runId },
      data: {
        status: "FAILED",
        outputSummary: `Error: ${errorMessage}`,
        updatedAt: new Date(),
      },
    });
  },

  /**
   * Manager approval: Transition from PENDING_REVIEW to COMPLETED
   */
  async approveRun(runId, approverNotes = "") {
    const run = await db.agentRun.findUnique({ where: { id: runId } });
    if (!run) throw new Error("Run not found");
    if (run.status !== "PENDING_REVIEW") {
      throw new Error(`Cannot approve run with status: ${run.status}`);
    }

    return db.agentRun.update({
      where: { id: runId },
      data: {
        status: "COMPLETED",
        metadata: {
          ...run.metadata,
          approvedAt: new Date().toISOString(),
          approverNotes,
        },
        updatedAt: new Date(),
      },
    });
  },

  /**
   * Manager rejection: Keep as PENDING_REVIEW but mark as rejected
   */
  async rejectRun(runId, rejectionReason) {
    const run = await db.agentRun.findUnique({ where: { id: runId } });
    if (!run) throw new Error("Run not found");

    return db.agentRun.update({
      where: { id: runId },
      data: {
        status: "PENDING_REVIEW", // Stay in review state
        metadata: {
          ...run.metadata,
          rejectedAt: new Date().toISOString(),
          rejectionReason,
        },
        updatedAt: new Date(),
      },
    });
  },

  /**
   * Get all runs for a user with optional filters
   */
  async getRunsByUser(userId, { agentType, status, limit = 20 } = {}) {
    return db.agentRun.findMany({
      where: {
        userId,
        ...(agentType && { agentType }),
        ...(status && { status }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  /**
   * Get runs pending manager review
   */
  async getPendingReviewRuns(userId, limit = 20) {
    return db.agentRun.findMany({
      where: {
        userId,
        status: "PENDING_REVIEW",
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  /**
   * Get a single run by ID with ownership check
   */
  async getRunById(runId, userId) {
    return db.agentRun.findFirst({
      where: { id: runId, userId },
    });
  },

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
   * Add a tool call to the log
   */
  async logToolCall(runId, toolCall) {
    const run = await db.agentRun.findUnique({ where: { id: runId } });
    if (!run) throw new Error("Run not found");

    const toolLog = run.toolCallLog || [];
    toolLog.push({
      ...toolCall,
      timestamp: new Date().toISOString(),
    });

    return db.agentRun.update({
      where: { id: runId },
      data: {
        toolCallLog: toolLog,
        updatedAt: new Date(),
      },
    });
  },

  /**
   * Get run statistics for dashboard
   */
  async getRunStats(userId) {
    const stats = await db.agentRun.groupBy({
      by: ["status"],
      where: { userId },
      _count: { status: true },
    });

    return stats.reduce((acc, { status, _count }) => {
      acc[status] = _count.status;
      return acc;
    }, {});
  },
};

// Backward compatibility
export const AgentService = AgentServiceEnhanced;
