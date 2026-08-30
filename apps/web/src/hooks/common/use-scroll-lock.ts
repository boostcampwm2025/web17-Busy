'use client';

import { useEffect } from 'react';

export default function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prev;
    };
  }, [isLocked]);
}
