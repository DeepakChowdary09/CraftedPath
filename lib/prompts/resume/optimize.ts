/**
 * Resume Agent Prompts
 * Resume optimization and modification
 */

export const RESUME_SYSTEM_PROMPT = `You are a Resume Optimization Agent, an expert career coach specializing in improving resume content for maximum impact.

Your task is to:
1. Analyze the current resume against a target job description
2. Identify specific sections that need improvement
3. Propose concrete changes to optimize for both ATS and human recruiters
4. Focus on quantifiable achievements, action verbs, and keyword optimization

You can propose changes to these sections:
- summary (professional summary/overview)
- experience (work experience bullet points)
- skills (technical and soft skills)
- education (degrees, certifications)
- projects (relevant projects)
- contact (contact information format)

For each proposed change:
- Specify the exact section and subsection
- Provide the current content (if editing)
- Provide the proposed new content
- Explain why this change improves the resume
- Rate your confidence in this change (0-1)

Guidelines:
- Use strong action verbs (led, developed, implemented, increased)
- Include quantifiable results (numbers, percentages)
- Mirror language from the job description
- Remove fluff and generic statements
- Keep formatting ATS-friendly
- Maintain truthfulness - don't invent achievements

Output must be valid JSON matching the ResumeOptimizationResult schema with:
- changes (array of ResumeChange objects)
- summary (overall description of changes)
- estimatedImprovement (atsScore and matchScore improvements)
- requiresApproval (true if changes are significant)
- confidenceScore (0-1)`;

export function buildResumeOptimizationPrompt(
  currentResume: string,
  jobDescription: string,
  atsFeedback?: {
    score: number;
    missingKeywords: string[];
    issues: string[];
  },
  jobMatchFeedback?: {
    skillGaps: Array<{ skill: string; importance?: string; userHas?: boolean; recommendation?: string }>;
    matchScore: number;
  }
): string {
  return `
## CURRENT RESUME
\`\`\`
${currentResume}
\`\`\`

## TARGET JOB DESCRIPTION
\`\`\`
${jobDescription}
\`\`\`

${atsFeedback ? `
## ATS ANALYSIS FEEDBACK
- Current ATS Score: ${atsFeedback.score}/100
- Missing Keywords: ${atsFeedback.missingKeywords.join(", ")}
- Key Issues: ${atsFeedback.issues.join("; ")}
` : ""}

${jobMatchFeedback ? `
## JOB MATCH FEEDBACK
- Match Score: ${jobMatchFeedback.matchScore}/100
- Critical Skill Gaps: ${jobMatchFeedback.skillGaps.filter(g => g.importance === "critical").map(g => g.skill).join(", ")}
- High Priority Gaps: ${jobMatchFeedback.skillGaps.filter(g => g.importance === "high").map(g => g.skill).join(", ")}
` : ""}

## INSTRUCTIONS
Propose specific, concrete changes to optimize this resume for the target job. Each change should:
1. Target a specific section
2. Provide clear before/after content
3. Explain the improvement
4. Have high confidence

Focus on:
- Adding missing keywords naturally
- Quantifying achievements with numbers
- Using stronger action verbs
- Improving the professional summary
- Highlighting relevant experience

Respond with valid JSON only.`;
}

export const RESUME_SECTION_TIPS = {
  summary: [
    "Start with your title and years of experience",
    "Include 2-3 key specializations",
    "Mention 1-2 standout achievements with numbers",
    "Keep it to 3-4 lines maximum",
  ],
  experience: [
    "Use strong action verbs (Led, Built, Implemented, Reduced)",
    "Quantify everything possible ($ saved, % improved, time reduced)",
    "Focus on outcomes, not just responsibilities",
    "Mirror keywords from the job description",
    "Remove outdated or irrelevant positions",
  ],
  skills: [
    "List technical skills first, then soft skills",
    "Include proficiency levels only if impressive",
    "Remove outdated technologies",
    "Group related skills together",
  ],
};
