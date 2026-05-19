import { cookies } from "next/headers";
import { UserQueries } from "@/lib/db/queries";
import { ensureDatabaseConnection } from "@/lib/prisma";

const SESSION_COOKIE = "guest-auth";

function getSessionEmail() {
  let cookieStore;
  try {
    cookieStore = cookies();
  } catch (error) {
    console.warn("withAuth cookies() unavailable:", error);
    return null;
  }

  if (!cookieStore || typeof cookieStore.get !== "function") {
    return null;
  }

  const cookie = cookieStore.get(SESSION_COOKIE);
  if (!cookie || !cookie.value) return null;
  try {
    const decoded = JSON.parse(decodeURIComponent(cookie.value));
    return typeof decoded.email === "string" ? decoded.email : null;
  } catch {
    return null;
  }
}

/**
 * Higher-order function that wraps server actions with auth + user lookup.
 * Eliminates the repetitive auth boilerplate from every action.
 *
 * @param {(user: import('@prisma/client').User) => Promise<T>} callback
 * @returns {Promise<T>}
 * @throws {Error} Unauthorized | User not found
 */
export async function withAuth(callback) {
  const email = getSessionEmail();
  if (!email) throw new Error("Unauthorized");

  await ensureDatabaseConnection();
  const user = await UserQueries.getByEmail(email);
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
  const email = getSessionEmail();
  if (!email) throw new Error("Unauthorized");

  await ensureDatabaseConnection();
  const user = await UserQueries.getByEmail(email);
  if (!user) throw new Error("User not found");

  return user;
}
