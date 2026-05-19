import "server-only";

import { cookies } from "next/headers";

const SESSION_COOKIE = "guest-auth";

function encodeSession(payload) {
  return encodeURIComponent(JSON.stringify(payload));
}

function decodeSession(value) {
  try {
    return JSON.parse(decodeURIComponent(value));
  } catch (error) {
    console.error("Failed to decode guest session cookie:", error);
    return null;
  }
}

export function getGuestSession() {
  let cookieStore;
  try {
    cookieStore = cookies();
  } catch (error) {
    console.warn("guest-session cookies() unavailable:", error);
    return null;
  }

  if (!cookieStore || typeof cookieStore.get !== "function") {
    return null;
  }

  const cookie = cookieStore.get(SESSION_COOKIE);
  if (!cookie || !cookie.value) return null;
  return decodeSession(cookie.value);
}

export async function createGuestSession(session) {
  "use server";

  const cookieStore = cookies();
  if (!cookieStore || typeof cookieStore.set !== "function") {
    throw new Error("Unable to set guest session cookie in this context");
  }

  cookieStore.set(SESSION_COOKIE, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function destroyGuestSession() {
  "use server";
  const cookieStore = cookies();
  if (!cookieStore || typeof cookieStore.delete !== "function") {
    return;
  }
  cookieStore.delete(SESSION_COOKIE);
}
