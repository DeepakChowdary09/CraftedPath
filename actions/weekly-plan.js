"use server";

import { withAuth } from "@/lib/middleware/auth";
import { db } from "@/lib/prisma";

/**
 * Fetch the current user's latest weekly agent plan.
 */
export async function getLatestWeeklyPlan() {
  return withAuth(async (user) => {
    return db.weeklyAgentPlan.findFirst({
      where: { userId: user.id },
      orderBy: { weekOf: "desc" },
    });
  });
}
