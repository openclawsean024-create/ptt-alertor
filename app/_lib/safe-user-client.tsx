'use client';

import { useUser } from '@clerk/nextjs';

export default function SafeUserClient() {
  const { user, isLoaded } = useUser();
  return null;
}
