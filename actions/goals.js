"use server";

import { withAuth } from "@/lib/middleware/auth";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getGoals() {
  return withAuth((user) =>
    db.goal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    })
  );
}

export async function createGoal(data) {
  return withAuth(async (user) => {
    const goal = await db.goal.create({
      data: {
        userId: user.id,
        title: data.title,
        target: data.target,
        progress: 0,
      },
    });
    revalidatePath("/dashboard/goals");
    return goal;
  });
}

export async function updateGoalProgress(id, progress) {
  return withAuth(async (user) => {
    const goal = await db.goal.findUnique({ where: { id, userId: user.id } });
    if (!goal) throw new Error("Goal not found");

    const clamped = Math.min(Math.max(progress, 0), goal.target);
    const updated = await db.goal.update({
      where: { id, userId: user.id },
      data: {
        progress: clamped,
        isCompleted: clamped >= goal.target,
      },
    });
    revalidatePath("/dashboard/goals");
    return updated;
  });
}

export async function deleteGoal(id) {
  return withAuth(async (user) => {
    await db.goal.delete({ where: { id, userId: user.id } });
    revalidatePath("/dashboard/goals");
  });
}
