import { useCallback, useEffect, useRef, useState } from 'react';
import { PLAYER_STATES } from 'react-native-youtube-iframe';
import type { YoutubeIframeRef } from 'react-native-youtube-iframe';
import { MusicProvider } from '@repo/dto/values';
import { usePlayerStore } from '@/src/stores';

export function useYouTubeHook() {
  const playerRef = useRef<YoutubeIframeRef>(null);

  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentMusic = usePlayerStore((s) => s.currentMusic);
  const queue = usePlayerStore((s) => s.queue);
  const playNext = usePlayerStore((s) => s.playNext);
  const setPlayError = usePlayerStore((s) => s.setPlayError);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);

  const isYouTube = currentMusic?.provider === MusicProvider.YOUTUBE;

  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  const queueLengthRef = useRef(queue.length);
  useEffect(() => {
    queueLengthRef.current = queue.length;
  }, [queue.length]);

  // videoId 변경 시 진행 상태 초기화
  const videoId = isYouTube ? (currentMusic?.trackUri ?? null) : null;
  const prevVideoIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevVideoIdRef.current !== videoId) {
      prevVideoIdRef.current = videoId;
      setPositionMs(0);
      setDurationMs(0);
    }
  }, [videoId]);

  // YouTube가 아닌 트랙으로 전환 시 상태 초기화
  useEffect(() => {
    if (!isYouTube) {
      setPositionMs(0);
      setDurationMs(0);
    }
  }, [isYouTube]);

  // 250ms 폴링으로 positionMs / durationMs 갱신
  useEffect(() => {
    if (!isYouTube || !isPlaying) return;

    const timer = setInterval(async () => {
      const ref = playerRef.current;
      if (!ref) return;
      try {
        const [current, dur] = await Promise.all([ref.getCurrentTime(), ref.getDuration()]);
        setPositionMs(Math.floor(current * 1000));
        if (dur > 0) setDurationMs(Math.floor(dur * 1000));
      } catch {
        // 플레이어 아직 준비 안 됨 — 무시
      }
    }, 250);

    return () => clearInterval(timer);
  }, [isYouTube, isPlaying]);

  const onReady = useCallback(async () => {
    try {
      const dur = await playerRef.current?.getDuration();
      if (dur && dur > 0) setDurationMs(Math.floor(dur * 1000));
    } catch {
      // ignore
    }
  }, []);

  const onChangeState = useCallback(
    (state: string) => {
      switch (state) {
        case PLAYER_STATES.PLAYING:
          setIsPlaying(true);
          break;

        case PLAYER_STATES.PAUSED:
          setIsPlaying(false);
          break;

        case PLAYER_STATES.ENDED:
          setIsPlaying(false);
          if (queueLengthRef.current <= 1) {
            playerRef.current?.seekTo(0, true);
          } else {
            playNext();
          }
          break;
      }
    },
    [playNext, setIsPlaying],
  );

  const onError = useCallback(
    (error: string) => {
      setPlayError(`YouTube 재생 오류: ${error}`);
    },
    [setPlayError],
  );

  const seekToMs = useCallback((ms: number) => {
    playerRef.current?.seekTo(ms / 1000, true);
    setPositionMs(ms);
  }, []);

  return { playerRef, positionMs, durationMs, seekToMs, onReady, onChangeState, onError };
}
