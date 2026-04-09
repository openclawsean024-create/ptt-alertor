import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

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

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/history/:path*', '/settings/:path*', '/subscribe/:path*'],
};
