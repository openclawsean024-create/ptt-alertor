'use client';

import { useUser as useClerkUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

/**
 * Safe wrapper for useUser that gracefully handles missing ClerkProvider.
 * Uses useEffect to avoid calling useClerkUser during SSR (which throws).
 * Returns null user when Clerk is not configured or during SSR.
 */
export function useSafeUser() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // During SSR or before client hydration: treat as unloaded with no user
    return { user: null, isLoaded: false, error: 'not_mounted' };
  }

  try {
    const { user, isLoaded } = useClerkUser();
    return { user, isLoaded, error: null };
  } catch (err) {
    // ClerkProvider not present — treat as unloaded with no user
    return { user: null, isLoaded: true, error: 'clerk_unavailable' };
  }
}
