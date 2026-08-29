import { PlayerProgress } from '@/types/player';
import { resolveSeekTarget, toDurationMs } from '../playback-policy';
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

      const target = resolveSeekTarget(ms, toDurationMs(player.getDuration()), progress.durationMs);
      if (!target) return;

      player.seekTo(target.positionMs / 1000, true);
      setProgress((prev) => ({ ...prev, ...target }));
    },
    [progress.durationMs],
  );

  return {
    getTimeSec,
    onTickMs,
    seekToMs,
  };
}
