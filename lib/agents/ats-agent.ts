/**
 * ATS Agent
 * Scores resume for ATS compatibility and provides optimization suggestions
 */

import { callAIWithAgent } from "@/lib/ai/client";
import { 
  ATSScoreResultSchema, 
  type ATSScoreResult,
  type KeywordMatch 
} from "@/lib/schemas/agent-schemas";
import { buildATSPrompt } from "@/lib/prompts/ats/analyze";
import { initializeMemory, addAnalysisToMemory, getMemory } from "@/lib/memory/shared-memory";
import { agentLogger, emitAgentEvent } from "@/lib/observability/logger";

export interface ATSInput {
  userId: string;
  resumeContent: string;
  jobDescription: string;
  workflowId?: string;
  sessionId?: string;
}

export interface ATSOutput {
  success: boolean;
  result?: ATSScoreResult;
  error?: string;
  durationMs: number;
}

/**
 * Run the ATS Agent analysis
 */
export async function runATSAgent(input: ATSInput): Promise<ATSOutput> {
  const startTime = Date.now();
  const { userId, resumeContent, jobDescription, workflowId, sessionId } = input;

  const metrics = agentLogger.startMetrics("ats", userId, workflowId);

  try {
    emitAgentEvent({
      workflowId: workflowId || "standalone",
      agentType: "ats",
      step: "initialization",
      status: "started",
      message: "Initializing ATS Agent...",
    });

    agentLogger.info("ats", userId, "Starting ATS analysis", {
      resumeLength: resumeContent.length,
      jdLength: jobDescription.length,
    }, workflowId);

    // Get user context
    let memory = getMemory(userId, sessionId);
    if (!memory) {
      memory = await initializeMemory(userId, sessionId);
    }

    emitAgentEvent({
      workflowId: workflowId || "standalone",
      agentType: "ats",
      step: "keyword_extraction",
      status: "in_progress",
      message: "Extracting keywords from job description...",
    });

    const prompt = buildATSPrompt(resumeContent, jobDescription, {
      industry: memory.context.industry,
      previousScores: memory.context.previousATSScores,
    });

    emitAgentEvent({
      workflowId: workflowId || "standalone",
      agentType: "ats",
      step: "scoring",
      status: "in_progress",
      message: "Scoring resume sections and analyzing keywords...",
    });

    agentLogger.info("ats", userId, "Calling AI for ATS analysis", undefined, workflowId);

    const rawResult = await callAIWithAgent("ats", prompt, {
      json: true,
    });

    const parsedResult = ATSScoreResultSchema.parse(JSON.parse(rawResult.text));

    // Store analysis in memory
    addAnalysisToMemory(userId, {
      type: "ats",
      summary: `ATS Score: ${parsedResult.overallScore}/100. ${parsedResult.keywordAnalysis.missingKeywords.length} keywords missing.`,
      keyFindings: [
        `Section scores: Summary ${parsedResult.sectionScores.summary}%, Experience ${parsedResult.sectionScores.experience}%`,
        `Keywords: ${parsedResult.keywordAnalysis.matchedKeywords}/${parsedResult.keywordAnalysis.totalKeywords} matched`,
        `Readiness: ${parsedResult.recruiterReadiness}`,
      ],
    }, sessionId);

    emitAgentEvent({
      workflowId: workflowId || "standalone",
      agentType: "ats",
      step: "complete",
      status: "completed",
      message: `ATS analysis complete. Score: ${parsedResult.overallScore}/100`,
      metadata: { 
        score: parsedResult.overallScore,
        missingKeywords: parsedResult.keywordAnalysis.missingKeywords.length,
      },
    });

    const durationMs = Date.now() - startTime;
    agentLogger.completeMetrics(metrics, true);
    agentLogger.setProvider(metrics, "Gemini");

    agentLogger.info("ats", userId, `ATS analysis complete. Score: ${parsedResult.overallScore}`, {
      score: parsedResult.overallScore,
      missingKeywords: parsedResult.keywordAnalysis.missingKeywords.length,
      criticalIssues: parsedResult.issues.filter(i => i.severity === "critical").length,
    }, workflowId);

    return {
      success: true,
      result: parsedResult,
      durationMs,
    };

  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    agentLogger.error("ats", userId, "ATS analysis failed", error as Error, workflowId);
    agentLogger.completeMetrics(metrics, false, errorMessage);

    emitAgentEvent({
      workflowId: workflowId || "standalone",
      agentType: "ats",
      step: "error",
      status: "failed",
      message: `ATS analysis failed: ${errorMessage}`,
    });

    return {
      success: false,
      error: errorMessage,
      durationMs,
    };
  }
}

/**
 * Get keyword coverage statistics
 */
export function getKeywordCoverage(keywordMatches: KeywordMatch[]): {
  total: number;
  matched: number;
  missing: number;
  coverage: number;
  byCategory: Record<string, { total: number; matched: number }>;
} {
  const total = keywordMatches.length;
  const matched = keywordMatches.filter(k => k.found).length;
  const missing = total - matched;
  const coverage = total > 0 ? Math.round((matched / total) * 100) : 0;

  // Group by hypothetical category (could be extended)
  const byCategory: Record<string, { total: number; matched: number }> = {
    technical: { total: 0, matched: 0 },
    soft: { total: 0, matched: 0 },
    domain: { total: 0, matched: 0 },
  };

  keywordMatches.forEach(k => {
    // Simple heuristic for categorization
    const category = categorizeKeyword(k.keyword);
    byCategory[category].total++;
    if (k.found) byCategory[category].matched++;
  });

  return { total, matched, missing, coverage, byCategory };
}

function categorizeKeyword(keyword: string): "technical" | "soft" | "domain" {
  const softSkills = ["communication", "leadership", "teamwork", "collaboration", "problem-solving", 
    "analytical", "creative", "adaptable", "organized", "detail-oriented"];
  
  const lowerKeyword = keyword.toLowerCase();
  
  if (softSkills.some(s => lowerKeyword.includes(s))) {
    return "soft";
  }
  
  // Technical skills are typically tools, languages, frameworks
  if (/\b(?:javascript|python|java|react|node|aws|docker|kubernetes|sql|api|git)\b/i.test(keyword)) {
    return "technical";
  }
  
  return "domain";
}

/**
 * Format ATS result as markdown summary
 */
export function generateATSSummary(result: ATSScoreResult): string {
  let summary = `## ATS Score: ${result.overallScore}/100\n\n`;

  summary += `### Section Scores\n`;
  summary += `- 📋 Contact Info: ${result.sectionScores.contactInfo}%\n`;
  summary += `- 📝 Summary: ${result.sectionScores.summary}%\n`;
  summary += `- 💼 Experience: ${result.sectionScores.experience}%\n`;
  summary += `- 🎯 Skills: ${result.sectionScores.skills}%\n`;
  summary += `- 🎓 Education: ${result.sectionScores.education}%\n`;
  summary += `- 📄 Formatting: ${result.sectionScores.formatting}%\n\n`;

  const coverage = getKeywordCoverage(result.keywordAnalysis.keywordMatches);
  summary += `### Keyword Analysis\n`;
  summary += `- Matched: ${coverage.matched}/${coverage.total} (${coverage.coverage}%)\n`;
  summary += `- Missing: ${result.keywordAnalysis.missingKeywords.length > 0 
    ? result.keywordAnalysis.missingKeywords.slice(0, 10).join(", ") + (result.keywordAnalysis.missingKeywords.length > 10 ? "..." : "")
    : "None"}\n\n`;

  const criticalIssues = result.issues.filter(i => i.severity === "critical");
  const warnings = result.issues.filter(i => i.severity === "warning");

  if (criticalIssues.length > 0) {
    summary += `### 🚨 Critical Issues\n`;
    criticalIssues.forEach(issue => {
      summary += `- **${issue.section}:** ${issue.message}\n`;
      summary += `  *Fix:* ${issue.suggestion}\n`;
    });
    summary += "\n";
  }

  if (warnings.length > 0) {
    summary += `### ⚠️ Warnings\n`;
    warnings.slice(0, 5).forEach(issue => {
      summary += `- **${issue.section}:** ${issue.message}\n`;
    });
    summary += "\n";
  }

  const highPriorityTips = result.optimizationTips.filter(t => t.priority === "high");
  if (highPriorityTips.length > 0) {
    summary += `### 🔧 Top Optimization Tips\n`;
    highPriorityTips.slice(0, 3).forEach(tip => {
      summary += `**${tip.section}:**\n`;
      summary += `- Current: "${tip.current.slice(0, 100)}..."\n`;
      summary += `- Suggested: "${tip.suggested.slice(0, 100)}..."\n`;
      summary += `- Why: ${tip.reason}\n\n`;
    });
  }

  const readinessEmoji = result.recruiterReadiness === "ready" ? "✅" 
    : result.recruiterReadiness === "needs_work" ? "⚠️" 
    : "❌";
  summary += `### ${readinessEmoji} Recruiter Readiness: ${result.recruiterReadiness.replace("_", " ")}\n`;

  return summary;
}

/**
 * Check if resume is ATS-ready
 */
export function isATSReady(result: ATSScoreResult): boolean {
  return result.overallScore >= 70 && 
         result.recruiterReadiness === "ready" &&
         result.issues.filter(i => i.severity === "critical").length === 0;
}
