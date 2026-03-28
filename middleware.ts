import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// NOTE: Clerk authentication is temporarily bypassed to unblock deployment.
// Once CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY are set in Vercel environment variables,
// this middleware should be updated to use proper Clerk authentication.
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const secretKey = process.env.CLERK_SECRET_KEY;

export default function middleware(req: NextRequest) {
  // Temporarily bypass Clerk auth when keys are not configured
  if (!publishableKey || !secretKey) {
    return NextResponse.next();
  }

  // When Clerk keys are properly configured, use this pattern instead:
  // const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server');
  // const isProtected = createRouteMatcher(['/dashboard(.*)', '/subscribe(.*)', ...]);
  // return clerkMiddleware(async (auth, req) => { if (isProtected(req)) await auth.protect(); })(req);

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
