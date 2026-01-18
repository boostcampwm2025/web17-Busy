'use client';

import { useEffect, useState } from 'react';
import { formatRelativeTime } from '@/utils/time';

export function useRelativeTime(iso: string) {
  const [text, setText] = useState(''); // SSR/초기 hydration 동일하게 빈값

  useEffect(() => {
    setText(formatRelativeTime(iso));
  }, [iso]);

  return text;
}
