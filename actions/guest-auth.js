"use server";

import { createGuestSession, destroyGuestSession } from "@/lib/auth/guest-session";
import { db, ensureDatabaseConnection } from "@/lib/prisma";

const LOGIN_EMAIL = process.env.GUEST_LOGIN_EMAIL || process.env.NEXT_PUBLIC_GUEST_EMAIL;
const LOGIN_PASSWORD = process.env.GUEST_LOGIN_PASSWORD || process.env.NEXT_PUBLIC_GUEST_PASSWORD;
const GUEST_USER_ID = "guest-local";

function normalize(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function guestLogin(formData) {
  if (!LOGIN_EMAIL || !LOGIN_PASSWORD) {
    return {
      success: false,
      error: "Guest login is not configured. Set GUEST_LOGIN_EMAIL and GUEST_LOGIN_PASSWORD in your environment.",
    };
  }

  const email = normalize(formData.get("email"));
  const password = formData.get("password");
  const redirectTo = formData.get("redirectTo") || "/dashboard";

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  const expectedEmail = normalize(LOGIN_EMAIL);
  const expectedPassword = LOGIN_PASSWORD;

  if (email !== expectedEmail || password !== expectedPassword) {
    return { success: false, error: "Invalid email or password." };
  }

  await ensureDatabaseConnection();

  await db.user.upsert({
    where: { email: LOGIN_EMAIL },
    create: {
      email: LOGIN_EMAIL,
      clerkUserId: GUEST_USER_ID,
      name: "Guest User",
      imageUrl: null,
      skills: [],
    },
    update: {
      name: "Guest User",
    },
  });

  await createGuestSession({ email: LOGIN_EMAIL });

  return { success: true, redirectTo };
}

export async function guestLogout() {
  await destroyGuestSession();
  return { success: true };
}
