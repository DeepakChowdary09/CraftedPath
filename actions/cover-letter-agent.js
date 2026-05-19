"use server";

import { withAuth } from "@/lib/middleware/auth";
import { runAgentWithTools } from "@/lib/ai/client";
import { ResumeQueries, CoverLetterQueries } from "@/lib/db/queries";

// ── Gemini Tool Definitions ──────────────────────────────────────────────────

const tools = [
  {
    functionDeclarations: [
      {
        name: "gather_context",
        description:
          "Fetch the candidate's resume and profile context from the database to inform the cover letter.",
        parameters: {
          type: "OBJECT",
          properties: {
            userId: {
              type: "STRING",
              description: "The user's database ID for looking up their resume",
            },
          },
          required: ["userId"],
        },
      },
      {
        name: "draft_cover_letter",
        description:
          "Write a first draft of a cover letter for the given job, using the candidate's resume and profile as context. Return the full letter text.",
        parameters: {
          type: "OBJECT",
          properties: {
            jobTitle: { type: "STRING", description: "The target job title" },
            companyName: { type: "STRING", description: "The company name" },
            jobDescription: { type: "STRING", description: "The full job description" },
            resumeSummary: { type: "STRING", description: "Summary of candidate's resume and skills" },
            candidateInfo: { type: "STRING", description: "Additional candidate context (industry, bio, experience)" },
          },
          required: ["jobTitle", "companyName", "jobDescription"],
        },
      },
      {
        name: "critique_cover_letter",
        description:
          "Review the cover letter draft and provide specific, actionable critique. Assess tone, relevance, ATS keywords, structure, and persuasiveness. Return a list of issues with severity.",
        parameters: {
          type: "OBJECT",
          properties: {
            draft: { type: "STRING", description: "The cover letter draft to critique" },
            jobDescription: { type: "STRING", description: "The original job description for relevance checking" },
          },
          required: ["draft", "jobDescription"],
        },
      },
      {
        name: "revise_cover_letter",
        description:
          "Revise the cover letter draft based on the critique. Address every issue raised. Return the improved full letter text.",
        parameters: {
          type: "OBJECT",
          properties: {
            draft: { type: "STRING", description: "The current cover letter draft" },
            critique: { type: "STRING", description: "JSON string of critique issues to address" },
            jobTitle: { type: "STRING", description: "The target job title" },
            companyName: { type: "STRING", description: "The company name" },
          },
          required: ["draft", "critique"],
        },
      },
      {
        name: "score_cover_letter",
        description:
          "Score the final cover letter on a scale of 0-100 for overall quality, and provide a breakdown by category.",
        parameters: {
          type: "OBJECT",
          properties: {
            coverLetter: { type: "STRING", description: "The cover letter to score" },
            jobDescription: { type: "STRING", description: "The job description for relevance" },
          },
          required: ["coverLetter"],
        },
      },
    ],
  },
];

// ── Tool Handlers ────────────────────────────────────────────────────────────

function createToolHandlers(user) {
  return {
    async gather_context() {
      const resume = await ResumeQueries.getByUserId(user.id);
      return {
        resumeContent: resume?.content?.slice(0, 3000) || "No resume found.",
        candidateIndustry: user.industry || "Not specified",
        candidateExperience: user.experience ?? "Not specified",
        candidateSkills: user.skills?.length > 0 ? user.skills.join(", ") : "Not specified",
        candidateBio: user.bio || "Not provided",
      };
    },

    async draft_cover_letter({ jobTitle, companyName, jobDescription, resumeSummary, candidateInfo }) {
      return {
        instruction:
          "Write a professional, compelling cover letter. Use specific examples from the candidate's background. Keep it under 400 words. Address the hiring manager. Match the company's tone. Include relevant keywords from the JD. Return JSON with: { coverLetter: string (the full letter) }.",
        jobTitle,
        companyName,
        jobDescription: jobDescription?.slice(0, 3000) || "",
        resumeSummary: resumeSummary || "",
        candidateInfo: candidateInfo || "",
      };
    },

    async critique_cover_letter({ draft, jobDescription }) {
      return {
        instruction:
          "Critique this cover letter. Return JSON with: { issues: [{ category: 'tone' | 'relevance' | 'keywords' | 'structure' | 'persuasion' | 'length', severity: 'critical' | 'major' | 'minor', issue: string, suggestion: string }], overallAssessment: string, strengthScore: number (0-100) }.",
        draft: draft?.slice(0, 3000) || "",
        jobDescription: jobDescription?.slice(0, 2000) || "",
      };
    },

    async revise_cover_letter({ draft, critique, jobTitle, companyName }) {
      return {
        instruction:
          "Revise the cover letter to address every critique issue. Return JSON with: { revisedLetter: string (the full improved letter), changesApplied: [{ issue: string, fix: string }] }.",
        draft: draft?.slice(0, 3000) || "",
        critique,
        jobTitle: jobTitle || "",
        companyName: companyName || "",
      };
    },

    async score_cover_letter({ coverLetter, jobDescription }) {
      return {
        instruction:
          "Score this cover letter. Return JSON with: { overallScore: number (0-100), breakdown: { tone: number, relevance: number, keywords: number, structure: number, persuasion: number }, verdict: 'excellent' | 'good' | 'needs-work' | 'poor' }.",
        coverLetter: coverLetter?.slice(0, 3000) || "",
        jobDescription: jobDescription?.slice(0, 2000) || "",
      };
    },
  };
}

// ── System Instruction ───────────────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `You are a professional cover letter writing AI agent. You follow a draft → critique → revise workflow to produce high-quality, tailored cover letters.

Your workflow:
1. Call gather_context to fetch the candidate's resume and profile from the database.
2. Call draft_cover_letter with the job details and candidate context to write a first draft.
3. Call critique_cover_letter to self-review the draft for tone, relevance, keywords, structure, and persuasiveness.
4. Call revise_cover_letter to fix every issue from the critique.
5. Call score_cover_letter to give a final quality score.

If the score is below 70, call critique_cover_letter on the revised version and revise again. Do NOT loop more than twice.

After all tools have been called, produce your final text response as valid JSON:
{
  "coverLetter": "<the final cover letter text>",
  "score": <number 0-100>,
  "breakdown": { "tone": <n>, "relevance": <n>, "keywords": <n>, "structure": <n>, "persuasion": <n> },
  "critique": [{ "category": "<string>", "severity": "<string>", "issue": "<string>", "suggestion": "<string>" }],
  "changesApplied": [{ "issue": "<string>", "fix": "<string>" }],
  "verdict": "excellent|good|needs-work|poor",
  "iterations": <number of draft-critique-revise cycles>
}

Return ONLY the JSON object. No markdown fences, no extra text.`;

// ── Main Export ──────────────────────────────────────────────────────────────

export async function generateAgentCoverLetter({ jobTitle, companyName, jobDescription }) {
  return withAuth(async (user) => {
    if (!jobTitle?.trim()) throw new Error("Job title is required.");
    if (!companyName?.trim()) throw new Error("Company name is required.");
    if (!jobDescription?.trim() || jobDescription.trim().length < 30) {
      throw new Error("Please provide a job description (at least 30 characters).");
    }

    const toolHandlers = createToolHandlers(user);

    const prompt = `Write a cover letter for me. Here are the details:

Job Title: ${jobTitle}
Company: ${companyName}
Job Description:
${jobDescription.slice(0, 5000)}

My user ID for resume/profile lookup is "${user.id}".`;

    const { text, toolLog } = await runAgentWithTools(
      prompt,
      tools,
      toolHandlers,
      SYSTEM_INSTRUCTION,
      {
        userId: user.id,
        agentType: "COVER_LETTER",
        inputSummary: `Cover letter for ${jobTitle} at ${companyName}`,
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
      // If JSON parsing fails, use the raw text as the cover letter
      result = {
        coverLetter: text || "Cover letter generation completed but could not parse structured results.",
        score: 0,
        breakdown: {},
        critique: [],
        changesApplied: [],
        verdict: "needs-work",
        iterations: 1,
      };
    }

    const finalLetter = result.coverLetter || text;

    // Save to the CoverLetter table
    const saved = await CoverLetterQueries.create({
      content: finalLetter,
      jobDescription,
      companyName,
      jobTitle,
      userId: user.id,
    });

    return {
      id: saved.id,
      coverLetter: finalLetter,
      score: result.score ?? 0,
      breakdown: result.breakdown || {},
      critique: Array.isArray(result.critique) ? result.critique : [],
      changesApplied: Array.isArray(result.changesApplied) ? result.changesApplied : [],
      verdict: result.verdict || "needs-work",
      iterations: result.iterations ?? 1,
      toolLog,
    };
  });
}
