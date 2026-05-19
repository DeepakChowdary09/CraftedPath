/**
 * Resume Optimization Pipeline Orchestrator
 *
 * Pattern: Sequential fan-in → Parallel fan-out
 *
 * Step 1 (Sequential): Job Match Agent   → Claude claude-sonnet-4-6  → JobMatchSchema
 * Step 2 (Sequential): ATS Review Agent  → Claude claude-sonnet-4-6  → ATSReviewSchema
 * Step 3 (Parallel):
 *   Branch A: Resume Optimizer → Claude claude-haiku-4-5 → revised text
 *   Branch B: Cover Letter     → Groq  llama3-70b-8192   → cover letter text (fault-tolerant)
 */

import { getAnthropicClient, getGroqClientSingleton, claudeThrottle } from "./client";
import {
  JobMatchSchema,
  ATSReviewSchema,
  type JobMatchOutput,
  type ATSReviewOutput,
  type PipelineResult,
} from "./schemas";

// ============================================================================
// HELPERS
// ============================================================================

async function callClaude(
  model: string,
  system: string,
  user: string
): Promise<string> {
  await claudeThrottle();
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content: user }],
  });
  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}

function parseJSON<T>(text: string): T {
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*$/g, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

// ============================================================================
// STEP 1 — JOB MATCH AGENT (Claude claude-sonnet-4-6)
// ============================================================================

async function runJobMatchAgent(
  rawResume: string,
  jobDescription: string
): Promise<JobMatchOutput> {
  const system = `You are a Job Match Agent. Analyze a resume against a job description.
Return ONLY valid JSON matching this exact schema — no extra text, no markdown:
{ "missing_keywords": string[], "overemphasized_skills": string[], "tone_mismatches": string[] }`;

  const user = `## JOB DESCRIPTION\n${jobDescription}\n\n## RESUME\n${rawResume}`;

  const raw = await callClaude("claude-sonnet-4-6", system, user);
  const parsed = parseJSON<unknown>(raw);
  return JobMatchSchema.parse(parsed);
}

// ============================================================================
// STEP 2 — ATS REVIEW AGENT (Claude claude-sonnet-4-6)
// ============================================================================

async function runATSReviewAgent(
  rawResume: string,
  jobMatchResult: JobMatchOutput
): Promise<ATSReviewOutput> {
  const system = `You are an ATS Review Agent. Given a resume and a prior job-match analysis, produce section-level editing instructions.
Return ONLY valid JSON matching this exact schema — no extra text, no markdown:
{ "section_instructions": Array<{ "target_section": string, "instruction": string }> }`;

  const user = `## RESUME\n${rawResume}\n\n## JOB MATCH ANALYSIS\n${JSON.stringify(jobMatchResult, null, 2)}`;

  const raw = await callClaude("claude-sonnet-4-6", system, user);
  const parsed = parseJSON<unknown>(raw);
  return ATSReviewSchema.parse(parsed);
}

// ============================================================================
// STEP 3A — RESUME OPTIMIZER (Claude claude-haiku-4-5)
// ============================================================================

async function runResumeOptimizer(
  rawResume: string,
  atsReview: ATSReviewOutput
): Promise<string> {
  const system = `You are a Resume Optimizer. Apply the provided ATS section instructions to rewrite the resume.
Return ONLY the full improved resume text — no JSON, no markdown code fences.`;

  const user = `## ORIGINAL RESUME\n${rawResume}\n\n## ATS SECTION INSTRUCTIONS\n${JSON.stringify(atsReview.section_instructions, null, 2)}`;

  return callClaude("claude-haiku-4-5", system, user);
}

// ============================================================================
// STEP 3B — COVER LETTER AGENT (Groq llama3-70b-8192) — fault-tolerant
// ============================================================================

async function runCoverLetterAgent(
  rawResume: string,
  jobDescription: string
): Promise<string> {
  const client = getGroqClientSingleton();

  const completion = await client.chat.completions.create({
    model: "llama3-70b-8192",
    max_tokens: 1024,
    temperature: 0.5,
    messages: [
      {
        role: "system",
        content:
          "You are a Cover Letter Writer. Create a tailored, professional cover letter. Return only the cover letter text — no extra commentary.",
      },
      {
        role: "user",
        content: `## RESUME\n${rawResume}\n\n## JOB DESCRIPTION\n${jobDescription}`,
      },
    ],
  });

  return completion.choices[0]?.message?.content ?? "";
}

// ============================================================================
// MASTER PIPELINE
// ============================================================================

export async function runResumeOptimizationPipeline(
  rawResume: string,
  jobDescription: string
): Promise<PipelineResult> {
  // Step 1 — sequential
  const jobMatch = await runJobMatchAgent(rawResume, jobDescription);

  // Rate-limit delay between sequential Claude calls (already inside callClaude
  // via claudeThrottle, but an explicit gap here keeps the orchestrator readable)
  await claudeThrottle();

  // Step 2 — sequential
  const atsReview = await runATSReviewAgent(rawResume, jobMatch);

  // Step 3 — parallel fan-out
  const [optimizedResume, coverLetterResult] = await Promise.allSettled([
    runResumeOptimizer(rawResume, atsReview),
    runCoverLetterAgent(rawResume, jobDescription),
  ]);

  const optimized =
    optimizedResume.status === "fulfilled"
      ? optimizedResume.value
      : rawResume; // Fallback: return original resume if optimizer fails

  // Branch B is fault-tolerant — null on any failure
  const coverLetter =
    coverLetterResult.status === "fulfilled" ? coverLetterResult.value : null;

  if (coverLetterResult.status === "rejected") {
    console.warn(
      "[Orchestrator] Cover Letter (Groq) branch failed — returning optimized resume only.",
      coverLetterResult.reason
    );
  }

  return {
    jobMatch,
    atsReview,
    optimizedResume: optimized,
    coverLetter,
  };
}
