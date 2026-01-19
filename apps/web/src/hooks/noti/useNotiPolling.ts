'use client';

import { useNotiStore } from '@/stores/useNotiStore';
import { useEffect } from 'react';
import { useAuthMe } from '../auth/client/useAuthMe';

const NOTI_POLLING_INTERVAL_MS = 5000;

export default function useNotiPolling() {
  const updateNotis = useNotiStore((s) => s.updateNotis);
  const { isAuthenticated, isLoading } = useAuthMe();

  useEffect(() => {
    if (isAuthenticated && !isLoading) updateNotis();

    const timeout = setInterval(() => {
      if (isAuthenticated && !isLoading) updateNotis();
    }, NOTI_POLLING_INTERVAL_MS);

    return () => clearInterval(timeout);
  }, [isAuthenticated, isLoading, updateNotis]);
}
