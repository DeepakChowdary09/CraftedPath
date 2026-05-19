/**
 * Job Application Workflow
 * Orchestrates Job Match → ATS → Resume agents in a pipeline
 */

import { runJobMatchAgent } from "@/lib/agents/job-match-agent";
import { runATSAgent } from "@/lib/agents/ats-agent";
import { runResumeAgent } from "@/lib/agents/resume-agent";
import type { 
  WorkflowResult, 
  WorkflowStep,
  JobMatchResult,
  ATSScoreResult,
  ResumeOptimizationResult,
} from "@/lib/schemas/agent-schemas";
import { agentLogger, emitAgentEvent } from "@/lib/observability/logger";
import { setWorkflowState, clearWorkflowState } from "@/lib/memory/shared-memory";
import { WorkflowEventEmitter } from "./event-emitter";

// ============================================================================
// WORKFLOW INPUT
// ============================================================================

export interface JobApplicationWorkflowInput {
  userId: string;
  jobDescription: string;
  resumeContent: string;
  options?: {
    skipResumeOptimization?: boolean; // Skip if user just wants analysis
    autoApplyChanges?: boolean; // Auto-apply if score is high enough
    minMatchScore?: number; // Minimum match score to proceed with optimization
    minATSScore?: number; // Minimum ATS score before optimization
  };
}

// ============================================================================
// WORKFLOW RUNNER
// ============================================================================

export async function runJobApplicationWorkflow(
  input: JobApplicationWorkflowInput,
  eventEmitter?: WorkflowEventEmitter
): Promise<WorkflowResult> {
  const { userId, jobDescription, resumeContent, options = {} } = input;
  const workflowId = crypto.randomUUID();
  const startTime = Date.now();

  const {
    skipResumeOptimization = false,
    autoApplyChanges = false,
    minMatchScore = 50,
    minATSScore = 60,
  } = options;

  // Initialize workflow state
  const steps: WorkflowStep[] = [
    {
      id: "step-1",
      agentType: "job-match",
      status: "pending",
      input: { jobDescription, resumeContent },
    },
    {
      id: "step-2",
      agentType: "ats",
      status: "pending",
      input: {},
    },
    {
      id: "step-3",
      agentType: "resume",
      status: skipResumeOptimization ? "skipped" : "pending",
      input: {},
    },
  ];

  const result: WorkflowResult = {
    workflowId,
    status: "running",
    steps,
    currentStepIndex: 0,
    results: {},
    pendingApprovals: [],
    startedAt: new Date().toISOString(),
  };

  setWorkflowState(userId, {
    workflowId,
    status: "running",
    currentStep: "step-1",
    results: {},
  });

  emitAgentEvent({
    workflowId,
    agentType: "workflow",
    step: "start",
    status: "started",
    message: "Starting Job Application Workflow...",
  });

  agentLogger.info("workflow", userId, "Job Application Workflow started", {
    workflowId,
    skipResumeOptimization,
    autoApplyChanges,
  });

  eventEmitter?.emit({
    type: "workflow-start",
    workflowId,
    message: "Job Application Workflow started",
  });

  try {
    // ========================================================================
    // STEP 1: Job Match Analysis
    // ========================================================================
    
    updateStepStatus(steps, "step-1", "running");
    result.currentStepIndex = 0;

    emitAgentEvent({
      workflowId,
      agentType: "job-match",
      step: "step-1",
      status: "started",
      message: "Running Job Match Analysis...",
    });

    eventEmitter?.emit({
      type: "step-start",
      stepId: "step-1",
      agentType: "job-match",
      message: "Analyzing job match...",
    });

    const jobMatchResult = await runJobMatchAgent({
      userId,
      jobDescription,
      resumeContent,
      workflowId,
    });

    if (!jobMatchResult.success) {
      throw new Error(`Job Match Agent failed: ${jobMatchResult.error}`);
    }

    result.results.jobMatch = jobMatchResult.result;
    updateStepStatus(steps, "step-1", "completed", jobMatchResult.result);

    emitAgentEvent({
      workflowId,
      agentType: "job-match",
      step: "step-1",
      status: "completed",
      message: `Match Score: ${jobMatchResult.result!.matchScore}/100`,
      metadata: { matchScore: jobMatchResult.result!.matchScore },
    });

    eventEmitter?.emit({
      type: "step-complete",
      stepId: "step-1",
      agentType: "job-match",
      message: `Match Score: ${jobMatchResult.result!.matchScore}/100`,
    });

    // Check if we should continue based on match score
    if (jobMatchResult.result!.matchScore < minMatchScore) {
      result.status = "completed";
      result.results.recommendation = "Match score too low. Consider a different role or significant skill development.";
      
      emitAgentEvent({
        workflowId,
        agentType: "workflow",
        step: "complete",
        status: "completed",
        message: `Workflow complete. Match score (${jobMatchResult.result!.matchScore}) below threshold (${minMatchScore}).`,
      });

      return finalizeResult(result, startTime);
    }

    // ========================================================================
    // STEP 2: ATS Analysis
    // ========================================================================
    
    updateStepStatus(steps, "step-2", "running");
    result.currentStepIndex = 1;

    emitAgentEvent({
      workflowId,
      agentType: "ats",
      step: "step-2",
      status: "started",
      message: "Running ATS Analysis...",
    });

    eventEmitter?.emit({
      type: "step-start",
      stepId: "step-2",
      agentType: "ats",
      message: "Analyzing ATS compatibility...",
    });

    const atsResult = await runATSAgent({
      userId,
      resumeContent,
      jobDescription,
      workflowId,
    });

    if (!atsResult.success) {
      throw new Error(`ATS Agent failed: ${atsResult.error}`);
    }

    result.results.ats = atsResult.result;
    updateStepStatus(steps, "step-2", "completed", atsResult.result);

    emitAgentEvent({
      workflowId,
      agentType: "ats",
      step: "step-2",
      status: "completed",
      message: `ATS Score: ${atsResult.result!.overallScore}/100`,
      metadata: { atsScore: atsResult.result!.overallScore },
    });

    eventEmitter?.emit({
      type: "step-complete",
      stepId: "step-2",
      agentType: "ats",
      message: `ATS Score: ${atsResult.result!.overallScore}/100`,
    });

    // ========================================================================
    // STEP 3: Resume Optimization (optional)
    // ========================================================================
    
    if (!skipResumeOptimization) {
      updateStepStatus(steps, "step-3", "running");
      result.currentStepIndex = 2;

      const shouldOptimize = atsResult.result!.overallScore < minATSScore || 
                            jobMatchResult.result!.matchScore < 70;

      if (shouldOptimize) {
        emitAgentEvent({
          workflowId,
          agentType: "resume",
          step: "step-3",
          status: "started",
          message: "Running Resume Optimization...",
        });

        eventEmitter?.emit({
          type: "step-start",
          stepId: "step-3",
          agentType: "resume",
          message: "Optimizing resume...",
        });

        const resumeResult = await runResumeAgent({
          userId,
          currentResume: resumeContent,
          jobDescription,
          atsFeedback: {
            score: atsResult.result!.overallScore,
            missingKeywords: atsResult.result!.keywordAnalysis.missingKeywords,
            issues: atsResult.result!.issues.map(i => i.message),
          },
          jobMatchFeedback: {
            skillGaps: jobMatchResult.result!.skillGaps,
            matchScore: jobMatchResult.result!.matchScore,
          },
          workflowId,
          autoApply: autoApplyChanges && atsResult.result!.overallScore >= minATSScore,
        });

        if (!resumeResult.success) {
          throw new Error(`Resume Agent failed: ${resumeResult.error}`);
        }

        result.results.resume = resumeResult.result;
        
        // Check if changes are pending approval
        if (resumeResult.pendingChangesId) {
          result.status = "pending_approval";
          result.pendingApprovals.push({
            stepId: "step-3",
            type: "resume-changes",
            description: `Resume optimization with ${resumeResult.result!.changes.length} proposed changes`,
            proposedChanges: resumeResult.result!.changes,
          });

          updateStepStatus(steps, "step-3", "completed", { 
            ...resumeResult.result,
            pendingApproval: true,
            pendingChangesId: resumeResult.pendingChangesId,
          });

          emitAgentEvent({
            workflowId,
            agentType: "resume",
            step: "step-3",
            status: "waiting_approval",
            message: `Resume optimized. ${resumeResult.result!.changes.length} changes pending approval.`,
            metadata: { pendingChangesId: resumeResult.pendingChangesId },
          });

          eventEmitter?.emit({
            type: "approval-needed",
            stepId: "step-3",
            message: `${resumeResult.result!.changes.length} resume changes need your approval`,
            metadata: { pendingChangesId: resumeResult.pendingChangesId },
          });
        } else if (resumeResult.appliedChanges) {
          updateStepStatus(steps, "step-3", "completed", {
            ...resumeResult.result,
            appliedChanges: resumeResult.appliedChanges.length,
          });

          emitAgentEvent({
            workflowId,
            agentType: "resume",
            step: "step-3",
            status: "completed",
            message: `Resume optimized. ${resumeResult.appliedChanges.length} changes applied.`,
          });

          eventEmitter?.emit({
            type: "step-complete",
            stepId: "step-3",
            agentType: "resume",
            message: `${resumeResult.appliedChanges.length} changes applied to resume`,
          });
        }
      } else {
        updateStepStatus(steps, "step-3", "skipped", { reason: "Scores above thresholds" });
        
        emitAgentEvent({
          workflowId,
          agentType: "resume",
          step: "step-3",
          status: "completed",
          message: "Resume optimization skipped - scores above thresholds",
        });

        eventEmitter?.emit({
          type: "step-skip",
          stepId: "step-3",
          message: "Resume already optimized",
        });
      }
    }

    // Workflow complete
    result.status = result.status === "pending_approval" ? "pending_approval" : "completed";
    
    emitAgentEvent({
      workflowId,
      agentType: "workflow",
      step: "complete",
      status: result.status === "completed" ? "completed" : "waiting_approval",
      message: "Job Application Workflow complete",
    });

    eventEmitter?.emit({
      type: "workflow-complete",
      workflowId,
      message: "Workflow complete",
    });

    return finalizeResult(result, startTime);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Mark current step as failed
    const currentStep = steps[result.currentStepIndex];
    if (currentStep) {
      updateStepStatus(steps, currentStep.id, "failed", undefined, errorMessage);
    }

    result.status = "failed";
    
    emitAgentEvent({
      workflowId,
      agentType: "workflow",
      step: "error",
      status: "failed",
      message: `Workflow failed: ${errorMessage}`,
    });

    eventEmitter?.emit({
      type: "workflow-error",
      workflowId,
      message: errorMessage,
    });

    agentLogger.error("workflow", userId, "Job Application Workflow failed", error as Error, workflowId);

    return finalizeResult(result, startTime);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function updateStepStatus(
  steps: WorkflowStep[],
  stepId: string,
  status: WorkflowStep["status"],
  output?: unknown,
  error?: string
): void {
  const step = steps.find(s => s.id === stepId);
  if (!step) return;

  step.status = status;
  
  if (status === "running") {
    step.startedAt = new Date().toISOString();
  }
  
  if (status === "completed" || status === "failed" || status === "skipped") {
    step.completedAt = new Date().toISOString();
    if (output) step.output = output as Record<string, unknown>;
    if (error) step.error = error;
  }
}

function finalizeResult(result: WorkflowResult, startTime: number): WorkflowResult {
  result.completedAt = new Date().toISOString();
  result.durationMs = Date.now() - startTime;
  
  // Clear workflow state from memory
  // clearWorkflowState is called from the agent that initiated
  
  return result;
}

// ============================================================================
// WORKFLOW STATUS CHECK
// ============================================================================

export function getWorkflowStatus(workflowId: string): WorkflowResult | null {
  // In production, this would query the database
  // For now, we return null as workflows are in-memory
  return null;
}
