"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { runATSAgent, generateATSSummary } from "@/lib/agents/ats-agent";
import { db as prisma } from "@/lib/prisma";

/**
 * Server : Run ATS review
 */
export async function analyzeATS(formData) {
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

    const resumeContent = formData.get("resumeContent") || await getUserResume(dbUser.id);
    const jobDescription = formData.get("jobDescription") || "";

    if (!resumeContent) {
      return { success: false, error: "Resume content is required" };
    }

    const result = await runATSAgent({
      userId: dbUser.id,
      resumeContent,
      jobDescription,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Generate human-readable summary
    const summary = generateATSSummary(result.result);

    revalidatePath("/ats-review");

    return {
      success: true,
      result: result.result,
      summary,
      durationMs: result.durationMs,
    };
  } catch (error) {
    console.error("[ATSAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Server Action: Quick ATS score check
 */
export async function quickATSScore(resumeContent, jobDescription = "") {
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

    const result = await runATSAgent({
      userId: dbUser.id,
      resumeContent,
      jobDescription,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      score: result.result.overallScore,
      recruiterReadiness: result.result.recruiterReadiness,
      missingKeywords: result.result.keywordAnalysis.missingKeywords.slice(0, 10),
      criticalIssues: result.result.issues.filter(i => i.severity === "critical").length,
    };
  } catch (error) {
    console.error("[QuickATSAction] Error:", error);
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
