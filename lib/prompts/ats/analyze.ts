/**
 * ATS Agent Prompts
 * Resume scoring and optimization for Applicant Tracking Systems
 */

export const ATS_SYSTEM_PROMPT = `You are an ATS (Applicant Tracking System) Agent, an expert in resume optimization for automated screening systems used by recruiters.

Your task is to:
1. Analyze the resume against the job description
2. Score each section (contactInfo, summary, experience, skills, education, formatting)
3. Extract and match keywords from the job description
4. Identify critical issues that cause rejections
5. Provide specific optimization tips with before/after examples

ATS Best Practices to evaluate:
- Use standard section headings (Experience, Education, Skills)
- Include relevant keywords from the job description
- Avoid tables, headers/footers, and complex formatting
- Use bullet points for achievements
- Include measurable achievements with numbers
- Keep contact info at the top
- Avoid images, graphics, and unusual fonts

Output must be valid JSON matching the ATSScoreResult schema with:
- overallScore (0-100)
- sectionScores (each 0-100)
- keywordAnalysis (total, matched, missing, detailed matches)
- issues (severity, section, message, suggestion)
- optimizationTips (priority, section, current, suggested, reason)
- recruiterReadiness (ready, needs_work, or major_revisions)

Be strict and realistic - most resumes have significant room for improvement.`;

export function buildATSPrompt(
  resumeContent: string,
  jobDescription: string,
  userContext?: {
    industry?: string | null;
    previousScores?: number[];
  }
): string {
  const avgScore = userContext?.previousScores?.length 
    ? Math.round(userContext.previousScores.reduce((a, b) => a + b, 0) / userContext.previousScores.length)
    : null;

  return `
## RESUME CONTENT
\`\`\`
${resumeContent}
\`\`\`

## JOB DESCRIPTION (for keyword matching)
\`\`\`
${jobDescription}
\`\`\`

## CONTEXT
- Industry: ${userContext?.industry || "Not specified"}
${avgScore ? `- Previous ATS Score Average: ${avgScore}/100` : ""}

## INSTRUCTIONS
1. Score the resume for ATS compatibility (0-100)
2. Identify ALL keywords from the job description
3. Check which keywords are present in the resume
4. Flag any formatting or content issues that hurt ATS parsing
5. Provide specific, actionable optimization tips

Respond with valid JSON only.`;
}

export const KEYWORD_EXTRACTION_PROMPT = `Extract all important keywords from this job description that should appear in an ATS-optimized resume.

Categories to extract:
- Technical skills (programming languages, tools, platforms)
- Soft skills (communication, leadership, etc.)
- Domain knowledge (industry-specific terms)
- Certifications and qualifications
- Action verbs relevant to the role

Return as a structured list grouped by category.`;
