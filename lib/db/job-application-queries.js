import { db } from "@/lib/prisma";

export const JobApplicationQueries = {
  getManyByUserId: (userId) =>
    db.jobApplication.findMany({
      where: { userId },
      orderBy: { appliedAt: "desc" },
    }),

  getByIdAndUserId: (id, userId) =>
    db.jobApplication.findFirst({ where: { id, userId } }),

  create: (data) =>
    db.jobApplication.create({ data }),

  update: async (id, userId, data) => {
    const record = await db.jobApplication.findFirst({ where: { id, userId } });
    if (!record) throw new Error("Job application not found");
    return db.jobApplication.update({ where: { id: record.id }, data });
  },

  delete: async (id, userId) => {
    const record = await db.jobApplication.findFirst({ where: { id, userId } });
    if (!record) throw new Error("Job application not found");
    return db.jobApplication.delete({ where: { id: record.id } });
  },

  countByStatus: (userId) =>
    db.jobApplication.groupBy({
      by: ["status"],
      where: { userId },
      _count: { status: true },
    }),
};
