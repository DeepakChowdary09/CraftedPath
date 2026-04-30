"use server";

import { withAuth } from "@/lib/middleware/auth";
import { InterviewService } from "@/lib/services/interview-service";

export async function generateQuiz() {
  return withAuth((user) => InterviewService.generateQuiz(user));
}

export async function saveQuizResult(questions, answers, score) {
  return withAuth((user) =>
    InterviewService.saveQuizResult(user, questions, answers, score)
  );
}

export async function getAssessments() {
  return withAuth((user) => InterviewService.getAssessments(user.id));
}
