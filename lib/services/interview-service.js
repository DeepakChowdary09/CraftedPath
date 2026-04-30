import { AssessmentQueries } from "@/lib/db/queries";
import { generateQuiz, generateImprovementTip } from "@/lib/ai/interview";
import { logger } from "@/lib/utils/logger";

export const InterviewService = {
  async generateQuiz(user) {
    const result = await generateQuiz(user.industry, user.skills);
    if (!result.success) {
      logger.error("Quiz generation failed", new Error(result.error), {
        operation: "generateQuiz",
      });
      throw new Error(`Failed to generate quiz: ${result.error}`);
    }
    return result.data;
  },

  async saveQuizResult(user, questions, answers, score) {
    const questionResults = questions.map((q, index) => ({
      question: q.question,
      answer: q.correctAnswer,
      userAnswer: answers[index],
      isCorrect: q.correctAnswer === answers[index],
      explanation: q.explanation,
    }));

    const wrongAnswers = questionResults.filter((q) => !q.isCorrect);
    let improvementTip = null;

    if (wrongAnswers.length > 0) {
      const topWrong = wrongAnswers.slice(0, 3);
      const wrongQuestionsText = topWrong
        .map((q) => `Q: "${q.question}" | Correct: "${q.answer}"`)
        .join(" | ");

      const result = await generateImprovementTip(user.industry, wrongQuestionsText);
      if (result.success) {
        improvementTip = result.data;
      } else {
        logger.error(
          "Improvement tip generation failed",
          new Error(result.error),
          { operation: "generateImprovementTip" }
        );
      }
    }

    return AssessmentQueries.create({
      userId: user.id,
      quizScore: score,
      questions: questionResults,
      category: "Technical",
      improvementTip,
    });
  },

  async getAssessments(userId) {
    return AssessmentQueries.getManyByUserId(userId);
  },
};
