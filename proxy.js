import { NextResponse } from "next/server";

const SESSION_COOKIE = "guest-auth";
const PROTECTED_PATTERNS = [
  /^\/dashboard(.*)/,
  /^\/resume(.*)/,
  /^\/interview(.*)/,
  /^\/ai-cover-letter(.*)/,
  /^\/onboarding(.*)/,
];

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

function isProtectedPath(pathname) {
  return PROTECTED_PATTERNS.some((pattern) => pattern.test(pathname));
}

// Middleware to handle guest authentication, route protection, and rate limiting
export default async function proxy(request) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE);

  if (isProtectedPath(pathname) && !sessionCookie) {
    const redirectUrl = new URL("/guest", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Rate limiting for AI-related API calls
  const isAIRelatedEndpoint = pathname.match(
    /\/(interview|ai-cover-letter|resume)\/.*(?:generate|improve)/
  );

  if (isAIRelatedEndpoint && sessionCookie) {
    const rateLimitKey = sessionCookie.value;
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again in a minute." },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

// Middleware configuration to skip static files and always run for API routes
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
