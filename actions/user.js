"use server";

import { withAuth, requireAuth } from "@/lib/middleware/auth";
import { UserService } from "@/lib/services/user-service";

export async function updateUser(data) {
  return withAuth(async (user) => {
    try {
      return await UserService.updateProfile(user, data);
    } catch (error) {
      throw new Error("Failed to update profile: " + error.message);
    }
  });
}

export async function getUserOnboardingStatus() {
  const user = await requireAuth();
  try {
    return await UserService.getOnboardingStatus(user);
  } catch (error) {
    throw new Error("Failed to get user onboarding status: " + error.message);
  }
}
