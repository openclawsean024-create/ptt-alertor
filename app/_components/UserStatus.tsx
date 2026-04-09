'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

interface UserStatusProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireGuest?: boolean;
  redirectTo?: string;
}

/**
 * Client-only auth check component.
 * Avoids SSR issues by only running auth logic after mount (useEffect).
 * Clerk is only accessed here (in a 'use client' component with dynamic import from parent).
 */
export default function UserStatus({
  children,
  requireAuth = false,
  requireGuest = false,
  redirectTo = '/sign-in',
}: UserStatusProps) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (requireAuth && !user) {
      router.push(`${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (requireGuest && user) {
      router.push('/dashboard');
      return;
    }

    setReady(true);
  }, [isLoaded, user, requireAuth, requireGuest, redirectTo, router]);

  if (!ready) {
    // Show nothing while auth state is being determined
    return null;
  }

  return <>{children}</>;
}
