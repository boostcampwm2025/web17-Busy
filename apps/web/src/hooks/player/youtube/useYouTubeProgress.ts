'use client';

import { PlayerProgress } from '@/types';
import { clampMs } from '@/utils';
import { useCallback } from 'react';

type Props = {
  progress: PlayerProgress;
  playerRef: React.RefObject<YT.Player | null>;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
};

export function useYouTubeProgress({ progress, playerRef, setProgress }: Props) {
  const getTimeSec = useCallback(() => playerRef.current?.getCurrentTime() ?? -1, []);

  const onTickMs = useCallback((ms: number) => {
    setProgress((prev) => ({ ...prev, positionMs: ms }));
  }, []);

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
    getTimeSec,
    onTickMs,
    seekToMs,
  };
}
