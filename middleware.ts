import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/history(.*)',
  '/settings(.*)',
  '/subscribe(.*)',
  '/api/alerts(.*)',
  '/api/boards(.*)',
  '/api/settings(.*)',
  '/api/subscriptions(.*)',
  '/api/cron(.*)',
  '/api/stripe(.*)',
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
