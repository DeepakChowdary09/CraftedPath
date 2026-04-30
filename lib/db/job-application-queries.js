import { db } from "@/lib/prisma";

export const JobApplicationQueries = {
  getManyByUserId: (userId) =>
    db.jobApplication.findMany({
      where: { userId },
      orderBy: { appliedAt: "desc" },
    }),

  getByIdAndUserId: (id, userId) =>
    db.jobApplication.findUnique({ where: { id, userId } }),

  create: (data) =>
    db.jobApplication.create({ data }),

  update: (id, userId, data) =>
    db.jobApplication.update({ where: { id, userId }, data }),

  delete: (id, userId) =>
    db.jobApplication.delete({ where: { id, userId } }),

  countByStatus: (userId) =>
    db.jobApplication.groupBy({
      by: ["status"],
      where: { userId },
      _count: { status: true },
    }),
};
