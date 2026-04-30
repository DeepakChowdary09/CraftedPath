"use server";

import { withAuth } from "@/lib/middleware/auth";
import { db } from "@/lib/prisma";

export async function getSkillGap() {
  return withAuth(async (user) => {
    if (!user.industry) return { matched: [], missing: [], userSkills: [] };

    const insight = await db.industryInsights.findUnique({
      where: { industry: user.industry },
      select: { topSkills: true, recommendedSkills: true },
    });

    if (!insight) return { matched: [], missing: [], userSkills: user.skills };

    const allTargetSkills = [
      ...new Set([...insight.topSkills, ...insight.recommendedSkills]),
    ];
    const userSkillsLower = (user.skills ?? []).map((s) => s.toLowerCase());

    const matched = allTargetSkills.filter((s) =>
      userSkillsLower.includes(s.toLowerCase())
    );
    const missing = allTargetSkills.filter(
      (s) => !userSkillsLower.includes(s.toLowerCase())
    );

    return { matched, missing, userSkills: user.skills ?? [] };
  });
}
