'use client';

import { usePlayerStore } from '@/stores';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PlayerProgress } from '@/types';
import { MusicProvider } from '@repo/dto/values';
import { clamp01, clampMs } from '@/utils';
import { DEFAULT_VOLUME, YOUTUBE_IFRAME_ID, YOUTUBE_IFRAME_SCRIPT_SRC } from '@/constants';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
  }
}

function usePlayerTick(enabled: boolean, getTimeSec: () => number, onTickMs: (ms: number) => void, intervalMs = 250) {
  useEffect(() => {
    if (!enabled) return;

    const id = window.setInterval(() => {
      const t = getTimeSec();
      if (t >= 0) onTickMs(Math.floor(t * 1000));
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [enabled, getTimeSec, onTickMs, intervalMs]);
}

export function useYouTubeHook() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YT.Player | null>(null);

  const currentMusic = usePlayerStore((s) => s.currentMusic);
  const videoId = currentMusic?.trackUri;
  const isYoutube = currentMusic?.provider === MusicProvider.YOUTUBE;

  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const queueLength = usePlayerStore((s) => s.queue.length);
  const playNext = usePlayerStore((s) => s.playNext);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  const volume = usePlayerStore((s) => s.volume);

  const setPlayError = usePlayerStore((s) => s.setPlayError);

  const [progress, setProgress] = useState<PlayerProgress>({ positionMs: 0, durationMs: 0 });
  const [isTicking, setIsTicking] = useState(false);
  const [ready, setReady] = useState(false);

  const queueLengthRef = useRef(queueLength);

  useEffect(() => {
    queueLengthRef.current = queueLength;
  }, [queueLength]);

  // Player 생성 - 처음 1회만
  useEffect(() => {
    let mounted = true;

    const loadScript = () =>
      new Promise<void>((resolve) => {
        if (window.YT?.Player) return resolve();

        const existing = document.getElementById(YOUTUBE_IFRAME_ID);
        if (existing) {
          const check = setInterval(() => {
            if (window.YT?.Player) {
              clearInterval(check);
              resolve();
            }
          }, 50);
          return;
        }

        const tag = document.createElement('script');
        tag.id = YOUTUBE_IFRAME_ID;
        tag.src = YOUTUBE_IFRAME_SCRIPT_SRC;
        window.onYouTubeIframeAPIReady = () => resolve();
        document.body.appendChild(tag);
      });

    const waitForContainer = () =>
      new Promise<HTMLDivElement>((resolve) => {
        const tick = () => {
          if (!mounted) return;
          const el = containerRef.current;
          if (el) return resolve(el);
          requestAnimationFrame(tick);
        };
        tick();
      });

    const init = async () => {
      await loadScript();
      const el = await waitForContainer();
      if (!mounted || playerRef.current) return;

      playerRef.current = new window.YT.Player(el, {
        playerVars: { autoplay: 0, controls: 1 },
        events: {
          onReady: (e) => {
            playerRef.current = e.target;
            setReady(true);
          },
          onError: (e) => {
            setPlayError(`Youtube error: ${e.data}`);
            togglePlay();
          },
          onStateChange: (e) => {
            const player = playerRef.current;
            if (!player) return;

            const syncDuration = () => {
              const d = player.getDuration(); // 현재 위치 (seconds)
              const durationMs = d > 0 ? Math.floor(d * 1000) : 0;
              if (durationMs > 0) {
                setProgress((prev) => ({ ...prev, durationMs: durationMs || prev.durationMs }));
              }
            };

            switch (e.data) {
              case YT.PlayerState.PLAYING:
                syncDuration();
                setIsTicking(true);
                break;

              case YT.PlayerState.PAUSED:
              case YT.PlayerState.BUFFERING:
              case YT.PlayerState.CUED:
                syncDuration();
                setIsTicking(false);
                break;

              case YT.PlayerState.ENDED:
                setIsTicking(false);

                const qLen = queueLengthRef.current;

                if (qLen <= 1) {
                  player.seekTo(0, true);
                  player.playVideo();
                  return;
                }

                playNext();
                break;

              default: // UNSTARTED 등
                setIsTicking(false);
                break;
            }
          },
        },
      });
    };

    init();

    return () => {
      mounted = false;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

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

  usePlayerTick(isTicking, getTimeSec, onTickMs, 250);

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
