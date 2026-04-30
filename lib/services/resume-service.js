import { ResumeQueries } from "@/lib/db/queries";
import { improveResumeContent } from "@/lib/ai/resume";
import { logger } from "@/lib/utils/logger";

export const ResumeService = {
  async save(userId, content) {
    return ResumeQueries.upsert(userId, content);
  },

  async get(userId) {
    return ResumeQueries.getByUserId(userId);
  },

  async improveWithAI(user, { current, type }) {
    if (!current || typeof current !== "string")
      throw new Error("Invalid or missing 'current' parameter");
    if (!type || typeof type !== "string")
      throw new Error("Invalid or missing 'type' parameter");

    const industry = user.industry || "general";
    const result = await improveResumeContent(current, type, industry);

    if (!result.success) {
      logger.error(
        "Resume improvement failed",
        new Error(result.error),
        { operation: "improveWithAI", type, industry }
      );
      if (result.error?.includes("quota") || result.error?.includes("rate limit")) {
        throw new Error("AI service rate limit exceeded. Please try again later.");
      }
      throw new Error("Failed to improve content. Please try again.");
    }

    return result.data;
  },
};
