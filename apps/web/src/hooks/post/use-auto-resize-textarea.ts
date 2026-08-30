'use client';

import { useEffect, useRef } from 'react';

type Options = { maxHeightPx?: number };

export default function useAutoResizeTextarea(value: string, { maxHeightPx = 120 }: Options = {}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, maxHeightPx)}px`;
  }, [value, maxHeightPx]);

  return ref;
}
