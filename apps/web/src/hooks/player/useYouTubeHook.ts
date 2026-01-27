'use client';

import { usePlayerStore } from '@/stores';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PlayerProgress } from '@/types';
import { MusicProvider } from '@repo/dto/values';
import { clamp01, clampMs } from '@/utils';
import { DEFAULT_VOLUME, YOUTUBE_PLAYER_TICK_INTERVAL_MS } from '@/constants';
import { usePlayerTick, useYouTubePlayer } from './youtube';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function useYouTubeHook() {
  const currentMusic = usePlayerStore((s) => s.currentMusic);
  const videoId = currentMusic?.trackUri;
  const isYoutube = currentMusic?.provider === MusicProvider.YOUTUBE;

  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const volume = usePlayerStore((s) => s.volume);

  const setPlayError = usePlayerStore((s) => s.setPlayError);

  const [progress, setProgress] = useState<PlayerProgress>({ positionMs: 0, durationMs: 0 });
  const [isTicking, setIsTicking] = useState(false);

  const { containerRef, playerRef, ready } = useYouTubePlayer({ setProgress, setIsTicking });

  // volume 동기화
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const v01 = Number.isFinite(volume) ? clamp01(volume) : DEFAULT_VOLUME;

    const v100 = Math.round(v01 * 100);

    if (v100 <= 0) {
      player.mute();
      player.setVolume(0);
    } else {
      if (player.isMuted()) player.unMute();
      player.setVolume(v100);
    }
  }, [volume]);

  // videoId 교체
  useEffect(() => {
    if (!ready) return;

    const player = playerRef.current;
    if (!player) return;

    if (!currentMusic || !isYoutube) {
      player.stopVideo();
      setProgress({ positionMs: 0, durationMs: 0 });
      return;
    }

    if (!videoId) {
      player.stopVideo();
      setProgress({ positionMs: 0, durationMs: 0 });
      // youtube play error로 분리 후 사용
      // setPlayError('재생할 수 있는 YouTube videoId가 없습니다.');
      return;
    }

    setProgress({ durationMs: 0, positionMs: 0 });

    // isPlaying에 따른 분기 필요? itunes는 분기 안 함
    if (isPlaying) player.loadVideoById(videoId);
    else player.cueVideoById(videoId);
  }, [ready, currentMusic?.id, videoId, isYoutube, isPlaying]);

  // 에러메시지 초기화
  useEffect(() => {
    setPlayError(null);
  }, [currentMusic?.id, setPlayError]);

  // 재생/일시정지 제어
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !currentMusic || !isYoutube) return;

    if (isPlaying) player.playVideo();
    else player.pauseVideo();
  }, [isYoutube, isPlaying, currentMusic?.id]);

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
