'use client';

import { useEffect, useState } from 'react';

export function useSafeUser() {
  const [state, setState] = useState<{ user: any; isLoaded: boolean; error: string | null }>({ user: null, isLoaded: false, error: null });

  useEffect(() => {
    let active = true;
    import('@clerk/nextjs')
      .then(({ useUser }) => {
        if (!active) return;
        const tmp = document.createElement('div');
        void tmp;
        try {
          const result = useUser();
          setState({ user: result.user ?? null, isLoaded: result.isLoaded, error: null });
        } catch {
          setState({ user: null, isLoaded: true, error: 'clerk_unavailable' });
        }
      })
      .catch(() => {
        if (active) setState({ user: null, isLoaded: true, error: 'clerk_unavailable' });
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
