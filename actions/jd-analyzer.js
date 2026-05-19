"use server";

import { withAuth } from "@/lib/middleware/auth";
import { runAgentWithTools } from "@/lib/ai/client";
import { ResumeQueries } from "@/lib/db/queries";

// ── Gemini Tool Definitions ──────────────────────────────────────────────────

const tools = [
  {
    functionDeclarations: [
      {
        name: "extract_requirements",
        description:
          "Extract required skills, experience level, qualifications, and nice-to-haves from a raw job description. Return structured JSON.",
        parameters: {
          type: "OBJECT",
          properties: {
            jobDescription: {
              type: "STRING",
              description: "The full job description text to analyze",
            },
          },
          required: ["jobDescription"],
        },
      },
      {
        name: "score_resume_match",
        description:
          "Compare extracted job requirements against the user's current resume. Return a match score (0-100) and an array of gaps (skills or qualifications the user is missing).",
        parameters: {
          type: "OBJECT",
          properties: {
            requirements: {
              type: "STRING",
              description:
                "JSON string of extracted requirements from extract_requirements",
            },
            resumeContent: {
              type: "STRING",
              description: "The user's current resume content in markdown",
            },
          },
          required: ["requirements", "resumeContent"],
        },
      },
      {
        name: "generate_action_plan",
        description:
          "Given a list of gaps between the job requirements and the user's resume, generate a prioritized list of 3-5 concrete actions to close those gaps. Actions should include skills to learn, keywords to add to resume, and experiences to highlight.",
        parameters: {
          type: "OBJECT",
          properties: {
            gaps: {
              type: "STRING",
              description:
                "JSON string of gap analysis from score_resume_match",
            },
            jobTitle: {
              type: "STRING",
              description: "The job title being applied for",
            },
          },
          required: ["gaps"],
        },
      },
    ],
  },
];

// ── Tool Handlers ────────────────────────────────────────────────────────────

function createToolHandlers(userId) {
  return {
    async extract_requirements({ jobDescription }) {
      // The LLM generates this response — we just structure and return it
      // In a function-calling flow, Gemini calls this tool and WE return
      // the structured data. But since Gemini IS the one doing the extraction,
      // we return a signal telling it to produce the extraction itself.
      return {
        instruction:
          "Analyze the job description and return JSON with: requiredSkills (array of strings), experienceLevel (string like 'Senior' or '3-5 years'), qualifications (array of strings), niceToHaves (array of strings), jobTitle (string), company (string if found).",
        jobDescription: jobDescription.slice(0, 4000),
      };
    },

    async score_resume_match({ requirements, resumeContent }) {
      // If resumeContent was not provided by Gemini, fetch from DB
      let resume = resumeContent;
      if (!resume || resume === "null" || resume === "undefined") {
        const dbResume = await ResumeQueries.getByUserId(userId);
        resume = dbResume?.content || "No resume found in database.";
      }
      return {
        instruction:
          "Compare the requirements against the resume. Return JSON with: matchScore (number 0-100), gaps (array of objects each with { skill: string, severity: 'high' | 'medium' | 'low', reason: string }).",
        requirements,
        resumeContent: resume.slice(0, 3000),
      };
    },

    async generate_action_plan({ gaps, jobTitle }) {
      return {
        instruction:
          "Given these gaps, return JSON with: actionPlan (array of 3-5 objects each with { priority: number, action: string, category: 'skill' | 'keyword' | 'experience' | 'certification', estimatedEffort: string }).",
        gaps,
        jobTitle: jobTitle || "the target role",
      };
    },
  };
}

// ── System Instruction ───────────────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `You are a career advisor AI agent. You analyze job descriptions and compare them against a candidate's resume.

Your workflow:
1. First, call extract_requirements with the job description to identify what the role needs.
2. Then, call score_resume_match with the extracted requirements and the user's resume to find gaps.
3. Finally, call generate_action_plan with the identified gaps to create an improvement plan.

IMPORTANT: After calling each tool, you will receive structured data back. Use that data as input for the next tool call. After all 3 tools have been called, produce a final summary as your text response.

Your final text response MUST be valid JSON with this exact shape:
{
  "matchScore": <number 0-100>,
  "gaps": [{ "skill": "<string>", "severity": "high|medium|low", "reason": "<string>" }],
  "actionPlan": [{ "priority": <number>, "action": "<string>", "category": "skill|keyword|experience|certification", "estimatedEffort": "<string>" }],
  "summary": "<1-2 sentence overall assessment>"
}

Return ONLY the JSON object. No markdown fences, no extra text.`;

// ── Main Export ──────────────────────────────────────────────────────────────

export async function analyzeJobDescription(jdText) {
  return withAuth(async (user) => {
    if (!jdText || typeof jdText !== "string" || jdText.trim().length < 50) {
      throw new Error(
        "Please provide a job description with at least 50 characters."
      );
    }

    const toolHandlers = createToolHandlers(user.id);

    const prompt = `Analyze this job description for me. My user ID for resume lookup is "${user.id}".

Job Description:
${jdText.slice(0, 5000)}`;

    const { text, toolLog } = await runAgentWithTools(
      prompt,
      tools,
      toolHandlers,
      SYSTEM_INSTRUCTION,
      {
        userId: user.id,
        agentType: "JD_ANALYZER",
        inputSummary: `Analyzed JD: ${jdText.slice(0, 100).replace(/\n/g, " ")}...`,
      }
    );

    // Parse the final JSON response from Gemini
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
      // Fallback: return raw text if parsing fails
      result = {
        matchScore: 0,
        gaps: [],
        actionPlan: [],
        summary: text || "Analysis completed but could not parse structured results.",
      };
    }

    return {
      matchScore: result.matchScore ?? 0,
      gaps: Array.isArray(result.gaps) ? result.gaps : [],
      actionPlan: Array.isArray(result.actionPlan) ? result.actionPlan : [],
      summary: result.summary || "",
      toolLog,
    };
  });
}
