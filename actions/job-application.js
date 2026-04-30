"use server";

import { withAuth } from "@/lib/middleware/auth";
import { JobApplicationService } from "@/lib/services/job-application-service";
import { revalidatePath } from "next/cache";

export async function getJobApplications() {
  return withAuth((user) => JobApplicationService.getAll(user.id));
}

export async function createJobApplication(data) {
  return withAuth(async (user) => {
    const app = await JobApplicationService.create(user.id, data);
    revalidatePath("/job-tracker");
    return app;
  });
}

export async function updateJobApplication(id, data) {
  return withAuth(async (user) => {
    const app = await JobApplicationService.update(id, user.id, data);
    revalidatePath("/job-tracker");
    return app;
  });
}

export async function deleteJobApplication(id) {
  return withAuth(async (user) => {
    await JobApplicationService.delete(id, user.id);
    revalidatePath("/job-tracker");
  });
}

export async function getJobStatusSummary() {
  return withAuth((user) => JobApplicationService.getStatusSummary(user.id));
}
