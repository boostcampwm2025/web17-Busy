import { useCallback } from 'react';

import { PlayerProgress } from '@/types/player';
import { resolveSeekTarget, toDurationMs } from '../playback-policy';

type Props = {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  progress: PlayerProgress;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
};

/** 재생 위치 이동. YouTube의 use-youtube-progress에 대응한다(폴링은 timeupdate 이벤트가 대신해 불필요). */
export function useItunesProgress({ audioRef, progress, setProgress }: Props) {
  const seekToMs = useCallback(
    (ms: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      const target = resolveSeekTarget(ms, toDurationMs(audio.duration), progress.durationMs);
      if (!target) return;

      audio.currentTime = target.positionMs / 1000;

      // 즉시 UI 반영 (timeupdate 기다리지 않음)
      setProgress((prev) => ({ ...prev, ...target }));
    },
    [audioRef, setProgress, progress.durationMs],
  );

  return { seekToMs };
}
