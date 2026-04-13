import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// All routes are public — auth is handled at the API level via NextAuth session.
// NEXT_PUBLIC_BYPASS_AUTH mode: safe-user.tsx returns a system user for no-auth operation.
export default function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // Match all routes except static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
