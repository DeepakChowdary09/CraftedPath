/**
 * Resume Agent
 * Proposes and applies resume optimizations with human approval
 */

import { callAIWithAgent } from "@/lib/ai/client";
import { 
  ResumeOptimizationResultSchema, 
  type ResumeOptimizationResult,
  type ResumeChange,
  type ATSScoreResult,
  type JobMatchResult,
} from "@/lib/schemas/agent-schemas";
import { buildResumeOptimizationPrompt } from "@/lib/prompts/resume/optimize";
import { initializeMemory, getMemory, addAnalysisToMemory } from "@/lib/memory/shared-memory";
import { agentLogger, emitAgentEvent } from "@/lib/observability/logger";
import { runResumeGuardrails, filterApprovedChanges, formatGuardrailReport } from "@/lib/guardrails/resume-guardrails";
import { savePendingChanges, applyChangesToResume, type PendingChangeSet } from "@/lib/tools/resume-tools";

export interface ResumeAgentInput {
  userId: string;
  currentResume: string;
  jobDescription: string;
  atsFeedback?: {
    score: number;
    missingKeywords: string[];
    issues: string[];
  };
  jobMatchFeedback?: {
    skillGaps: Array<{ skill: string; importance?: string; userHas?: boolean; recommendation?: string }>;
    matchScore: number;
  };
  workflowId?: string;
  sessionId?: string;
  autoApply?: boolean; // If true, applies changes without human approval (use with caution)
}

export interface ResumeAgentOutput {
  success: boolean;
  result?: ResumeOptimizationResult;
  pendingChangesId?: string;
  appliedChanges?: ResumeChange[];
  error?: string;
  guardrailReport?: string;
  durationMs: number;
}

/**
 * Run the Resume Agent to propose optimizations
 */
export async function runResumeAgent(input: ResumeAgentInput): Promise<ResumeAgentOutput> {
  const startTime = Date.now();
  const { 
    userId, 
    currentResume, 
    jobDescription, 
    atsFeedback, 
    jobMatchFeedback,
    workflowId,
    sessionId,
    autoApply = false,
  } = input;

  const metrics = agentLogger.startMetrics("resume", userId, workflowId);

  try {
    emitAgentEvent({
      workflowId: workflowId || "standalone",
      agentType: "resume",
      step: "initialization",
      status: "started",
      message: "Initializing Resume Agent...",
    });

    agentLogger.info("resume", userId, "Starting resume optimization", {
      hasATSFeedback: !!atsFeedback,
      hasJobMatchFeedback: !!jobMatchFeedback,
      autoApply,
    }, workflowId);

    // Load memory
    let memory = getMemory(userId, sessionId);
    if (!memory) {
      memory = await initializeMemory(userId, sessionId);
    }

    emitAgentEvent({
      workflowId: workflowId || "standalone",
      agentType: "resume",
      step: "analysis",
      status: "in_progress",
      message: "Analyzing resume against job requirements...",
    });

    const prompt = buildResumeOptimizationPrompt(
      currentResume,
      jobDescription,
      atsFeedback,
      jobMatchFeedback,
    );

    emitAgentEvent({
      workflowId: workflowId || "standalone",
      agentType: "resume",
      step: "generating",
      status: "in_progress",
      message: "Generating optimized resume content...",
    });

    agentLogger.info("resume", userId, "Calling AI for resume optimization", undefined, workflowId);

    const rawResult = await callAIWithAgent("resume", prompt, {
      json: true,
    });

    let parsedResult = ResumeOptimizationResultSchema.parse(JSON.parse(rawResult.text));

    emitAgentEvent({
      workflowId: workflowId || "standalone",
      agentType: "resume",
      step: "guardrails",
      status: "in_progress",
      message: `Running guardrail checks on ${parsedResult.changes.length} proposed changes...`,
    });

    // Run guardrails
    const guardrailResult = runResumeGuardrails(parsedResult.changes);
    const guardrailReport = formatGuardrailReport(guardrailResult);
    
    agentLogger.info("resume", userId, `Guardrail check complete. Approved: ${guardrailResult.approved}`, {
      totalChanges: parsedResult.changes.length,
      rejected: guardrailResult.rejected.length,
      warnings: guardrailResult.warnings.length,
    }, workflowId);

    // Filter approved changes
    const approvedChanges = filterApprovedChanges(parsedResult.changes, guardrailResult);
    
    // Update result with filtered changes
    parsedResult = {
      ...parsedResult,
      changes: approvedChanges,
    };

    // Store in memory
    addAnalysisToMemory(userId, {
      type: "resume",
      summary: `Resume optimization: ${approvedChanges.length} changes proposed.`,
      keyFindings: approvedChanges.map(c => `${c.section}: ${c.changeType} - ${c.reason.slice(0, 50)}...`),
    }, sessionId);

    let pendingChangesId: string | undefined;
    let appliedChanges: ResumeChange[] | undefined;

    // Handle changes based on autoApply and requiresApproval
    if (approvedChanges.length > 0) {
      if (autoApply && !parsedResult.requiresApproval) {
        // Auto-apply if enabled and no approval required
        emitAgentEvent({
          workflowId: workflowId || "standalone",
          agentType: "resume",
          step: "applying",
          status: "in_progress",
          message: "Auto-applying approved changes...",
        });

        appliedChanges = await applyChangesToResume(userId, approvedChanges);
        
        agentLogger.info("resume", userId, `Auto-applied ${appliedChanges.length} changes`, undefined, workflowId);

        emitAgentEvent({
          workflowId: workflowId || "standalone",
          agentType: "resume",
          step: "complete",
          status: "completed",
          message: `Applied ${appliedChanges.length} changes to resume`,
        });
      } else {
        // Save for human approval
        pendingChangesId = await savePendingChanges(userId, approvedChanges, {
          source: "resume-agent",
          workflowId,
          atsScore: atsFeedback?.score,
          matchScore: jobMatchFeedback?.matchScore,
        });

        agentLogger.info("resume", userId, `Saved ${approvedChanges.length} changes for approval`, {
          pendingChangesId,
        }, workflowId);

        emitAgentEvent({
          workflowId: workflowId || "standalone",
          agentType: "resume",
          step: "pending_approval",
          status: "waiting_approval",
          message: `${approvedChanges.length} changes pending human approval`,
          metadata: { pendingChangesId },
        });
      }
    }

    const durationMs = Date.now() - startTime;
    agentLogger.completeMetrics(metrics, true);
    agentLogger.setProvider(metrics, "Gemini");

    return {
      success: true,
      result: parsedResult,
      pendingChangesId,
      appliedChanges,
      guardrailReport,
      durationMs,
    };

  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    agentLogger.error("resume", userId, "Resume optimization failed", error as Error, workflowId);
    agentLogger.completeMetrics(metrics, false, errorMessage);

    emitAgentEvent({
      workflowId: workflowId || "standalone",
      agentType: "resume",
      step: "error",
      status: "failed",
      message: `Resume optimization failed: ${errorMessage}`,
    });

    return {
      success: false,
      error: errorMessage,
      durationMs,
    };
  }
}

/**
 * Approve and apply pending resume changes
 */
export async function approveResumeChanges(
  userId: string,
  pendingChangesId: string,
  approvedChangeIds?: string[] // If undefined, approve all
): Promise<{ success: boolean; appliedChanges: ResumeChange[]; error?: string }> {
  try {
    emitAgentEvent({
      workflowId: "approval",
      agentType: "resume",
      step: "applying",
      status: "started",
      message: "Applying approved resume changes...",
    });

    const result = await applyChangesToResume(userId, [], pendingChangesId, approvedChangeIds);

    agentLogger.info("resume", userId, `User approved and applied changes`, {
      pendingChangesId,
      appliedCount: result.length,
    });

    emitAgentEvent({
      workflowId: "approval",
      agentType: "resume",
      step: "complete",
      status: "completed",
      message: `Applied ${result.length} approved changes`,
    });

    return { success: true, appliedChanges: result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    agentLogger.error("resume", userId, "Failed to apply approved changes", error as Error);

    return { success: false, appliedChanges: [], error: errorMessage };
  }
}

/**
 * Reject pending resume changes
 */
export async function rejectResumeChanges(
  userId: string,
  pendingChangesId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { discardPendingChanges } = await import("@/lib/tools/resume-tools");
    await discardPendingChanges(userId, pendingChangesId);

    agentLogger.info("resume", userId, `User rejected changes`, {
      pendingChangesId,
      reason,
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Format resume changes for display
 */
export function formatResumeChanges(result: ResumeOptimizationResult): string {
  let output = `## Resume Optimization\n\n`;
  output += `${result.summary}\n\n`;
  
  if (result.estimatedImprovement) {
    output += `### Estimated Improvements\n`;
    output += `- ATS Score: +${result.estimatedImprovement.atsScore} points\n`;
    output += `- Match Score: +${result.estimatedImprovement.matchScore} points\n\n`;
  }

  output += `### Proposed Changes (${result.changes.length})\n\n`;

  const changesBySection = groupChangesBySection(result.changes);
  
  for (const [section, changes] of Object.entries(changesBySection)) {
    output += `#### ${section.charAt(0).toUpperCase() + section.slice(1)}\n`;
    changes.forEach((change, idx) => {
      const emoji = change.changeType === "add" ? "➕" 
        : change.changeType === "edit" ? "✏️" 
        : change.changeType === "remove" ? "🗑️" 
        : "🔄";
      
      output += `${emoji} **Change ${idx + 1}** (confidence: ${Math.round(change.confidence * 100)}%)\n`;
      output += `- **Reason:** ${change.reason}\n`;
      
      if (change.currentContent) {
        output += `- **Current:** ${change.currentContent.slice(0, 150)}...\n`;
      }
      
      output += `- **Proposed:** ${change.proposedContent.slice(0, 150)}...\n\n`;
    });
  }

  if (result.requiresApproval) {
    output += `---\n**⚠️ These changes require human approval before being applied.**\n`;
  }

  return output;
}

function groupChangesBySection(changes: ResumeChange[]): Record<string, ResumeChange[]> {
  return changes.reduce((acc, change) => {
    if (!acc[change.section]) {
      acc[change.section] = [];
    }
    acc[change.section].push(change);
    return acc;
  }, {} as Record<string, ResumeChange[]>);
}
