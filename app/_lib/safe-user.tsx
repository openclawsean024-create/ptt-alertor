'use client';

import { useUser as useClerkUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

/**
 * Safe wrapper for useUser that gracefully handles missing ClerkProvider.
 * Returns null user when Clerk is not configured.
 */
export function useSafeUser() {
  try {
    const { user, isLoaded } = useClerkUser();
    return { user, isLoaded, error: null };
  } catch (err) {
    // ClerkProvider not present — treat as unloaded with no user
    return { user: null, isLoaded: true, error: 'clerk_unavailable' };
  }
}
