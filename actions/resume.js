"use server";

import { withAuth } from "@/lib/middleware/auth";
import { ResumeService } from "@/lib/services/resume-service";
import { revalidatePath } from "next/cache";

export async function saveResume(content) {
  return withAuth(async (user) => {
    const resume = await ResumeService.save(user.id, content);
    revalidatePath("/resume");
    return resume;
  });
}

export async function getResume() {
  return withAuth((user) => ResumeService.get(user.id));
}

export async function improveWithAI({ current, type }) {
  return withAuth((user) => ResumeService.improveWithAI(user, { current, type }));
}
