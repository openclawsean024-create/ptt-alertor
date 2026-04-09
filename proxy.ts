/**
 * Proxy (successor to middleware.ts in Next.js 16 / @clerk/nextjs v7)
 * Protects routes that require authentication via Clerk.
 * Gracefully degrades when Clerk is not configured — allows all requests through.
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/api/alerts(.*)',
  '/api/subscriptions(.*)',
  '/api/boards(.*)',
  '/api/settings(.*)',
  '/dashboard(.*)',
  '/subscribe(.*)',
  '/history(.*)',
  '/settings(.*)',
]);

export default function middleware(req: NextRequest) {
  // Guard: if Clerk publishable key is not set, skip auth entirely
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return NextResponse.next();
  }

  try {
    // @ts-expect-error – clerkMiddleware accepts async function in @clerk/nextjs/server
    return clerkMiddleware(async (auth, req: NextRequest) => {
      if (isProtectedRoute(req)) {
        await auth.protect();
      }
    })(req);
  } catch {
    // Clerk threw (misconfigured or edge runtime issue) — allow request through
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
