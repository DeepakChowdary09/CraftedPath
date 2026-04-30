"use server";

import { auth } from "@clerk/nextjs/server";
import { requireAuth } from "@/lib/middleware/auth";
import { UserService } from "@/lib/services/user-service";

export async function updateUser(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    return await UserService.updateProfile(userId, data);
  } catch (error) {
    throw new Error("Failed to update profile: " + error.message);
  }
}

export async function getUserOnboardingStatus() {
  const userId = await requireAuth();
  try {
    return await UserService.getOnboardingStatus(userId);
  } catch (error) {
    throw new Error("Failed to get user onboarding status: " + error.message);
  }
}
