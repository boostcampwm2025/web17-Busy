'use client';

import { useEffect } from 'react';

export function usePlayerTick(enabled: boolean, getTimeSec: () => number, onTickMs: (ms: number) => void, intervalMs = 250) {
  useEffect(() => {
    if (!enabled) return;

    const id = window.setInterval(() => {
      const t = getTimeSec();
      if (t >= 0) onTickMs(Math.floor(t * 1000));
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [enabled, getTimeSec, onTickMs, intervalMs]);
}
