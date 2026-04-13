'use client';

import { useSession } from 'next-auth/react';

export function useSafeUser() {
  const { data: session, status } = useSession();
  return {
    user: session?.user ?? null,
    isLoaded: status !== 'loading',
    error: null,
  };
}
