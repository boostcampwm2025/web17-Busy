import { usePlayerStore } from '@/stores';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Playback, PlayerProgress } from './types';
import { MusicProvider } from '@repo/dto/values';
import { clampMs } from './utils';

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

export function useYouTubePlayer() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YT.Player>(null);

  const currentMusic = usePlayerStore((s) => s.currentMusic);
  const videoId = currentMusic?.trackUri;
  const isYoutube = currentMusic?.provider === MusicProvider.YOUTUBE;

  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const queueLength = usePlayerStore((s) => s.queue.length);
  const playNext = usePlayerStore((s) => s.playNext);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  const setVolume = usePlayerStore((s) => s.setVolume);
  const volume = usePlayerStore((s) => s.volume);

  const setPlayError = usePlayerStore((s) => s.setPlayError);

  const [progress, setProgress] = useState<PlayerProgress>({ positionMs: 0, durationMs: 0 });

  const [isTicking, setIsTicking] = useState(false);

  // Player 생성은 1회만
  useEffect(() => {
    let mounted = true;

    const loadScript = () =>
      new Promise<void>((resolve) => {
        if (window.YT?.Player) return resolve();

        const existing = document.getElementById('yt-iframe-api');
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
        tag.id = 'yt-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        window.onYouTubeIframeAPIReady = () => resolve();
        document.body.appendChild(tag);
      });

    const createPlayer = async () => {
      await loadScript();
      if (!mounted || !containerRef.current || playerRef.current) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: currentMusic?.provider === MusicProvider.YOUTUBE ? currentMusic.trackUri : undefined,
        playerVars: { autoplay: 0, controls: 1 },
        events: {
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              playNext();
            }
          },
        },
      });
    };

    createPlayer();

    return () => {
      mounted = false;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  // volume 동기화
  useEffect(() => {
    // todo
  }, [volume]);

  // loop = true -> 필요 없을 듯
  // useEffect(() => {

  // }, [queueLength]);

  // videoId 바뀔 때는 destroy 없이 교체
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !videoId) return;

    player.cueVideoById(videoId);
  }, [videoId, setPlayError]);

  // 재생/일시정지 제어
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !currentMusic) return;

    const state = player.getPlayerState();
    if (state === YT.PlayerState.UNSTARTED) return;

    if (isPlaying) player.playVideo();
    else player.pauseVideo();
  }, [isPlaying, currentMusic?.id]);

  // 에러 처리
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !currentMusic) return;

    const handleError = (e: any) => {
      setPlayError(`Youtube error: ${e.data}`);
      togglePlay();
    };

    player.addEventListener('onError', handleError);
    return () => player.removeEventListener('onError', handleError);
  }, [setPlayError, togglePlay]);

  // durationMs, positionMs 동기화
  usePlayerTick(
    isTicking,
    () => playerRef.current?.getCurrentTime() ?? -1,
    (ms) => setProgress((prev) => ({ ...prev, positionMs: ms })),
    250,
  );

  // player 이벤트 핸들러 등록
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const timer: number | null = null;

    const syncDuration = () => {
      const d = player.getDuration(); // 현재 위치 (seconds)
      const durationMs = d > 0 ? Math.floor(d * 1000) : 0;
      if (durationMs > 0) {
        setProgress((prev) => ({ ...prev, durationMs: durationMs || prev.durationMs }));
      }
    };

    const handleStateChange = (e: any) => {
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
          if (queueLength <= 1) return; // 이건 왜?
          playNext();
          break;

        default: // UNSTARTED 등
          setIsTicking(false);
          break;
      }
    };

    syncDuration();

    player.addEventListener('onStateChange', handleStateChange);
    return () => {
      setIsTicking(false);
      player.removeEventListener('onStateChange', handleStateChange);
    };
  }, [playNext, queueLength]);

  const seekToMs = useCallback(
    (ms: number) => {
      const player = playerRef.current;
      if (!player) return;

      const rawDuration = player.getDuration();
      const metaMs = rawDuration > 0 ? Math.floor(rawDuration * 1000) : 0;
      const maxMs = metaMs > 0 ? metaMs : progress.durationMs;

      if (maxMs <= 0) return;

      const state = player.getPlayerState();
      if (state === YT.PlayerState.UNSTARTED) return;

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
