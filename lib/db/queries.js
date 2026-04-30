import { db } from "@/lib/prisma";

export const UserQueries = {
  getByClerkId: (clerkUserId) =>
    db.user.findUnique({ where: { clerkUserId } }),

  getByClerkIdWithIndustry: (clerkUserId) =>
    db.user.findUnique({
      where: { clerkUserId },
      select: { id: true, industry: true, skills: true },
    }),

  getByClerkIdWithInsights: (clerkUserId) =>
    db.user.findUnique({
      where: { clerkUserId },
      include: { industryInsights: true },
    }),

  getById: (id) =>
    db.user.findUnique({ where: { id } }),
};

export const AssessmentQueries = {
  getManyByUserId: (userId) =>
    db.assessments.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),

  create: (data) =>
    db.assessments.create({ data }),
};

export const ResumeQueries = {
  getByUserId: (userId) =>
    db.resume.findUnique({ where: { userId } }),

  upsert: (userId, content) =>
    db.resume.upsert({
      where: { userId },
      update: { content },
      create: { userId, content },
    }),
};

export const CoverLetterQueries = {
  getManyByUserId: (userId) =>
    db.coverLetter.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),

  getByIdAndUserId: (id, userId) =>
    db.coverLetter.findFirst({ where: { id, userId } }),

  create: (data) =>
    db.coverLetter.create({ data }),

  deleteByIdAndUserId: async (id, userId) => {
    const record = await db.coverLetter.findFirst({ where: { id, userId } });
    if (!record) throw new Error("Cover letter not found");
    return db.coverLetter.delete({ where: { id: record.id } });
  },
};

export const IndustryInsightsQueries = {
  getByIndustry: (industry) =>
    db.industryInsights.findUnique({ where: { industry } }),

  create: (data) =>
    db.industryInsights.create({ data }),

  update: (industry, data) =>
    db.industryInsights.update({ where: { industry }, data }),
};
