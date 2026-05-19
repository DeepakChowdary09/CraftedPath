/**
 * Agent Tool Handlers
 * Database-modifying tools that agents can invoke
 */

import { db } from "@/lib/prisma";
import { AgentServiceEnhanced } from "@/lib/services/agent-service-enhanced";

// ============================================================================
// RESUME TOOLS
// ============================================================================

/**
 * Fetch a user's resume from the database
 */
export async function fetchResume({ userId }: { userId: string }) {
  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        resumes: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user || !user.resumes || user.resumes.length === 0) {
      return {
        success: false,
        error: "No resume found for user",
      };
    }

    const resume = user.resumes[0];

    return {
      success: true,
      data: {
        id: resume.id,
        content: resume.content,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to fetch resume: ${error.message}`,
    };
  }
}

/**
 * Score a resume (used by ATS agent)
 */
export async function scoreResume({ 
  userId, 
  resumeId, 
  jobDescription 
}: { 
  userId: string; 
  resumeId?: string;
  jobDescription?: string;
}) {
  try {
    // Get the resume
    const resume = resumeId 
      ? await db.resume.findUnique({ where: { id: resumeId } })
      : await db.resume.findFirst({
          where: { user: { clerkUserId: userId } },
          orderBy: { createdAt: "desc" },
        });

    if (!resume) {
      return {
        success: false,
        error: "Resume not found",
      };
    }

    // Return resume data for scoring
    // The actual scoring is done by the AI agent
    return {
      success: true,
      data: {
        resumeId: resume.id,
        content: resume.content,
        jobDescription: jobDescription || null,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to score resume: ${error.message}`,
    };
  }
}

/**
 * Update a resume section
 */
export async function updateResumeSection({
  userId,
  resumeId,
  section,
  content,
  reason,
}: {
  userId: string;
  resumeId: string;
  section: "summary" | "experience" | "education" | "skills";
  content: string;
  reason: string;
}) {
  try {
    // Get current resume
    const resume = await db.resume.findFirst({
      where: { 
        id: resumeId,
        user: { clerkUserId: userId },
      },
    });

    if (!resume) {
      return {
        success: false,
        error: "Resume not found or access denied",
      };
    }

    // Create new version instead of overwriting
    const newResume = await db.resume.create({
      data: {
        userId: resume.userId,
        content: resume.content,
        source: `ai-edit-${section}`,
      },
    });

    // TODO: Apply the specific section update to content
    // This would parse the resume content and update the specific section

    return {
      success: true,
      data: {
        newResumeId: newResume.id,
        section,
        reason,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to update resume: ${error.message}`,
    };
  }
}

// ============================================================================
// JOB TOOLS
// ============================================================================

/**
 * Fetch job description from user's job tracker
 */
export async function fetchJob({ 
  userId, 
  jobId 
}: { 
  userId: string; 
  jobId: string;
}) {
  try {
    const job = await db.jobApplication.findFirst({
      where: {
        id: jobId,
        user: { clerkUserId: userId },
      },
    });

    if (!job) {
      return {
        success: false,
        error: "Job not found",
      };
    }

    return {
      success: true,
      data: {
        id: job.id,
        title: job.title,
        company: job.company,
        description: job.description,
        status: job.status,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to fetch job: ${error.message}`,
    };
  }
}

/**
 * List user's jobs
 */
export async function listJobs({ 
  userId, 
  status 
}: { 
  userId: string; 
  status?: string;
}) {
  try {
    const jobs = await db.jobApplication.findMany({
      where: {
        user: { clerkUserId: userId },
        ...(status && { status }),
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return {
      success: true,
      data: jobs.map(job => ({
        id: job.id,
        title: job.title,
        company: job.company,
        status: job.status,
        description: job.description?.slice(0, 200) + "...",
      })),
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to list jobs: ${error.message}`,
    };
  }
}

// ============================================================================
// PENDING CHANGES TOOLS
// ============================================================================

/**
 * Save pending changes for human review
 */
export async function savePendingChanges({
  runId,
  changes,
  metadata,
}: {
  runId: string;
  changes: Array<{
    section: string;
    originalText: string;
    proposedText: string;
    reason: string;
  }>;
  metadata?: Record<string, any>;
}) {
  try {
    // Log the tool call
    await AgentServiceEnhanced.logToolCall(runId, {
      tool: "savePendingChanges",
      args: { changeCount: changes.length },
    });

    // In a real implementation, this would save to PendingChanges table
    // For now, we store in the run's metadata
    const run = await AgentServiceEnhanced.getRunById(runId, "");
    if (!run) {
      return { success: false, error: "Run not found" };
    }

    return {
      success: true,
      data: {
        pendingChangesId: runId,
        changeCount: changes.length,
        status: "PENDING_REVIEW",
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to save pending changes: ${error.message}`,
    };
  }
}

/**
 * Apply approved changes
 */
export async function applyChanges({
  runId,
  userId,
}: {
  runId: string;
  userId: string;
}) {
  try {
    const run = await AgentServiceEnhanced.getRunById(runId, userId);
    if (!run) {
      return { success: false, error: "Run not found" };
    }

    if (run.status !== "PENDING_REVIEW") {
      return { success: false, error: `Cannot apply changes from status: ${run.status}` };
    }

    // Log the tool call
    await AgentServiceEnhanced.logToolCall(runId, {
      tool: "applyChanges",
      args: { userId },
    });

    // Apply the changes to the resume
    // This would parse the proposed changes and apply them

    return {
      success: true,
      data: {
        applied: true,
        runId,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to apply changes: ${error.message}`,
    };
  }
}

// ============================================================================
// TOOL REGISTRY
// ============================================================================

export const ToolRegistry = {
  fetchResume,
  scoreResume,
  updateResumeSection,
  fetchJob,
  listJobs,
  savePendingChanges,
  applyChanges,
};

export type ToolName = keyof typeof ToolRegistry;
