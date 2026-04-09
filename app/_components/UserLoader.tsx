'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const DynamicUserStatus = dynamic(() => import('./UserStatus'), { ssr: false });

interface UserLoaderProps {
  children: React.ReactNode;
  /** If true, redirect to /sign-in when user is not authenticated */
  requireAuth?: boolean;
  /** If true, redirect away when user IS authenticated (e.g., login page) */
  requireGuest?: boolean;
  /** Route to redirect to (default: /sign-in) */
  redirectTo?: string;
}

/**
 * Client-side auth-aware wrapper.
 * Handles redirect logic based on auth state, then renders children.
 * Uses next/dynamic (ssr:false) to avoid Clerk SSR issues.
 */
export default function UserLoader({
  children,
  requireAuth = false,
  requireGuest = false,
  redirectTo = '/sign-in',
}: UserLoaderProps) {
  return (
    <DynamicUserStatus
      requireAuth={requireAuth}
      requireGuest={requireGuest}
      redirectTo={redirectTo}
    >
      {children}
    </DynamicUserStatus>
  );
}
