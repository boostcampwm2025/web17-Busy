'use client';

import { useEffect, useState } from 'react';
import { authMe } from '@/api';

type AuthMeState = {
  userId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

export function useAuthMe(): AuthMeState {
  const [state, setState] = useState<AuthMeState>({
    userId: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await authMe();
        if (!alive) return;
        setState({ userId: data.id, isAuthenticated: true, isLoading: false });
      } catch {
        if (!alive) return;
        setState({ userId: null, isAuthenticated: false, isLoading: false });
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return state;
}
