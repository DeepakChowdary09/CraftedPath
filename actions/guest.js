"use server";

import { db } from "@/lib/prisma";

const GUEST_CLERK_ID = "guest_demo_user";
const GUEST_EMAIL = "guest@craftedpath.demo";
const GUEST_NAME = "Guest User";

/**
 * Returns (or creates) the shared guest demo user record.
 * This is intentionally a read-heavy, low-privilege path — the
 * guest user is pre-onboarded with demo data so every feature is
 * immediately explorable without a real Clerk session.
 */
export async function getOrCreateGuestUser() {
  let guest = await db.user.findUnique({
    where: { clerkUserId: GUEST_CLERK_ID },
  });

  if (!guest) {
    guest = await db.user.create({
      data: {
        clerkUserId: GUEST_CLERK_ID,
        email: GUEST_EMAIL,
        name: GUEST_NAME,
        industry: "Technology-software-development",
        experience: 3,
        bio: "Demo account — exploring CraftedPath features.",
        skills: ["JavaScript", "React", "Node.js", "TypeScript", "Next.js"],
      },
    });
  }

  return { success: true, userId: guest.clerkUserId };
}
