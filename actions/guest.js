"use server";

import { db } from "@/lib/prisma";

/**
 * Pre-seeds the guest user with demo profile data after their first Clerk sign-in.
 * Called once after guest login so the dashboard/features work immediately.
 *
 * @param {string} clerkUserId — the real Clerk user ID assigned to the guest account
 */
export async function seedGuestProfile(clerkUserId) {
  if (!clerkUserId) return { success: false };

  const user = await db.user.findUnique({
    where: { clerkUserId },
  });

  if (!user) return { success: false };

  // Only seed if the user hasn't been onboarded yet (no industry set)
  if (user.industry) return { success: true, alreadySeeded: true };

  await db.user.update({
    where: { clerkUserId },
    data: {
      industry: "Technology-software-development",
      experience: 3,
      bio: "Demo account — exploring CraftedPath features.",
      skills: ["JavaScript", "React", "Node.js", "TypeScript", "Next.js"],
    },
  });

  return { success: true };
}
