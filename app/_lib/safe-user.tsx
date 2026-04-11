'use client';

import { useSession } from 'next-auth/react';

export function useSafeUser() {
  const { data: session, status } = useSession();
  const user = session?.user
    ? {
        id: session.user.id,
        emailAddresses: [{ emailAddress: session.user.email || '' }],
      }
    : null;

  return {
    user,
    isLoaded: status !== 'loading',
    error: null,
  };
}
