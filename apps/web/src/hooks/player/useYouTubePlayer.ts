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
    if (!player) return;

    if (isPlaying) player.playVideo();
    else player.pauseVideo();
  }, [isPlaying, currentMusic?.id, currentMusic, togglePlay, setPlayError]);

  // player 이벤트 핸들러 등록
  // durationMs, positionMs 동기화
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    let timer: number | null = null;

    const syncDuration = () => {
      const d = player.getDuration(); // 현재 위치 (seconds)
      const durationMs = d > 0 ? Math.floor(d * 1000) : 0;
      if (durationMs > 0) {
        setProgress((prev) => ({ ...prev, durationMs: durationMs || prev.durationMs }));
      }
    };

    // player의 currentTime과 progress의 positionMs를 동기화 250ms 마다
    const startTick = () => {
      if (timer != null) return; // timer: undefined 인 경우까지 고려
      timer = window.setInterval(() => {
        const t = player.getCurrentTime();
        if (t >= 0) {
          setProgress((prev) => ({ ...prev, positionMs: Math.floor(t * 1000) }));
        }
      }, 250);
    };

    const stopTick = () => {
      if (timer == null) return;
      window.clearInterval(timer);
      timer = null;
    };

    // player의 duration과 progress의 duration을 동기화
    syncDuration();

    const handleStateChange = (e: any) => {
      switch (e.data) {
        case YT.PlayerState.PLAYING:
          syncDuration();
          startTick();
          break;
        case YT.PlayerState.PAUSED:
        case YT.PlayerState.BUFFERING:
        case YT.PlayerState.CUED:
          syncDuration();
          stopTick();
          break;
        case YT.PlayerState.ENDED:
          stopTick();
          if (queueLength <= 1) return; // 이건 왜?
          playNext();
          break;
        default: // UNSTARTED 등
          stopTick();
          break;
      }
    };

    player.addEventListener('onStateChange', handleStateChange);

    return () => {
      stopTick();
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
