import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publishableKey = process.env.CLERK_PUBLISHABLE_KEY;
const secretKey = process.env.CLERK_SECRET_KEY;

if (!publishableKey || !secretKey) {
  console.warn('[middleware] Clerk keys missing — running without auth (graceful degradation)');
}

const isProtectedRoute = (req: NextRequest) => {
  const pathname = req.nextUrl.pathname;
  return (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/subscribe') ||
    pathname.startsWith('/history') ||
    pathname.startsWith('/api/subscriptions') ||
    pathname.startsWith('/api/alerts')
  );
};

export default async function middleware(req: NextRequest) {
  // Graceful degradation: bypass auth when Clerk is not configured
  if (!publishableKey || !secretKey) {
    return NextResponse.next();
  }

  // Dynamically import Clerk only when configured
  try {
    const { auth } = await import('@clerk/nextjs/server');
    if (isProtectedRoute(req)) {
      auth().protect();
    }
  } catch (e) {
    console.error('[middleware] Clerk auth error:', e);
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
