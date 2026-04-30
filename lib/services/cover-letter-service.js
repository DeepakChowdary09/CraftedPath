import { CoverLetterQueries } from "@/lib/db/queries";
import { generateCoverLetter as generateCoverLetterAI } from "@/lib/ai/coverLetter";
import { logger } from "@/lib/utils/logger";

export const CoverLetterService = {
  async generate(user, data) {
    const coverLetterData = {
      jobTitle: data.jobTitle,
      companyName: data.companyName,
      jobDescription: data.jobDescription,
      candidateIndustry: data.industry || user.industry || "Not specified",
      candidateExperience: data.experience ?? user.experience ?? "Not specified",
      candidateSkills:
        user.skills?.length > 0 ? user.skills.join(", ") : "Not specified",
      candidateBio: user.bio || "Not provided",
    };

    const result = await generateCoverLetterAI(coverLetterData);

    if (!result.success) {
      logger.error(
        "Cover letter generation failed",
        new Error(result.error),
        { operation: "generateCoverLetter", companyName: data.companyName, jobTitle: data.jobTitle }
      );
      throw new Error(result.error || "Failed to generate cover letter");
    }

    return CoverLetterQueries.create({
      content: result.data,
      jobDescription: data.jobDescription,
      companyName: data.companyName,
      jobTitle: data.jobTitle,
      userId: user.id,
    });
  },

  async getAll(userId) {
    return CoverLetterQueries.getManyByUserId(userId);
  },

  async getById(id, userId) {
    return CoverLetterQueries.getByIdAndUserId(id, userId);
  },

  async delete(id, userId) {
    return CoverLetterQueries.deleteByIdAndUserId(id, userId);
  },
};
