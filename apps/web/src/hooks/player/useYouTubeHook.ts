'use client';

import { usePlayerStore } from '@/stores';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PlayerProgress } from '@/types';
import { MusicProvider } from '@repo/dto/values';
import { clamp01, clampMs } from '@/utils';
import { DEFAULT_VOLUME, YOUTUBE_PLAYER_TICK_INTERVAL_MS } from '@/constants';
import { usePlayerTick, useYouTubePlayer, useYouTubeSync } from './youtube';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function useYouTubeHook() {
  const [progress, setProgress] = useState<PlayerProgress>({ positionMs: 0, durationMs: 0 });
  const [isTicking, setIsTicking] = useState(false);

  /**
   * 플레이어 인스턴스 생성
   * 생성 시 이벤트 핸들러 등록
   */
  const { containerRef, playerRef, ready } = useYouTubePlayer({ setProgress, setIsTicking });

  /**
   * volume 동기화
   * video 교체
   * 에러메시지 초기화
   * 재생/일시정지 제어
   */
  useYouTubeSync({ playerRef, ready, setProgress });

  // durationMs, positionMs 동기화
  const getTimeSec = useCallback(() => playerRef.current?.getCurrentTime() ?? -1, []);
  const onTickMs = useCallback((ms: number) => {
    setProgress((prev) => ({ ...prev, positionMs: ms }));
  }, []);

  usePlayerTick(isTicking, getTimeSec, onTickMs, YOUTUBE_PLAYER_TICK_INTERVAL_MS);

  const seekToMs = useCallback(
    (ms: number) => {
      const player = playerRef.current;
      if (!player) return;

      const rawDuration = player.getDuration();
      const metaMs = rawDuration > 0 ? Math.floor(rawDuration * 1000) : 0;
      const maxMs = metaMs > 0 ? metaMs : progress.durationMs;

      if (maxMs <= 0) return;

      const nextMs = clampMs(ms, maxMs);
      player.seekTo(nextMs / 1000, true);

      setProgress((prev) => ({ ...prev, positionMs: nextMs, durationMs: maxMs || prev.durationMs }));
    },
    [progress.durationMs],
  );

  return {
    containerRef,
    ...progress,
    seekToMs,
  };
}
