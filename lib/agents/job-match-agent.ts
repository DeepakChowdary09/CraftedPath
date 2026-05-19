/**
 * Job Match Agent
 * Analyzes resume against job description to calculate match score and identify gaps
 */

import { callAIWithAgent } from "@/lib/ai/client";
import { 
  JobMatchResultSchema, 
  type JobMatchResult,
  type SkillGap 
} from "@/lib/schemas/agent-schemas";
import { buildJobMatchPrompt } from "@/lib/prompts/job-match/analyze";
import { initializeMemory, addAnalysisToMemory } from "@/lib/memory/shared-memory";
import { agentLogger, emitAgentEvent } from "@/lib/observability/logger";
import { db as prisma } from "@/lib/prisma";

export interface JobMatchInput {
  userId: string;
  jobDescription: string;
  resumeContent: string;
  workflowId?: string;
  sessionId?: string;
}

export interface JobMatchOutput {
  success: boolean;
  result?: JobMatchResult;
  error?: string;
  durationMs: number;
}

/**
 * Run the Job Match Agent analysis
 */
export async function runJobMatchAgent(input: JobMatchInput): Promise<JobMatchOutput> {
  const startTime = Date.now();
  const { userId, jobDescription, resumeContent, workflowId, sessionId } = input;

  // Initialize observability
  const metrics = agentLogger.startMetrics("job-match", userId, workflowId);
  
  try {
    // Emit event for streaming
    emitAgentEvent({
      workflowId: workflowId || "standalone",
      agentType: "job-match",
      step: "initialization",
      status: "started",
      message: "Initializing Job Match Agent...",
    });

    agentLogger.info("job-match", userId, "Starting job match analysis", { 
      jdLength: jobDescription.length,
      resumeLength: resumeContent.length,
    }, workflowId);

    // Load user context into memory
    const memory = await initializeMemory(userId, sessionId);
    
    emitAgentEvent({
      workflowId: workflowId || "standalone",
      agentType: "job-match",
      step: "parsing",
      status: "in_progress",
      message: "Parsing job description and resume...",
    });

    // Build the prompt
    const prompt = buildJobMatchPrompt(jobDescription, resumeContent, {
      industry: memory.context.industry,
      skills: memory.context.skills,
      experience: memory.context.experience,
    });

    emitAgentEvent({
      workflowId: workflowId || "standalone",
      agentType: "job-match",
      step: "analysis",
      status: "in_progress",
      message: "Analyzing skill gaps and match score...",
    });

    agentLogger.info("job-match", userId, "Calling AI for analysis", undefined, workflowId);

    // Call AI with structured output
    const rawResult = await callAIWithAgent("job-match", prompt, {
      json: true,
    });

    // Validate with Zod schema
    const parsedResult = JobMatchResultSchema.parse(JSON.parse(rawResult.text));

    // Store in memory
    addAnalysisToMemory(userId, {
      type: "job-match",
      summary: `Match score: ${parsedResult.matchScore}/100. ${parsedResult.skillGaps.filter(g => !g.userHas).length} skill gaps identified.`,
      keyFindings: [
        `Skills match: ${parsedResult.breakdown.skillsMatch}%`,
        `Experience match: ${parsedResult.breakdown.experienceMatch}%`,
        ...parsedResult.strengths.slice(0, 3),
      ],
    }, sessionId);

    emitAgentEvent({
      workflowId: workflowId || "standalone",
      agentType: "job-match",
      step: "complete",
      status: "completed",
      message: `Analysis complete. Match score: ${parsedResult.matchScore}/100`,
      metadata: { matchScore: parsedResult.matchScore },
    });

    // Complete metrics
    const durationMs = Date.now() - startTime;
    agentLogger.completeMetrics(metrics, true);
    agentLogger.setProvider(metrics, "Gemini");

    agentLogger.info("job-match", userId, `Analysis complete. Score: ${parsedResult.matchScore}`, {
      matchScore: parsedResult.matchScore,
      skillGaps: parsedResult.skillGaps.length,
    }, workflowId);

    return {
      success: true,
      result: parsedResult,
      durationMs,
    };

  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    agentLogger.error("job-match", userId, "Job match analysis failed", error as Error, workflowId);
    agentLogger.completeMetrics(metrics, false, errorMessage);

    emitAgentEvent({
      workflowId: workflowId || "standalone",
      agentType: "job-match",
      step: "error",
      status: "failed",
      message: `Analysis failed: ${errorMessage}`,
    });

    return {
      success: false,
      error: errorMessage,
      durationMs,
    };
  }
}

/**
 * Get skill gaps formatted for display
 */
export function formatSkillGaps(skillGaps: SkillGap[]): {
  critical: SkillGap[];
  high: SkillGap[];
  medium: SkillGap[];
  low: SkillGap[];
  missing: SkillGap[];
} {
  return {
    critical: skillGaps.filter(g => g.importance === "critical"),
    high: skillGaps.filter(g => g.importance === "high"),
    medium: skillGaps.filter(g => g.importance === "medium"),
    low: skillGaps.filter(g => g.importance === "low"),
    missing: skillGaps.filter(g => !g.userHas),
  };
}

/**
 * Calculate priority score for actions
 */
export function prioritizeActions(result: JobMatchResult): JobMatchResult["recommendedActions"] {
  return result.recommendedActions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

/**
 * Generate a summary text from the match result
 */
export function generateMatchSummary(result: JobMatchResult): string {
  const gaps = formatSkillGaps(result.skillGaps);
  
  let summary = `## Match Score: ${result.matchScore}/100\n\n`;
  
  summary += `### Breakdown\n`;
  summary += `- Skills Match: ${result.breakdown.skillsMatch}%\n`;
  summary += `- Experience Match: ${result.breakdown.experienceMatch}%\n`;
  summary += `- Education Match: ${result.breakdown.educationMatch}%\n`;
  summary += `- Role Fit: ${result.breakdown.roleFit}%\n\n`;
  
  if (gaps.missing.length > 0) {
    summary += `### Skill Gaps (${gaps.missing.length} missing)\n`;
    if (gaps.critical.length > 0) {
      summary += `**Critical:** ${gaps.critical.filter(g => !g.userHas).map(g => g.skill).join(", ")}\n`;
    }
    if (gaps.high.length > 0) {
      summary += `**High Priority:** ${gaps.high.filter(g => !g.userHas).map(g => g.skill).join(", ")}\n`;
    }
    summary += "\n";
  }
  
  if (result.quickWins.length > 0) {
    summary += `### Quick Wins\n`;
    result.quickWins.forEach(win => {
      summary += `- ${win}\n`;
    });
    summary += "\n";
  }
  
  if (result.recommendedActions.length > 0) {
    summary += `### Recommended Actions\n`;
    prioritizeActions(result).slice(0, 5).forEach(action => {
      const emoji = action.priority === "high" ? "🔴" : action.priority === "medium" ? "🟡" : "🟢";
      summary += `${emoji} **${action.action}**\n   Impact: ${action.estimatedImpact}\n\n`;
    });
  }
  
  return summary;
}
