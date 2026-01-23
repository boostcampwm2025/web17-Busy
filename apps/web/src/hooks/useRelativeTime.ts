'use client';

import { useEffect, useState } from 'react';
import { formatRelativeTime, type FutureMode } from '@/utils/time';

type Options = {
  /** TZ 없는 문자열을 UTC로 볼지 */
  assumeUtcWhenNoTz?: boolean;
  /** 미래 시간이 들어왔을 때 처리 */
  futureMode?: FutureMode;
  /** 표시 갱신 주기(기본 60초) */
  tickMs?: number;
};

/**
 * useRelativeTime
 * - CSR에서만 상대시간 텍스트 생성
 * - tickMs로 "방금 전 → 1분 전" 같은 변화 반영
 */
export function useRelativeTime(iso: string, options: Options = {}) {
  const { assumeUtcWhenNoTz = false, futureMode = 'just-now', tickMs = 60_000 } = options;

  const [text, setText] = useState(''); // SSR/hydration 안전하게 빈값 시작

  useEffect(() => {
    let alive = true;

    const update = () => {
      if (!alive) return;
      setText(formatRelativeTime(iso, assumeUtcWhenNoTz, futureMode));
    };

    update();

    const timer = window.setInterval(update, tickMs);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [iso, assumeUtcWhenNoTz, futureMode, tickMs]);

  return text;
}
