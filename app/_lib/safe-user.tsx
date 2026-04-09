'use client';

import { useUser as useClerkUser } from '@clerk/nextjs';

/**
 * Safe wrapper for useUser that gracefully handles missing ClerkProvider.
 * Returns null user when Clerk is not configured.
 */
export function useSafeUser() {
  if (typeof window === 'undefined') {
    return { user: null, isLoaded: true, error: 'server_render' };
  }

  try {
    const { user, isLoaded } = useClerkUser();
    return { user, isLoaded, error: null };
  } catch {
    return { user: null, isLoaded: true, error: 'clerk_unavailable' };
  }
}
