import { YOUTUBE_IFRAME_ID, YOUTUBE_IFRAME_SCRIPT_SRC } from '@/constants/player';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { shouldRepeatSingle, toDurationMs } from '../playback-policy';
import { PlayerProgress } from '@/types/player';
import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
  }
}

type Props = {
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  setIsTicking: React.Dispatch<React.SetStateAction<boolean>>;
};

export function useYouTubePlayer({ setProgress, setIsTicking }: Props) {
  const queueLength = usePlayerStore((s) => s.queue.length);
  const playNext = usePlayerStore((s) => s.playNext);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const setPlayError = usePlayerStore((s) => s.setPlayError);

  const [isReady, setIsReady] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const queueLengthRef = useRef(queueLength);

  const waitForYTReady = (intervalMs = 50): Promise<void> =>
    new Promise((resolve) => {
      const check = setInterval(() => {
        if (window.YT?.Player) {
          clearInterval(check);
          resolve();
        }
      }, intervalMs);
    });

  const appendYouTubeScript = () =>
    new Promise<void>((resolve) => {
      const tag = document.createElement('script');
      tag.id = YOUTUBE_IFRAME_ID;
      tag.src = YOUTUBE_IFRAME_SCRIPT_SRC;

      window.onYouTubeIframeAPIReady = () => resolve();
      document.body.appendChild(tag);
    });

  const loadScript = async () => {
    if (window.YT?.Player) return;

    const existing = document.getElementById(YOUTUBE_IFRAME_ID);
    if (existing) {
      await waitForYTReady();
      return;
    }

    await appendYouTubeScript();
  };

  useEffect(() => {
    queueLengthRef.current = queueLength;
  }, [queueLength]);

  useEffect(() => {
    let isMounted = true;

    const waitForContainer = () =>
      new Promise<HTMLDivElement>((resolve) => {
        const tick = () => {
          if (!isMounted) return;
          const el = containerRef.current;
          if (el) return resolve(el);
          requestAnimationFrame(tick);
        };
        tick();
      });

    const init = async () => {
      await loadScript();
      const el = await waitForContainer();
      if (!isMounted || playerRef.current) return;

      playerRef.current = new window.YT.Player(el, {
        playerVars: { autoplay: 0, controls: 1 },
        events: {
          onReady: (e) => {
            playerRef.current = e.target;
            setIsReady(true);
          },
          onError: (e) => {
            setPlayError(`Youtube error: ${e.data}`);
            togglePlay();
          },
          onStateChange: (e) => {
            const player = playerRef.current;
            if (!player) return;

            const syncDuration = () => {
              const durationMs = toDurationMs(player.getDuration());
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

              case YT.PlayerState.ENDED: {
                setIsTicking(false);

                if (shouldRepeatSingle(queueLengthRef.current)) {
                  player.seekTo(0, true);
                  player.playVideo();
                  return;
                }

                playNext();
                break;
              }

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
      isMounted = false;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  return {
    containerRef,
    playerRef,
    isReady,
  };
}
