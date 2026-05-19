"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { 
  runResumeAgent, 
  approveResumeChanges, 
  rejectResumeChanges,
  formatResumeChanges 
} from "@/lib/agents/resume-agent";
import { getPendingChanges, getUserPendingChanges } from "@/lib/tools/resume-tools";
import { db as prisma } from "@/lib/prisma";

/**
 * Server Action: Run resume optimization
 */
export async function optimizeResume(formData) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    const currentResume = formData.get("currentResume") || await getUserResume(dbUser.id);
    const jobDescription = formData.get("jobDescription");
    
    // Optional feedback from other agents
    const atsScore = formData.get("atsScore") ? parseInt(formData.get("atsScore")) : undefined;
    const atsMissingKeywords = formData.get("atsMissingKeywords")?.split(",") || [];
    const matchScore = formData.get("matchScore") ? parseInt(formData.get("matchScore")) : undefined;

    if (!currentResume) {
      return { success: false, error: "Resume content is required" };
    }

    const result = await runResumeAgent({
      userId: dbUser.id,
      currentResume,
      jobDescription: jobDescription || "",
      atsFeedback: atsScore ? {
        score: atsScore,
        missingKeywords: atsMissingKeywords,
        issues: [],
      } : undefined,
      jobMatchFeedback: matchScore ? {
        skillGaps: [],
        matchScore,
      } : undefined,
      autoApply: false, // Always require approval
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Format changes for display
    const changesSummary = formatResumeChanges(result.result);

    revalidatePath("/resume-optimizer");

    return {
      success: true,
      result: result.result,
      summary: result.result.summary,
      changesSummary,
      pendingChangesId: result.pendingChangesId,
      guardrailReport: result.guardrailReport,
      durationMs: result.durationMs,
    };
  } catch (error) {
    console.error("[ResumeOptimizerAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Server Action: Get pending changes for approval
 */
export async function getPendingResumeChanges() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    const pendingChanges = await getUserPendingChanges(dbUser.id);

    return {
      success: true,
      pendingChanges: pendingChanges.map(pc => ({
        id: pc.id,
        changes: pc.changes,
        changeCount: pc.changes.length,
        metadata: pc.metadata,
        createdAt: pc.metadata.createdAt,
      })),
    };
  } catch (error) {
    console.error("[GetPendingChangesAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Server Action: Approve and apply resume changes
 */
export async function approvePendingChanges(formData) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    const pendingChangesId = formData.get("pendingChangesId");
    const approvedChangeIds = formData.get("approvedChangeIds")?.split(",") || undefined;

    if (!pendingChangesId) {
      return { success: false, error: "Pending changes ID is required" };
    }

    const result = await approveResumeChanges(dbUser.id, pendingChangesId, approvedChangeIds);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    revalidatePath("/resume-optimizer");
    revalidatePath("/resume/versions");

    return {
      success: true,
      appliedChanges: result.appliedChanges,
      appliedCount: result.appliedChanges.length,
    };
  } catch (error) {
    console.error("[ApproveChangesAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Server Action: Reject resume changes
 */
export async function rejectPendingChanges(formData) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!dbUser) {
      return { success: false, error: "User not found" };
    }

    const pendingChangesId = formData.get("pendingChangesId");
    const reason = formData.get("reason");

    if (!pendingChangesId) {
      return { success: false, error: "Pending changes ID is required" };
    }

    const result = await rejectResumeChanges(dbUser.id, pendingChangesId, reason);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    revalidatePath("/resume-optimizer");

    return { success: true };
  } catch (error) {
    console.error("[RejectChangesAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Helper: Get user's resume
 */
async function getUserResume(userId) {
  const resume = await prisma.resume.findUnique({
    where: { userId },
  });
  return resume?.content || null;
}
