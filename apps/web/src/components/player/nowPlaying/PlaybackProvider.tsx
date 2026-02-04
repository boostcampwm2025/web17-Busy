'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { usePlayback } from '@/hooks';

type PlaybackKind = 'youtube' | 'itunes';

type PlaybackRefsValue = {
  kind: PlaybackKind;
  containerRef: React.RefObject<HTMLDivElement | null> | null;
  seekToMs: (ms: number) => void;
};

type PlaybackProgressValue = {
  positionMs: number;
  durationMs: number;
};

const PlaybackRefsContext = createContext<PlaybackRefsValue | null>(null);
const PlaybackProgressContext = createContext<PlaybackProgressValue | null>(null);

export function PlaybackProvider({ children }: { children: React.ReactNode }) {
  const playback = usePlayback();

  // 거의 안 변하는 값들만(cover는 이것만 구독)
  const refsValue = useMemo<PlaybackRefsValue>(
    () => ({
      kind: playback.kind as PlaybackKind,
      containerRef: playback.kind === 'youtube' ? playback.containerRef : null,
      seekToMs: playback.seekToMs,
    }),
    [playback.kind, playback.seekToMs, playback.kind === 'youtube' ? playback.containerRef : null],
  );

  // tick으로 자주 변하는 값들만(progress는 이것만 구독)
  const progressValue = useMemo<PlaybackProgressValue>(
    () => ({
      positionMs: playback.positionMs,
      durationMs: playback.durationMs,
    }),
    [playback.positionMs, playback.durationMs],
  );

  return (
    <PlaybackRefsContext.Provider value={refsValue}>
      <PlaybackProgressContext.Provider value={progressValue}>{children}</PlaybackProgressContext.Provider>
    </PlaybackRefsContext.Provider>
  );
}

export function usePlaybackRefs() {
  const v = useContext(PlaybackRefsContext);
  if (!v) throw new Error('usePlaybackRefs must be used within PlaybackProvider');
  return v;
}

export function usePlaybackProgress() {
  const v = useContext(PlaybackProgressContext);
  if (!v) throw new Error('usePlaybackProgress must be used within PlaybackProvider');
  return v;
}
