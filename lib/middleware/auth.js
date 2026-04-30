import { auth } from "@clerk/nextjs/server";
import { UserQueries } from "@/lib/db/queries";

/**
 * Higher-order function that wraps server actions with auth + user lookup.
 * Eliminates the repetitive auth boilerplate from every action.
 *
 * @param {(user: import('@prisma/client').User) => Promise<T>} callback
 * @returns {Promise<T>}
 * @throws {Error} Unauthorized | User not found
 */
export async function withAuth(callback) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await UserQueries.getByClerkId(userId);
  if (!user) throw new Error("User not found");

  return callback(user);
}

/**
 * Auth guard that only returns the Clerk userId without DB lookup.
 * Use when you only need the clerk ID, not the full user record.
 *
 * @returns {Promise<string>} clerkUserId
 */
export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}
