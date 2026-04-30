import { db } from "@/lib/prisma";
import { UserQueries, IndustryInsightsQueries } from "@/lib/db/queries";
import { generateIndustryInsights } from "@/lib/ai/industry";
import { insightsCache } from "@/lib/cache/insights-cache";

const INSIGHTS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

const insightsRefreshInFlight = new Map();

export const UserService = {
  async updateProfile(userId, data) {
    const user = await UserQueries.getByClerkId(userId);
    if (!user) throw new Error("User not found");

    const result = await db.$transaction(
      async (tx) => {
        let industryInsight = await tx.industryInsights.findUnique({
          where: { industry: data.industry },
        });

        if (!industryInsight) {
          const aiResult = await generateIndustryInsights(data.industry);
          if (!aiResult.success) {
            throw new Error(`AI service error: ${aiResult.error}`);
          }
          industryInsight = await tx.industryInsights.create({
            data: {
              industry: data.industry,
              ...aiResult.data,
              nextUpdate: new Date(Date.now() + INSIGHTS_TTL_MS),
            },
          });
        }

        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: {
            industry: data.industry,
            experience: data.experience,
            bio: data.bio,
            skills: data.skills,
          },
        });

        return { updatedUser, industryInsight };
      },
      { timeout: 10000 }
    );

    return { success: true, ...result };
  },

  async getOnboardingStatus(clerkUserId) {
    const user = await db.user.findUnique({
      where: { clerkUserId },
      select: { industry: true },
    });
    if (!user) throw new Error("User not found");
    return { isOnboarded: !!user.industry };
  },

  async getIndustryInsights(user) {
    if (!user.industry) throw new Error("User industry not set");

    const cached = insightsCache.get(user.industry);
    if (cached) return cached;

    const oneWeekFromNow = new Date(Date.now() + INSIGHTS_TTL_MS);

    let insight = await IndustryInsightsQueries.getByIndustry(user.industry);

    if (!insight) {
      const result = await generateIndustryInsights(user.industry);
      if (!result.success) throw new Error(`AI service error: ${result.error}`);
      insight = await IndustryInsightsQueries.create({
        industry: user.industry,
        ...result.data,
        nextUpdate: oneWeekFromNow,
      });
      insightsCache.set(user.industry, insight);
      return insight;
    }

    if (insight.nextUpdate.getTime() < Date.now()) {
      if (!insightsRefreshInFlight.has(user.industry)) {
        const refreshPromise = (async () => {
          try {
            const result = await generateIndustryInsights(user.industry);
            if (!result.success) throw new Error(`AI service error: ${result.error}`);
            const updated = await IndustryInsightsQueries.update(user.industry, {
              ...result.data,
              nextUpdate: new Date(Date.now() + INSIGHTS_TTL_MS),
            });
            insightsCache.set(user.industry, updated);
            return updated;
          } finally {
            insightsRefreshInFlight.delete(user.industry);
          }
        })();
        insightsRefreshInFlight.set(user.industry, refreshPromise);
      }
      insight = await insightsRefreshInFlight.get(user.industry);
      return insight;
    }

    insightsCache.set(user.industry, insight);
    return insight;
  },
};
