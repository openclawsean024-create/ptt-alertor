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

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Skip auth when Clerk is not configured (returns null userId gracefully)
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return NextResponse.next();
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
