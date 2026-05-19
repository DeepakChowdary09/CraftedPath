/**
 * Unified Agent System - Structured Output Schemas
 * All agent outputs are validated with Zod for type safety
 */

import { z } from "zod";

// ============================================================================
// JOB MATCH AGENT SCHEMAS
// ============================================================================

export const SkillGapSchema = z.object({
  skill: z.string(),
  importance: z.preprocess(
    (val) => typeof val === "string" ? val.toLowerCase().trim() : val,
    z.enum(["critical", "high", "medium", "low"])
  ),
  userHas: z.boolean(),
  recommendation: z.string(),
});

export const JobMatchResultSchema = z.object({
  matchScore: z.number().min(0).max(100),
  breakdown: z.object({
    skillsMatch: z.number().min(0).max(100),
    experienceMatch: z.number().min(0).max(100),
    educationMatch: z.number().min(0).max(100),
    roleFit: z.number().min(0).max(100),
  }),
  skillGaps: z.array(SkillGapSchema),
  strengths: z.array(z.string()),
  quickWins: z.array(z.string()),
  recommendedActions: z.array(z.object({
    action: z.string(),
    priority: z.preprocess(
      (val) => typeof val === "string" ? val.toLowerCase().trim() : val,
      z.enum(["high", "medium", "low"])
    ),
    estimatedImpact: z.preprocess(
      (val) => typeof val === "number" ? String(val) : val,
      z.string()
    ),
  })),
  confidenceScore: z.number().min(0).max(1),
});

// ============================================================================
// ATS AGENT SCHEMAS
// ============================================================================

export const KeywordMatchSchema = z.object({
  keyword: z.string(),
  found: z.boolean(),
  occurrences: z.number(),
  context: z.string().optional(),
  suggestion: z.string().optional(),
});

export const ATSScoreResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  sectionScores: z.object({
    contactInfo: z.number().min(0).max(100),
    summary: z.number().min(0).max(100),
    experience: z.number().min(0).max(100),
    skills: z.number().min(0).max(100),
    education: z.number().min(0).max(100),
    formatting: z.number().min(0).max(100),
  }),
  keywordAnalysis: z.object({
    totalKeywords: z.number(),
    matchedKeywords: z.number(),
    missingKeywords: z.array(z.string()),
    keywordMatches: z.array(KeywordMatchSchema),
  }),
  issues: z.array(z.object({
    severity: z.enum(["critical", "warning", "info"]),
    section: z.string(),
    message: z.string(),
    suggestion: z.string(),
  })),
  optimizationTips: z.array(z.object({
    priority: z.enum(["high", "medium", "low"]),
    section: z.string(),
    current: z.string(),
    suggested: z.string(),
    reason: z.string(),
  })),
  recruiterReadiness: z.enum(["ready", "needs_work", "major_revisions"]),
});

// ============================================================================
// RESUME AGENT SCHEMAS
// ============================================================================

export const ResumeChangeSchema = z.object({
  id: z.string(),
  section: z.enum(["summary", "experience", "skills", "education", "projects", "contact"]),
  subsection: z.string().optional(),
  changeType: z.enum(["add", "edit", "remove", "reorder"]),
  currentContent: z.string().nullable(),
  proposedContent: z.string(),
  reason: z.string(),
  confidence: z.number().min(0).max(1),
});

export const ResumeOptimizationResultSchema = z.object({
  changes: z.array(ResumeChangeSchema),
  summary: z.string(),
  estimatedImprovement: z.object({
    atsScore: z.number(),
    matchScore: z.number(),
  }),
  requiresApproval: z.boolean(),
  confidenceScore: z.number().min(0).max(1),
});

// ============================================================================
// WORKFLOW SCHEMAS
// ============================================================================

export const WorkflowStepSchema = z.object({
  id: z.string(),
  agentType: z.enum(["job-match", "ats", "resume", "interview", "coach"]),
  status: z.enum(["pending", "running", "completed", "failed", "skipped"]),
  input: z.record(z.string(), z.any()),
  output: z.record(z.string(), z.any()).optional(),
  error: z.string().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  logs: z.array(z.object({
    timestamp: z.string(),
    level: z.enum(["info", "warn", "error"]),
    message: z.string(),
  })).optional(),
});

export const WorkflowResultSchema = z.object({
  workflowId: z.string(),
  status: z.enum(["running", "completed", "failed", "pending_approval"]),
  steps: z.array(WorkflowStepSchema),
  currentStepIndex: z.number(),
  results: z.record(z.string(), z.any()),
  pendingApprovals: z.array(z.object({
    stepId: z.string(),
    type: z.string(),
    description: z.string(),
    proposedChanges: z.array(ResumeChangeSchema).optional(),
  })),
  startedAt: z.string(),
  completedAt: z.string().optional(),
  durationMs: z.number().optional(),
});

// ============================================================================
// AGENT EVENT SCHEMAS (for streaming)
// ============================================================================

export const AgentEventSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  agentType: z.string(),
  step: z.string(),
  status: z.enum(["started", "in_progress", "completed", "failed", "waiting_approval"]),
  message: z.string(),
  timestamp: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type SkillGap = z.infer<typeof SkillGapSchema>;
export type JobMatchResult = z.infer<typeof JobMatchResultSchema>;
export type KeywordMatch = z.infer<typeof KeywordMatchSchema>;
export type ATSScoreResult = z.infer<typeof ATSScoreResultSchema>;
export type ResumeChange = z.infer<typeof ResumeChangeSchema>;
export type ResumeOptimizationResult = z.infer<typeof ResumeOptimizationResultSchema>;
export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;
export type WorkflowResult = z.infer<typeof WorkflowResultSchema>;
export type AgentEvent = z.infer<typeof AgentEventSchema>;
