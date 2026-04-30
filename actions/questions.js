"use server";

import { withAuth } from "@/lib/middleware/auth";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getQuestions({ role, topic, difficulty } = {}) {
  const where = {};
  if (role) where.role = role;
  if (topic) where.topic = topic;
  if (difficulty) where.difficulty = difficulty;

  return db.question.findMany({ where, orderBy: { role: "asc" } });
}

export async function getPracticedQuestionIds() {
  return withAuth(async (user) => {
    const rows = await db.practicedQuestion.findMany({
      where: { userId: user.id },
      select: { questionId: true },
    });
    return rows.map((r) => r.questionId);
  });
}

export async function togglePracticed(questionId) {
  return withAuth(async (user) => {
    const existing = await db.practicedQuestion.findUnique({
      where: { userId_questionId: { userId: user.id, questionId } },
    });
    if (existing) {
      await db.practicedQuestion.delete({
        where: { userId_questionId: { userId: user.id, questionId } },
      });
      revalidatePath("/interview/questions");
      return false;
    } else {
      await db.practicedQuestion.create({
        data: { userId: user.id, questionId },
      });
      revalidatePath("/interview/questions");
      return true;
    }
  });
}

export async function getQuestionFilters() {
  const [roles, topics] = await Promise.all([
    db.question.findMany({ distinct: ["role"], select: { role: true } }),
    db.question.findMany({ distinct: ["topic"], select: { topic: true } }),
  ]);
  return {
    roles: roles.map((r) => r.role),
    topics: topics.map((t) => t.topic),
    difficulties: ["Easy", "Medium", "Hard"],
  };
}
