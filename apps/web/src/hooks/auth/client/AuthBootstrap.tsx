'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores';
import { useAuthMe } from './useAuthMe';

export function AuthBootstrap() {
  const { userId, isAuthenticated, isLoading } = useAuthMe();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    setAuth({ userId, isAuthenticated });
    setLoading(isLoading);
  }, [userId, isAuthenticated, isLoading, setAuth, setLoading]);

  return null;
}
