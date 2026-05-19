/**
 * Shared Memory System for Unified AI Agents
 * Stores context that persists across agent interactions
 */

import { db as prisma } from "@/lib/prisma";

// ============================================================================
// MEMORY TYPES
// ============================================================================

export interface UserContext {
  userId: string;
  industry: string | null;
  skills: string[];
  experience: number | null;
  careerGoals: string[];
  weakSkills: string[];
  strongSkills: string[];
  previousATSScores: number[];
  interviewHistory: InterviewRecord[];
  resumeVersions: ResumeVersionRecord[];
  jobApplicationHistory: JobApplicationRecord[];
}

export interface InterviewRecord {
  id: string;
  role: string;
  date: Date;
  performance: number;
  weakAreas: string[];
  strongAreas: string[];
}

export interface ResumeVersionRecord {
  id: string;
  title: string;
  atsScore: number | null;
  createdAt: Date;
  isActive: boolean;
}

export interface JobApplicationRecord {
  id: string;
  companyName: string;
  position: string;
  status: string;
  appliedAt: Date;
  matchScore?: number;
}

export interface AgentMemory {
  userId: string;
  sessionId: string;
  context: UserContext;
  currentJobDescription: string | null;
  currentResumeContent: string | null;
  recentAnalyses: AnalysisRecord[];
  workflowState: WorkflowState | null;
}

export interface AnalysisRecord {
  id: string;
  type: "job-match" | "ats" | "resume" | "interview";
  timestamp: Date;
  summary: string;
  keyFindings: string[];
}

export interface WorkflowState {
  workflowId: string;
  status: "running" | "completed" | "failed" | "pending_approval";
  currentStep: string;
  results: Record<string, unknown>;
}

// ============================================================================
// IN-MEMORY CACHE (for active sessions)
// ============================================================================

const memoryCache = new Map<string, AgentMemory>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ============================================================================
// USER CONTEXT LOADER
// ============================================================================

export async function loadUserContext(userId: string): Promise<UserContext> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      resume: true,
      resumeVersions: { orderBy: { createdAt: "desc" }, take: 5 },
      jobApplications: { orderBy: { createdAt: "desc" }, take: 10 },
      assessments: { orderBy: { createdAt: "desc" }, take: 5 },
      agentRuns: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  // Extract weak/strong skills from assessments
  const weakSkills: string[] = [];
  const strongSkills: string[] = [];
  
  user.assessments.forEach(assessment => {
    const tips = assessment.improvementTip?.toLowerCase() || "";
    if (tips.includes("skill") || tips.includes("improve")) {
      // Parse improvement tips to extract weak areas
      const matches = tips.match(/(?:focus on|improve|learn)\s+(\w+)/gi);
      if (matches) {
        matches.forEach(match => {
          const skill = match.replace(/(?:focus on|improve|learn)\s+/i, "");
          if (skill) weakSkills.push(skill);
        });
      }
    }
  });

  // Get previous ATS scores from resume versions
  const previousATSScores = user.resumeVersions
    .map(rv => rv.atsScore)
    .filter((score): score is number => score !== null);

  return {
    userId: user.id,
    industry: user.industry,
    skills: user.skills || [],
    experience: user.experience,
    careerGoals: [], // Can be extended with a separate goals model
    weakSkills: [...new Set(weakSkills)],
    strongSkills: [...new Set(strongSkills)],
    previousATSScores,
    interviewHistory: [], // Can be populated from interview practice records
    resumeVersions: user.resumeVersions.map(rv => ({
      id: rv.id,
      title: rv.title,
      atsScore: rv.atsScore,
      createdAt: rv.createdAt,
      isActive: rv.isActive,
    })),
    jobApplicationHistory: user.jobApplications.map(ja => ({
      id: ja.id,
      companyName: ja.companyName,
      position: ja.position,
      status: ja.status,
      appliedAt: ja.appliedAt,
    })),
  };
}

// ============================================================================
// MEMORY MANAGEMENT
// ============================================================================

export function getOrCreateMemory(userId: string, sessionId?: string): AgentMemory {
  const key = `${userId}:${sessionId || "default"}`;
  
  if (memoryCache.has(key)) {
    return memoryCache.get(key)!;
  }

  const newMemory: AgentMemory = {
    userId,
    sessionId: sessionId || crypto.randomUUID(),
    context: null as unknown as UserContext, // Will be loaded async
    currentJobDescription: null,
    currentResumeContent: null,
    recentAnalyses: [],
    workflowState: null,
  };

  memoryCache.set(key, newMemory);
  return newMemory;
}

export async function initializeMemory(userId: string, sessionId?: string): Promise<AgentMemory> {
  const memory = getOrCreateMemory(userId, sessionId);
  memory.context = await loadUserContext(userId);
  return memory;
}

export function updateMemory(userId: string, updates: Partial<AgentMemory>, sessionId?: string): void {
  const key = `${userId}:${sessionId || "default"}`;
  const memory = memoryCache.get(key);
  
  if (memory) {
    Object.assign(memory, updates);
  }
}

export function clearMemory(userId: string, sessionId?: string): void {
  const key = `${userId}:${userId}:${sessionId || "default"}`;
  memoryCache.delete(key);
}

export function addAnalysisToMemory(
  userId: string, 
  analysis: Omit<AnalysisRecord, "id" | "timestamp">,
  sessionId?: string
): void {
  const memory = getOrCreateMemory(userId, sessionId);
  
  const record: AnalysisRecord = {
    ...analysis,
    id: crypto.randomUUID(),
    timestamp: new Date(),
  };

  memory.recentAnalyses.unshift(record);
  
  // Keep only last 20 analyses
  if (memory.recentAnalyses.length > 20) {
    memory.recentAnalyses = memory.recentAnalyses.slice(0, 20);
  }
}

export function getMemory(userId: string, sessionId?: string): AgentMemory | undefined {
  const key = `${userId}:${sessionId || "default"}`;
  return memoryCache.get(key);
}

// ============================================================================
// WORKFLOW STATE MANAGEMENT
// ============================================================================

export function setWorkflowState(
  userId: string, 
  state: WorkflowState,
  sessionId?: string
): void {
  const memory = getOrCreateMemory(userId, sessionId);
  memory.workflowState = state;
}

export function getWorkflowState(userId: string, sessionId?: string): WorkflowState | null {
  const memory = getOrCreateMemory(userId, sessionId);
  return memory.workflowState;
}

export function clearWorkflowState(userId: string, sessionId?: string): void {
  const memory = getOrCreateMemory(userId, sessionId);
  memory.workflowState = null;
}

// ============================================================================
// PERSISTENT MEMORY (DATABASE)
// ============================================================================

export async function saveKeyInsight(
  userId: string,
  type: string,
  insight: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  // This could be extended to save to a dedicated insights table
  console.log(`[Memory] Saving insight for ${userId}: ${type} - ${insight.slice(0, 100)}...`);
}

export async function getRecentInsights(
  userId: string,
  type?: string,
  limit: number = 10
): Promise<Array<{ type: string; insight: string; timestamp: Date }>> {
  // Placeholder - can be implemented with a dedicated table
  return [];
}
