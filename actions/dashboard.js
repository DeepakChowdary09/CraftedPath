"use server";

import { withAuth } from "@/lib/middleware/auth";
import { UserService } from "@/lib/services/user-service";

export async function getIndustryInsights() {
  return withAuth((user) => UserService.getIndustryInsights(user));
}
