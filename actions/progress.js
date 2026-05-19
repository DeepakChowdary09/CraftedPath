"use server";

import { withAuth } from "@/lib/middleware/auth";
import { db } from "@/lib/prisma";

export async function getProgressStats() {
  return withAuth(async (user) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [
      resumeVersionCount,
      assessmentCount,
      applicationCount,
      coverLetterCount,
      goalCount,
      completedGoalCount,
      agentRunsThisWeek,
    ] = await Promise.all([
      db.resumeVersion.count({ where: { userId: user.id } }),
      db.assessments.count({ where: { userId: user.id } }),
      db.jobApplication.count({ where: { userId: user.id } }),
      db.coverLetter.count({ where: { userId: user.id } }),
      db.goal.count({ where: { userId: user.id } }),
      db.goal.count({ where: { userId: user.id, isCompleted: true } }),
      db.agentRun.count({ where: { userId: user.id, createdAt: { gte: oneWeekAgo } } }),
    ]);

    const applicationsByStatus = await db.jobApplication.groupBy({
      by: ["status"],
      where: { userId: user.id },
      _count: { status: true },
    });

    const recentAssessments = await db.assessments.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { quizScore: true, createdAt: true, category: true },
    });

    return {
      resumeVersionCount,
      assessmentCount,
      applicationCount,
      coverLetterCount,
      goalCount,
      completedGoalCount,
      agentRunsThisWeek,
      applicationsByStatus,
      recentAssessments,
    };
  });
}
