'use client';

import { useEffect, useState } from 'react';
import { authMe } from '@/api';

type AuthMeState = {
  isAuthenticated: boolean;
  isLoading: boolean;
};

export function useAuthMe(): AuthMeState {
  const [state, setState] = useState<AuthMeState>({
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        await authMe();
        if (!alive) return;
        setState({ isAuthenticated: true, isLoading: false });
      } catch {
        if (!alive) return;
        setState({ isAuthenticated: false, isLoading: false });
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return state;
}
