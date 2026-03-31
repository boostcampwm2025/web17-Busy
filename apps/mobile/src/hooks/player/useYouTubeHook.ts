import { useCallback, useEffect, useRef, useState } from 'react';
import type { YoutubeIframeRef } from 'react-native-youtube-iframe';
import { PLAYER_STATES } from 'react-native-youtube-iframe';
import { usePlayerStore } from '@/src/stores';

const TICK_INTERVAL_MS = 250;

export function useYouTubeHook() {
  const playerRef = useRef<YoutubeIframeRef>(null);

  const queueLength = usePlayerStore((s) => s.queue.length);
  const playNext = usePlayerStore((s) => s.playNext);
  const setPlayError = usePlayerStore((s) => s.setPlayError);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);

  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [isTicking, setIsTicking] = useState(false);

  const queueLengthRef = useRef(queueLength);
  useEffect(() => {
    queueLengthRef.current = queueLength;
  }, [queueLength]);

  // 250ms마다 현재 재생 위치 폴링
  useEffect(() => {
    if (!isTicking) return;

    const timer = setInterval(async () => {
      const player = playerRef.current;
      if (!player) return;
      try {
        const sec = await player.getCurrentTime();
        setPositionMs(Math.floor(sec * 1000));
      } catch {
        // 플레이어 아직 준비 안 됐을 때 무시
      }
    }, TICK_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isTicking]);

  const onReady = useCallback(async () => {
    const player = playerRef.current;
    if (!player) return;
    try {
      const sec = await player.getDuration();
      if (sec > 0) setDurationMs(Math.floor(sec * 1000));
    } catch {
      // 무시
    }
  }, []);

  const onChangeState = useCallback(
    async (state: PLAYER_STATES) => {
      const player = playerRef.current;

      if (state === PLAYER_STATES.PLAYING) {
        setIsTicking(true);
        setIsPlaying(true); // YouTube 실제 상태 → store 동기화
        // duration 갱신
        if (player) {
          try {
            const sec = await player.getDuration();
            if (sec > 0) setDurationMs(Math.floor(sec * 1000));
          } catch {
            // 무시
          }
        }
      } else if (state === PLAYER_STATES.PAUSED) {
        setIsTicking(false);
        setIsPlaying(false); // YouTube 실제 상태 → store 동기화
      } else if (state === PLAYER_STATES.BUFFERING) {
        setIsTicking(false);
        // BUFFERING은 isPlaying 건드리지 않음 (재생 의도 유지)
      } else if (state === PLAYER_STATES.ENDED) {
        setIsTicking(false);
        if (queueLengthRef.current <= 1) {
          // 1곡이면 처음부터 다시
          player?.seekTo(0, true);
        } else {
          playNext();
        }
      } else {
        setIsTicking(false);
      }
    },
    [playNext, setIsPlaying],
  );

  const onError = useCallback(
    (error: string) => {
      setPlayError(`YouTube 재생 오류: ${error}`);
      setIsTicking(false);
    },
    [setPlayError],
  );

  const seekToMs = useCallback((ms: number) => {
    playerRef.current?.seekTo(ms / 1000, true);
    setPositionMs(ms);
  }, []);

  return { playerRef, positionMs, durationMs, seekToMs, onReady, onChangeState, onError };
}
