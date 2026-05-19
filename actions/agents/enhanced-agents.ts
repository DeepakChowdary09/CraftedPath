"use server";

/**
 * Enhanced Agent Actions with Human-in-the-Loop
 * Implements the Agentic Career Architect framework
 */

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { callAIWithAgent, runAgentWithTools } from "@/lib/ai/client";
import { AgentServiceEnhanced } from "@/lib/services/agent-service-enhanced";
import { getAgentConfig, AgentType } from "@/lib/agents/registry";
import { z } from "zod";

// ============================================================================
// TYPES
// ============================================================================

interface AgentResult {
  success: boolean;
  runId?: string;
  status: string;
  data?: any;
  error?: string;
  requiresReview?: boolean;
}

// ============================================================================
// AUTHORIZATION HELPER
// ============================================================================

async function authorize() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

// ============================================================================
// JOB MATCH AGENT
// ============================================================================

export async function runJobMatchAgent(formData: FormData): Promise<AgentResult> {
  const userId = await authorize();
  const jobDescription = formData.get("jobDescription") as string;
  const resumeContent = formData.get("resumeContent") as string;

  if (!jobDescription || !resumeContent) {
    return { success: false, status: "FAILED", error: "Missing required fields" };
  }

  // Create run with PENDING status
  const run = await AgentServiceEnhanced.createRun({
    userId,
    agentType: "job-match",
    inputSummary: `Job: ${jobDescription.slice(0, 100)}...`,
    metadata: { resumeLength: resumeContent.length },
  });

  try {
    // Update to PROCESSING
    await AgentServiceEnhanced.startProcessing(run.id);

    // Build prompt
    const prompt = `
## JOB DESCRIPTION
${jobDescription}

## RESUME
${resumeContent}

Analyze this resume against the job description. Output valid JSON with:
- matchScore (0-100)
- breakdown: { skillsMatch, experienceMatch, educationMatch, roleFit } (all 0-100)
- skillGaps: array of { skill, importance (critical|high|medium|low), userHas (boolean), recommendation }
- strengths: array of strings
- quickWins: array of strings  
- recommendedActions: array of { action, priority (high|medium|low), estimatedImpact (string) }
- confidenceScore (0-1)
`;

    // Call AI with fallback
    const result = await callAIWithAgent("job-match", prompt, {
      json: true,
      maxRetries: 3,
    });

    // Parse and validate result
    const parsed = JSON.parse(result.text);
    
    // Complete the run
    await AgentServiceEnhanced.completeRun({
      runId: run.id,
      outputSummary: JSON.stringify(parsed).slice(0, 300),
      toolCallLog: [],
      durationMs: result.durationMs,
      metadata: {
        retries: result.retries,
      },
      requiresReview: false,
    });

    revalidatePath("/job-match");

    return {
      success: true,
      runId: run.id,
      status: "COMPLETED",
      data: parsed,
    };

  } catch (error: any) {
    await AgentServiceEnhanced.failRun(run.id, error.message);
    return {
      success: false,
      runId: run.id,
      status: "FAILED",
      error: error.message,
    };
  }
}

// ============================================================================
// ATS AGENT
// ============================================================================

export async function runATSAgent(formData: FormData): Promise<AgentResult> {
  const userId = await authorize();
  const resumeContent = formData.get("resumeContent") as string;
  const jobDescription = formData.get("jobDescription") as string || "";

  if (!resumeContent) {
    return { success: false, status: "FAILED", error: "Missing resume content" };
  }

  const run = await AgentServiceEnhanced.createRun({
    userId,
    agentType: "ats",
    inputSummary: `ATS check for resume (${resumeContent.length} chars)`,
  });

  try {
    await AgentServiceEnhanced.startProcessing(run.id);

    const prompt = `
## RESUME
${resumeContent}

${jobDescription ? `## JOB DESCRIPTION (for keyword matching)\n${jobDescription}\n\n` : ""}
Score this resume for ATS compatibility. Output valid JSON with:
- overallScore (0-100)
- sectionScores: { contactInfo, summary, experience, education, skills } (all 0-100)
- keywordAnalysis: array of { keyword, found (boolean), count, importance }
- issues: array of { severity (critical|warning|info), section, description, suggestion }
- optimizationTips: array of strings
`;

    const result = await callAIWithAgent("ats", prompt, {
      json: true,
      maxRetries: 3,
    });

    const parsed = JSON.parse(result.text);

    await AgentServiceEnhanced.completeRun({
      runId: run.id,
      outputSummary: JSON.stringify(parsed).slice(0, 300),
      durationMs: result.durationMs,
      metadata: {},
      requiresReview: false,
    });

    revalidatePath("/ats-review");

    return {
      success: true,
      runId: run.id,
      status: "COMPLETED",
      data: parsed,
    };

  } catch (error: any) {
    await AgentServiceEnhanced.failRun(run.id, error.message);
    return {
      success: false,
      runId: run.id,
      status: "FAILED",
      error: error.message,
    };
  }
}

// ============================================================================
// RESUME AGENT (with Human-in-the-Loop)
// ============================================================================

export async function runResumeOptimizer(formData: FormData): Promise<AgentResult> {
  const userId = await authorize();
  const currentResume = formData.get("currentResume") as string;
  const jobDescription = formData.get("jobDescription") as string;
  const atsFeedback = formData.get("atsFeedback") as string || "";
  const matchFeedback = formData.get("matchFeedback") as string || "";

  if (!currentResume) {
    return { success: false, status: "FAILED", error: "Missing resume content" };
  }

  // Create run - will stay in PENDING_REVIEW until approved
  const run = await AgentServiceEnhanced.createRun({
    userId,
    agentType: "resume",
    inputSummary: `Optimize resume for job: ${jobDescription?.slice(0, 50) || "general"}...`,
    metadata: { hasJobDescription: !!jobDescription },
  });

  try {
    await AgentServiceEnhanced.startProcessing(run.id);

    const prompt = `
## CURRENT RESUME
${currentResume}

${jobDescription ? `## TARGET JOB DESCRIPTION\n${jobDescription}\n\n` : ""}
${atsFeedback ? `## ATS FEEDBACK\n${atsFeedback}\n\n` : ""}
${matchFeedback ? `## JOB MATCH FEEDBACK\n${matchFeedback}\n\n` : ""}

Propose resume optimizations. Output valid JSON with:
- proposedChanges: array of { 
    section (summary|experience|skills|education), 
    originalText, 
    proposedText, 
    reason,
    confidence (0-1)
  }
- guardrailReport: { passed (boolean), issues: array of strings }
- requiresApproval (boolean)
- estimatedImpact (string)

Focus on improvements that address ATS feedback and job match gaps.
`;

    const result = await callAIWithAgent("resume", prompt, {
      json: true,
      maxRetries: 2,
    });

    const parsed = JSON.parse(result.text);

    // Resume agent always requires review
    await AgentServiceEnhanced.completeRun({
      runId: run.id,
      outputSummary: JSON.stringify(parsed.proposedChanges || []).slice(0, 300),
      durationMs: result.durationMs,
      metadata: {
        proposedChangeCount: parsed.proposedChanges?.length || 0,
        guardrailPassed: parsed.guardrailReport?.passed,
      },
      requiresReview: true,
    });

    revalidatePath("/resume-optimizer");
    revalidatePath("/dashboard");

    return {
      success: true,
      runId: run.id,
      status: "PENDING_REVIEW",
      data: parsed,
      requiresReview: true,
    };

  } catch (error: any) {
    await AgentServiceEnhanced.failRun(run.id, error.message);
    return {
      success: false,
      runId: run.id,
      status: "FAILED",
      error: error.message,
    };
  }
}

// ============================================================================
// MANAGER APPROVAL ACTIONS
// ============================================================================

export async function approveAgentRun(runId: string, notes?: string): Promise<AgentResult> {
  const userId = await authorize();

  // Verify ownership
  const run = await AgentServiceEnhanced.getRunById(runId, userId);
  if (!run) {
    return { success: false, status: "FAILED", error: "Run not found" };
  }

  try {
    await AgentServiceEnhanced.approveRun(runId, notes);
    
    revalidatePath("/resume-optimizer");
    revalidatePath("/dashboard");

    return {
      success: true,
      runId,
      status: "COMPLETED",
    };
  } catch (error: any) {
    return {
      success: false,
      runId,
      status: "FAILED",
      error: error.message,
    };
  }
}

export async function rejectAgentRun(runId: string, reason: string): Promise<AgentResult> {
  const userId = await authorize();

  const run = await AgentServiceEnhanced.getRunById(runId, userId);
  if (!run) {
    return { success: false, status: "FAILED", error: "Run not found" };
  }

  try {
    await AgentServiceEnhanced.rejectRun(runId, reason);
    
    revalidatePath("/resume-optimizer");
    revalidatePath("/dashboard");

    return {
      success: true,
      runId,
      status: "PENDING_REVIEW",
    };
  } catch (error: any) {
    return {
      success: false,
      runId,
      status: "FAILED",
      error: error.message,
    };
  }
}

// ============================================================================
// QUERY ACTIONS
// ============================================================================

export async function getAgentRuns(agentType?: AgentType, status?: string) {
  const userId = await authorize();
  const filters: { agentType?: string; status?: string; limit: number } = { limit: 50 };
  if (agentType) filters.agentType = agentType;
  if (status) filters.status = status;
  return AgentServiceEnhanced.getRunsByUser(userId, filters);
}

export async function getPendingReviews() {
  const userId = await authorize();
  return AgentServiceEnhanced.getPendingReviewRuns(userId);
}

export async function getAgentRun(runId: string) {
  const userId = await authorize();
  return AgentServiceEnhanced.getRunById(runId, userId);
}

export async function getAgentStats() {
  const userId = await authorize();
  return AgentServiceEnhanced.getRunStats(userId);
}
