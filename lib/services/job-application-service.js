import { JobApplicationQueries } from "@/lib/db/job-application-queries";

export const JobApplicationService = {
  async getAll(userId) {
    return JobApplicationQueries.getManyByUserId(userId);
  },

  async getById(id, userId) {
    return JobApplicationQueries.getByIdAndUserId(id, userId);
  },

  async create(userId, data) {
    return JobApplicationQueries.create({
      userId,
      companyName: data.companyName,
      position: data.position,
      status: data.status ?? "APPLIED",
      jobUrl: data.jobUrl ?? null,
      notes: data.notes ?? null,
      appliedAt: data.appliedAt ? new Date(data.appliedAt) : new Date(),
    });
  },

  async update(id, userId, data) {
    return JobApplicationQueries.update(id, userId, {
      companyName: data.companyName,
      position: data.position,
      status: data.status,
      jobUrl: data.jobUrl ?? null,
      notes: data.notes ?? null,
      appliedAt: data.appliedAt ? new Date(data.appliedAt) : undefined,
    });
  },

  async delete(id, userId) {
    return JobApplicationQueries.delete(id, userId);
  },

  async getStatusSummary(userId) {
    const counts = await JobApplicationQueries.countByStatus(userId);
    const summary = { APPLIED: 0, INTERVIEWING: 0, OFFERED: 0, REJECTED: 0, WITHDRAWN: 0 };
    for (const row of counts) {
      summary[row.status] = row._count.status;
    }
    return summary;
  },
};
