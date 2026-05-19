"use server";

import { withAuth } from "@/lib/middleware/auth";
import { InterviewService } from "@/lib/services/interview-service";
import { runAgentWithTools } from "@/lib/ai/client";

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

// ── Interview Coach Agent ────────────────────────────────────────────────────

const interviewTools = [
  {
    functionDeclarations: [
      {
        name: "evaluate_answer",
        description:
          "Evaluate a single interview answer. Score it 0-10, provide feedback, and list key points the user missed.",
        parameters: {
          type: "OBJECT",
          properties: {
            question: { type: "STRING", description: "The interview question" },
            correctAnswer: { type: "STRING", description: "The correct/expected answer" },
            userAnswer: { type: "STRING", description: "The user's chosen answer" },
            explanation: { type: "STRING", description: "The explanation for the correct answer" },
          },
          required: ["question", "correctAnswer", "userAnswer"],
        },
      },
      {
        name: "identify_weak_areas",
        description:
          "Analyze all evaluated answers and identify the top 2-3 weak areas or knowledge gaps the user should focus on.",
        parameters: {
          type: "OBJECT",
          properties: {
            evaluations: {
              type: "STRING",
              description: "JSON string of all answer evaluations",
            },
            industry: { type: "STRING", description: "The user's industry" },
          },
          required: ["evaluations"],
        },
      },
      {
        name: "generate_followup_question",
        description:
          "Generate a targeted follow-up interview question to probe a specific weak area deeper.",
        parameters: {
          type: "OBJECT",
          properties: {
            weakArea: { type: "STRING", description: "The weak area to target" },
            industry: { type: "STRING", description: "The user's industry" },
            previousQuestions: { type: "STRING", description: "Questions already asked, to avoid repeats" },
          },
          required: ["weakArea"],
        },
      },
    ],
  },
];

const INTERVIEW_SYSTEM_INSTRUCTION = `You are an expert interview coach AI agent. You evaluate a user's quiz answers, identify their weak areas, and generate targeted follow-up questions.

Your workflow:
1. Call evaluate_answer for EACH question/answer pair. Assess accuracy, depth, and understanding.
2. After evaluating all answers, call identify_weak_areas with all evaluations to find patterns.
3. For each weak area identified (2-3 max), call generate_followup_question to create a targeted practice question.

After all tools have been called, produce your final text response as valid JSON:
{
  "evaluations": [{ "question": "<string>", "userAnswer": "<string>", "correctAnswer": "<string>", "score": <0-10>, "feedback": "<string>", "missedPoints": ["<string>"] }],
  "weakAreas": [{ "area": "<string>", "severity": "high|medium|low", "reason": "<string>" }],
  "followUpQuestions": [{ "question": "<string>", "targetArea": "<string>", "difficulty": "easy|medium|hard", "hint": "<string>" }],
  "overallScore": <number 0-100>,
  "summary": "<1-2 sentence coaching summary>"
}

Return ONLY the JSON object. No markdown fences, no extra text.`;

function createInterviewToolHandlers(user) {
  return {
    async evaluate_answer({ question, correctAnswer, userAnswer, explanation }) {
      return {
        instruction:
          "Score this answer 0-10. Return JSON: { score: number, feedback: string, missedPoints: string[] }. Be specific about what was good and what was missed.",
        question,
        correctAnswer,
        userAnswer,
        explanation: explanation || "",
        industry: user.industry || "general",
      };
    },

    async identify_weak_areas({ evaluations, industry }) {
      return {
        instruction:
          "Analyze the evaluations and identify 2-3 weak areas. Return JSON: { weakAreas: [{ area: string, severity: 'high' | 'medium' | 'low', reason: string }] }. Focus on patterns, not individual questions.",
        evaluations,
        industry: industry || user.industry || "general",
      };
    },

    async generate_followup_question({ weakArea, industry, previousQuestions }) {
      return {
        instruction:
          "Generate one targeted follow-up question for this weak area. Return JSON: { question: string, targetArea: string, difficulty: 'easy' | 'medium' | 'hard', hint: string }. Make it specific and actionable.",
        weakArea,
        industry: industry || user.industry || "general",
        previousQuestions: previousQuestions || "[]",
      };
    },
  };
}

/**
 * Run the Interview Coach Agent on completed quiz answers.
 * @param {Array<{ question: string, correctAnswer: string, userAnswer: string, explanation: string }>} questionResults
 */
export async function runInterviewSession(questionResults) {
  return withAuth(async (user) => {
    if (!Array.isArray(questionResults) || questionResults.length === 0) {
      throw new Error("No answers to evaluate.");
    }

    const toolHandlers = createInterviewToolHandlers(user);

    const questionsText = questionResults
      .map(
        (q, i) =>
          `Q${i + 1}: "${q.question}" | User answered: "${q.userAnswer}" | Correct: "${q.correctAnswer}" | Explanation: "${q.explanation || ""}"`
      )
      .join("\n");

    const prompt = `Evaluate my interview quiz performance. Here are my answers:

${questionsText}

My industry: ${user.industry || "general"}
My skills: ${user.skills?.join(", ") || "not specified"}

Evaluate each answer, identify my weak areas, and generate follow-up questions I should practice.`;

    const { text, toolLog } = await runAgentWithTools(
      prompt,
      interviewTools,
      toolHandlers,
      INTERVIEW_SYSTEM_INSTRUCTION,
      {
        userId: user.id,
        agentType: "INTERVIEW_COACH",
        inputSummary: `Evaluated ${questionResults.length} interview answers for ${user.industry || "general"} role`,
      }
    );

    // Parse the final JSON
    let result;
    try {
      const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
      const jsonStr = fenceMatch ? fenceMatch[1].trim() : text.trim();
      const start = jsonStr.search(/[{[]/);
      if (start === -1) throw new Error("No JSON found");
      const trimmed = jsonStr.slice(start);
      const end = Math.max(trimmed.lastIndexOf("}"), trimmed.lastIndexOf("]"));
      result = JSON.parse(trimmed.slice(0, end + 1));
    } catch {
      result = {
        evaluations: [],
        weakAreas: [],
        followUpQuestions: [],
        overallScore: 0,
        summary: text || "Analysis completed but could not parse structured results.",
      };
    }

    return {
      evaluations: Array.isArray(result.evaluations) ? result.evaluations : [],
      weakAreas: Array.isArray(result.weakAreas) ? result.weakAreas : [],
      followUpQuestions: Array.isArray(result.followUpQuestions) ? result.followUpQuestions : [],
      overallScore: result.overallScore ?? 0,
      summary: result.summary || "",
      toolLog,
    };
  });
}
