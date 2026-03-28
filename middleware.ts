import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publishableKey = process.env.CLERK_PUBLISHABLE_KEY;
const secretKey = process.env.CLERK_SECRET_KEY;

if (!publishableKey || !secretKey) {
  console.warn('[middleware] Clerk keys missing — running without auth (graceful degradation)');
}

const PROTECTED_PATHS = ['/dashboard', '/subscribe', '/history', '/api/subscriptions', '/api/alerts'];

function isProtectedRoute(req: NextRequest): boolean {
  const pathname = req.nextUrl.pathname;
  return PROTECTED_PATHS.some((path) => pathname.startsWith(path));
}

export default async function middleware(req: NextRequest) {
  // Graceful degradation: bypass auth when Clerk is not configured
  if (!publishableKey || !secretKey) {
    return NextResponse.next();
  }

  // Use Clerk middleware when keys are available
  const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server');
  const isProtected = createRouteMatcher([
    '/dashboard(.*)',
    '/subscribe(.*)',
    '/history(.*)',
    '/api/subscriptions(.*)',
    '/api/alerts(.*)',
  ]);

  return clerkMiddleware(
    async (authObj, request) => {
      if (isProtected(request)) {
        authObj.protect();
      }
    },
    { debug: false }
  )(req as NextRequest);
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
