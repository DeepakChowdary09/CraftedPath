"use server";

import { withAuth } from "@/lib/middleware/auth";
import { runAgentWithTools } from "@/lib/ai/client";
import { ResumeQueries } from "@/lib/db/queries";
import { db } from "@/lib/prisma";

// ── Gemini Tool Definitions ──────────────────────────────────────────────────

const tools = [
  {
    functionDeclarations: [
      {
        name: "extract_jd_keywords",
        description:
          "Extract key requirements, skills, technologies, and phrases from a job description that an ATS would scan for. Return structured JSON.",
        parameters: {
          type: "OBJECT",
          properties: {
            jobDescription: {
              type: "STRING",
              description: "The full job description text",
            },
          },
          required: ["jobDescription"],
        },
      },
      {
        name: "analyze_resume_gaps",
        description:
          "Compare the extracted JD keywords against the current resume content. Identify which keywords are present and which are missing.",
        parameters: {
          type: "OBJECT",
          properties: {
            jdKeywords: {
              type: "STRING",
              description: "JSON string of extracted keywords from extract_jd_keywords",
            },
            resumeContent: {
              type: "STRING",
              description: "The user's current resume in markdown format",
            },
          },
          required: ["jdKeywords", "resumeContent"],
        },
      },
      {
        name: "rewrite_resume_sections",
        description:
          "Rewrite resume sections to incorporate missing keywords and better match the job description, while keeping the content truthful and professional. Return the full improved resume in markdown.",
        parameters: {
          type: "OBJECT",
          properties: {
            resumeContent: {
              type: "STRING",
              description: "The current resume content in markdown",
            },
            missingKeywords: {
              type: "STRING",
              description: "JSON string of missing keywords and gaps to address",
            },
            jobTitle: {
              type: "STRING",
              description: "The target job title",
            },
          },
          required: ["resumeContent", "missingKeywords"],
        },
      },
      {
        name: "score_ats_match",
        description:
          "Score the resume against the job description for ATS compatibility. Return a score 0-100 and detailed feedback. If score is below 70, identify what still needs improvement.",
        parameters: {
          type: "OBJECT",
          properties: {
            resumeContent: {
              type: "STRING",
              description: "The resume content to score",
            },
            jdKeywords: {
              type: "STRING",
              description: "JSON string of JD keywords to match against",
            },
          },
          required: ["resumeContent", "jdKeywords"],
        },
      },
    ],
  },
];

// ── Tool Handlers ────────────────────────────────────────────────────────────

function createToolHandlers(userId) {
  return {
    async extract_jd_keywords({ jobDescription }) {
      return {
        instruction:
          "Extract and return JSON with: requiredSkills (array), technologies (array), softSkills (array), experienceRequirements (array), certifications (array), keyPhrases (array of exact phrases an ATS would match).",
        jobDescription: jobDescription.slice(0, 4000),
      };
    },

    async analyze_resume_gaps({ jdKeywords, resumeContent }) {
      let resume = resumeContent;
      if (!resume || resume === "null" || resume === "undefined") {
        const dbResume = await ResumeQueries.getByUserId(userId);
        resume = dbResume?.content || "No resume found.";
      }
      return {
        instruction:
          "Compare keywords against resume. Return JSON with: presentKeywords (array), missingKeywords (array of { keyword: string, importance: 'critical' | 'important' | 'nice-to-have', suggestedSection: string }), overallCoverage (number 0-100).",
        jdKeywords,
        resumeContent: resume.slice(0, 3000),
      };
    },

    async rewrite_resume_sections({ resumeContent, missingKeywords, jobTitle }) {
      let resume = resumeContent;
      if (!resume || resume === "null" || resume === "undefined") {
        const dbResume = await ResumeQueries.getByUserId(userId);
        resume = dbResume?.content || "";
      }
      return {
        instruction:
          "Rewrite the resume to naturally incorporate missing keywords. Keep it truthful — do NOT fabricate experience. Enhance bullet points with metrics and action verbs. Return the FULL improved resume in markdown format as a single string in a field called 'improvedResume'. Also return 'changes' (array of { section: string, change: string }) describing what you changed.",
        resumeContent: resume.slice(0, 4000),
        missingKeywords,
        jobTitle: jobTitle || "the target role",
      };
    },

    async score_ats_match({ resumeContent, jdKeywords }) {
      return {
        instruction:
          "Score this resume for ATS compatibility against the JD keywords. Return JSON with: atsScore (number 0-100), feedback (array of { category: 'keyword' | 'format' | 'content' | 'length', message: string, severity: 'pass' | 'warning' | 'fail' }), keywordMatchRate (number 0-100), needsRevision (boolean — true if atsScore < 70).",
        resumeContent: resumeContent?.slice(0, 4000) || "",
        jdKeywords,
      };
    },
  };
}

// ── System Instruction ───────────────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `You are a resume optimization AI agent. You tailor resumes to match specific job descriptions for maximum ATS pass rate.

Your workflow:
1. Call extract_jd_keywords to identify what the ATS will scan for.
2. Call analyze_resume_gaps to find what's missing from the resume.
3. Call rewrite_resume_sections to improve the resume with missing keywords.
4. Call score_ats_match to score the improved resume.
5. If the score is below 70 and needsRevision is true, call rewrite_resume_sections again with the remaining gaps, then call score_ats_match once more. Do NOT loop more than twice.

After all tools have been called, produce a final text response as valid JSON:
{
  "improvedResume": "<full improved resume in markdown>",
  "atsScore": <number 0-100>,
  "changes": [{ "section": "<string>", "change": "<string>" }],
  "feedback": [{ "category": "<string>", "message": "<string>", "severity": "pass|warning|fail" }],
  "keywordMatchRate": <number 0-100>,
  "iterations": <number of rewrite cycles performed>
}

Return ONLY the JSON object. No markdown fences, no extra text.`;

// ── Main Export ──────────────────────────────────────────────────────────────

export async function tailorResume(jdText) {
  return withAuth(async (user) => {
    if (!jdText || typeof jdText !== "string" || jdText.trim().length < 50) {
      throw new Error("Please provide a job description with at least 50 characters.");
    }

    // Fetch current resume
    const dbResume = await ResumeQueries.getByUserId(user.id);
    if (!dbResume?.content) {
      throw new Error("No resume found. Please create a resume first in the Resume Builder.");
    }

    const toolHandlers = createToolHandlers(user.id);

    const prompt = `Tailor my resume to match this job description. My current resume is already in the database — fetch it using my user ID.

Job Description:
${jdText.slice(0, 5000)}`;

    const { text, toolLog } = await runAgentWithTools(
      prompt,
      tools,
      toolHandlers,
      SYSTEM_INSTRUCTION,
      {
        userId: user.id,
        agentType: "RESUME_TAILOR",
        inputSummary: `Tailored resume for: ${jdText.slice(0, 100).replace(/\n/g, " ")}...`,
      }
    );

    // Parse final JSON
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
        improvedResume: dbResume.content,
        atsScore: 0,
        changes: [],
        feedback: [],
        keywordMatchRate: 0,
        iterations: 0,
      };
    }

    // Save ATS score and feedback to the Resume record
    const feedbackText = (result.feedback || [])
      .map((f) => `[${f.severity}] ${f.category}: ${f.message}`)
      .join("\n");

    await db.resume.update({
      where: { userId: user.id },
      data: {
        atsScore: result.atsScore ?? null,
        Feedback: feedbackText || null,
      },
    });

    return {
      improvedResume: result.improvedResume || dbResume.content,
      atsScore: result.atsScore ?? 0,
      changes: Array.isArray(result.changes) ? result.changes : [],
      feedback: Array.isArray(result.feedback) ? result.feedback : [],
      keywordMatchRate: result.keywordMatchRate ?? 0,
      iterations: result.iterations ?? 1,
      toolLog,
    };
  });
}
