"use server";

import { withAuth } from "@/lib/middleware/auth";
import { AgentService } from "@/lib/services/agent-service";

/**
 * Get the current user's agent run history.
 * @param {{ agentType?: string, limit?: number }} [filters]
 */
export async function getAgentRuns(filters = {}) {
  return withAuth((user) => AgentService.getRunsByUser(user.id, filters));
}

/**
 * Get a single agent run by ID.
 * @param {string} runId
 */
export async function getAgentRun(runId) {
  return withAuth(async (user) => {
    const run = await AgentService.getRunById(runId, user.id);
    if (!run) throw new Error("Agent run not found");
    return run;
  });
}

/**
 * Count agent runs for the current user this week.
 */
export async function getAgentRunsThisWeek() {
  return withAuth(async (user) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return AgentService.countRunsSince(user.id, oneWeekAgo);
  });
}
