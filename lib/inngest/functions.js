import { generateJSON } from "@/lib/ai/client";
import { db } from "@/lib/prisma";
import { inngest } from "./client";
import { insightsCache } from "@/lib/cache/insights-cache";

// ── Original: Refresh industry insights weekly ───────────────────────────────

export const generateIndustryInsights = inngest.createFunction(
  { name: "Generate Industry Insights", id: "generate-industry-insights" },
  { cron: "0 0 * * 0" },
  async ({ event, step }) => {
    const industries = await step.run("Fetch industries", async () => {
      return await db.industryInsights.findMany({
        select: { industry: true },
      });
    });

    for (const { industry } of industries) {
      try {
        const prompt = `Return ONLY valid JSON for the ${industry} industry. No extra text.
{"salaryRanges":[{"role":"string","min":0,"max":0,"median":0,"location":"string"}],"growthRate":0,"demandLevel":"High","topSkills":["skill"],"marketOutlook":"Positive","keyTrends":["trend"],"recommendedSkills":["skill"]}
Rules: 5 roles in salaryRanges, growthRate is a number, 5 items each in topSkills/keyTrends/recommendedSkills, demandLevel one of High/Medium/Low, marketOutlook one of Positive/Neutral/Negative.`;

        const insights = await step.run(
          `Generate insights for ${industry}`,
          async () => generateJSON(prompt)
        );

        await step.run(`Update ${industry} insights`, async () => {
          await db.industryInsights.update({
            where: { industry },
            data: {
              ...insights,
              lastUpdated: new Date(),
              nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });
          insightsCache.invalidate(industry);
        });
      } catch (industryError) {
        console.error(`Failed to process industry ${industry}:`, industryError.message);
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
);

// ── NEW: Weekly Career Agent — multi-step planning ───────────────────────────

export const weeklyCareerAgent = inngest.createFunction(
  { name: "Weekly Career Agent", id: "weekly-career-agent" },
  { cron: "0 1 * * 1" }, // Every Monday at 1 AM
  async ({ step }) => {
    // Get all users who have completed onboarding (have industry set)
    const users = await step.run("fetch-users", async () => {
      return db.user.findMany({
        where: { industry: { not: null } },
        select: { id: true, industry: true, skills: true, name: true, experience: true },
      });
    });

    for (const user of users) {
      try {
        // Step 1: Gather context
        const context = await step.run(`gather-context-${user.id}`, async () => {
          const [resume, assessments, insights, recentAgentRuns] = await Promise.all([
            db.resume.findUnique({ where: { userId: user.id }, select: { content: true, atsScore: true, Feedback: true } }),
            db.assessments.findMany({
              where: { userId: user.id },
              orderBy: { createdAt: "desc" },
              take: 10,
              select: { quizScore: true, createdAt: true, improvementTip: true, category: true },
            }),
            db.industryInsights.findUnique({
              where: { industry: user.industry },
              select: { topSkills: true, recommendedSkills: true, keyTrends: true, demandLevel: true },
            }),
            db.agentRun.findMany({
              where: { userId: user.id },
              orderBy: { createdAt: "desc" },
              take: 5,
              select: { agentType: true, createdAt: true, status: true },
            }),
          ]);

          return {
            userId: user.id,
            industry: user.industry,
            skills: user.skills || [],
            experience: user.experience,
            hasResume: !!resume?.content,
            atsScore: resume?.atsScore || null,
            resumeFeedback: resume?.Feedback || null,
            quizScores: assessments.map((a) => ({ score: a.quizScore, date: a.createdAt, tip: a.improvementTip })),
            industryTopSkills: insights?.topSkills || [],
            industryRecommendedSkills: insights?.recommendedSkills || [],
            industryTrends: insights?.keyTrends || [],
            demandLevel: insights?.demandLevel || "Medium",
            recentAgentActivity: recentAgentRuns.length,
          };
        });

        // Step 2: Analyze progress
        const analysis = await step.run(`analyze-progress-${user.id}`, async () => {
          const prompt = `You are a career advisor. Analyze this user's weekly progress and return ONLY valid JSON.

User: ${user.name || "User"}, Industry: ${context.industry}, Experience: ${context.experience || "not specified"} years
Skills: ${context.skills.join(", ") || "none listed"}
Has resume: ${context.hasResume}, ATS score: ${context.atsScore || "not scored"}
Resume feedback: ${context.resumeFeedback || "none"}

Interview quiz scores (newest first): ${JSON.stringify(context.quizScores.map((s) => s.score))}
Industry top skills: ${context.industryTopSkills.join(", ")}
Industry recommended skills: ${context.industryRecommendedSkills.join(", ")}
Industry trends: ${context.industryTrends.join(", ")}
Demand level: ${context.demandLevel}

Return JSON:
{
  "readinessScore": <0-100>,
  "trend": "improving|stagnating|declining",
  "trendReason": "<why>",
  "stagnatingAreas": ["<area>"],
  "strengths": ["<area>"]
}`;

          return generateJSON(prompt);
        });

        // Step 3: Generate personalized weekly plan
        const plan = await step.run(`generate-plan-${user.id}`, async () => {
          const prompt = `You are a career coach. Based on this analysis, create a specific weekly action plan. Return ONLY valid JSON.

Readiness score: ${analysis.readinessScore}/100
Trend: ${analysis.trend} (${analysis.trendReason})
Stagnating areas: ${(analysis.stagnatingAreas || []).join(", ") || "none"}
Strengths: ${(analysis.strengths || []).join(", ") || "none"}
User skills: ${context.skills.join(", ") || "none"}
Industry: ${context.industry}
ATS score: ${context.atsScore || "not scored"}
Has resume: ${context.hasResume}

Return JSON:
{
  "skillFocus": [
    { "skill": "<specific skill>", "action": "<what to do this week>", "resource": "<course/article/project suggestion>" }
  ],
  "resumeTips": [
    { "tip": "<specific improvement>", "priority": "high|medium" }
  ],
  "interviewFocus": "<specific interview topic or question type to drill>",
  "weeklyChallenge": "<one concrete thing to accomplish this week>"
}

Rules: exactly 3 items in skillFocus, exactly 2 items in resumeTips, 1 interviewFocus string.`;

          return generateJSON(prompt);
        });

        // Step 4: Save to DB
        await step.run(`update-db-${user.id}`, async () => {
          const weekOf = getStartOfWeek();

          await db.weeklyAgentPlan.upsert({
            where: { userId_weekOf: { userId: user.id, weekOf } },
            create: {
              userId: user.id,
              weekOf,
              readinessScore: analysis.readinessScore ?? 0,
              skillFocus: plan.skillFocus || [],
              resumeTips: plan.resumeTips || [],
              interviewFocus: plan.interviewFocus || "",
              rawAgentOutput: JSON.stringify({ analysis, plan }),
            },
            update: {
              readinessScore: analysis.readinessScore ?? 0,
              skillFocus: plan.skillFocus || [],
              resumeTips: plan.resumeTips || [],
              interviewFocus: plan.interviewFocus || "",
              rawAgentOutput: JSON.stringify({ analysis, plan }),
            },
          });

          // Also log as an AgentRun for the audit trail
          await db.agentRun.create({
            data: {
              userId: user.id,
              agentType: "WEEKLY_CAREER",
              status: "completed",
              inputSummary: `Weekly plan for ${context.industry} professional`,
              outputSummary: `Readiness: ${analysis.readinessScore}/100, trend: ${analysis.trend}, focus: ${plan.interviewFocus}`,
              toolCallLog: [
                { call: "gather-context", args: {}, result: { quizCount: context.quizScores.length, hasResume: context.hasResume } },
                { call: "analyze-progress", args: {}, result: { readinessScore: analysis.readinessScore, trend: analysis.trend } },
                { call: "generate-plan", args: {}, result: { skillCount: plan.skillFocus?.length, tipCount: plan.resumeTips?.length } },
              ],
            },
          });
        });

        // Step 5: Log summary
        await step.run(`notify-${user.id}`, async () => {
          console.log(
            `[WeeklyCareerAgent] ${user.name || user.id}: readiness=${analysis.readinessScore}, trend=${analysis.trend}, focus=${plan.interviewFocus}`
          );
        });
      } catch (err) {
        console.error(`[WeeklyCareerAgent] Failed for user ${user.id}:`, err.message);
      }
    }
  }
);

/** Get the Monday 00:00 of the current week (UTC). */
function getStartOfWeek() {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = 1
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diff));
  return monday;
}
