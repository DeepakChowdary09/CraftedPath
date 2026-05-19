"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { runJobMatchAgent, generateMatchSummary } from "@/lib/agents/job-match-agent";
import { db as prisma } from "@/lib/prisma";

/**
 * Server Action: Analyze job match
 */
export async function analyzeJobMatch(formData) {
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

    const jobDescription = formData.get("jobDescription");
    const resumeContent = formData.get("resumeContent") || await getUserResume(dbUser.id);

    if (!jobDescription) {
      return { success: false, error: "Job description is required" };
    }

    if (!resumeContent) {
      return { success: false, error: "Resume content is required" };
    }

    const result = await runJobMatchAgent({
      userId: dbUser.id,
      jobDescription,
      resumeContent,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Generate human-readable summary
    const summary = generateMatchSummary(result.result);

    revalidatePath("/job-match");

    return {
      success: true,
      result: result.result,
      summary,
      durationMs: result.durationMs,
    };
  } catch (error) {
    console.error("[JobMatchAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Server Action: Run full workflow
 */
export async function runJobApplicationWorkflowAction(formData) {
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

    const jobDescription = formData.get("jobDescription");
    const resumeContent = formData.get("resumeContent") || await getUserResume(dbUser.id);
    const options = {
      skipResumeOptimization: formData.get("skipOptimization") === "true",
      autoApplyChanges: formData.get("autoApply") === "true",
      minMatchScore: parseInt(formData.get("minMatchScore") || "50"),
      minATSScore: parseInt(formData.get("minATSScore") || "60"),
    };

    if (!jobDescription || !resumeContent) {
      return { success: false, error: "Job description and resume are required" };
    }

    // Import and run workflow
    const { runJobApplicationWorkflow } = await import("@/lib/workflows/job-application-workflow");
    
    const workflowResult = await runJobApplicationWorkflow({
      userId: dbUser.id,
      jobDescription,
      resumeContent,
      options,
    });

    revalidatePath("/job-match");
    revalidatePath("/ats-review");
    revalidatePath("/resume-optimizer");

    return {
      success: workflowResult.status !== "failed",
      workflowId: workflowResult.workflowId,
      status: workflowResult.status,
      results: workflowResult.results,
      pendingApprovals: workflowResult.pendingApprovals,
      steps: workflowResult.steps,
      durationMs: workflowResult.durationMs,
    };
  } catch (error) {
    console.error("[WorkflowAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Helper: Get user's resume content
 */
async function getUserResume(userId) {
  const resume = await prisma.resume.findUnique({
    where: { userId },
  });
  return resume?.content || null;
}
