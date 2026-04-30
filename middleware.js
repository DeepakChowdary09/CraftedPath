import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define protected routes using createRouteMatcher
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/resume(.*)",
  "/interview(.*)",
  "/ai-cover-letter(.*)",
  "/onboarding(.*)",
]);

// Rate limiting for AI endpoints
// Simple in-memory store (consider Redis for production with multiple instances)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute

/**
 * Check if request should be rate limited
 * @param {string} identifier - IP address or user ID
 * @returns {boolean} - true if rate limited
 */
function isRateLimited(identifier) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  // Clean old entries
  for (const [key, data] of rateLimitMap.entries()) {
    if (data.timestamp < windowStart) {
      rateLimitMap.delete(key);
    }
  }

  // Check current request count
  const currentData = rateLimitMap.get(identifier);
  if (!currentData || currentData.timestamp < windowStart) {
    rateLimitMap.set(identifier, { count: 1, timestamp: now });
    return false;
  }

  if (currentData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  currentData.count += 1;
  return false;
}

// Middleware to handle Clerk authentication, route protection, and rate limiting
export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Redirect unauthenticated users to the sign-in page for protected routes
  if (!userId && isProtectedRoute(req)) {
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }

  // Rate limiting for AI-related API calls
  const isAIRelatedEndpoint = req.nextUrl.pathname.match(
    /\/(interview|ai-cover-letter|resume)\/.*(?:generate|improve)/
  );

  if (isAIRelatedEndpoint && userId) {
    if (isRateLimited(userId)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again in a minute." },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
});

// Middleware configuration to skip static files and always run for API routes
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
