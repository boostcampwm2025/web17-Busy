'use client';

import { useSpotifyAuthStore } from '@/stores/useSpotifyAuthStore';
import { useSpotifyPlayerStore } from '@/stores/useSpotifyPlayerStore';
import { useEffect, useRef } from 'react';

export function useSpotifyPlayer() {
  const sdkReady = useSpotifyPlayerStore((s) => s.sdkReady);

  const player = useSpotifyPlayerStore((s) => s.player);
  const setPlayer = useSpotifyPlayerStore((s) => s.setPlayer);

  const setDeviceId = useSpotifyPlayerStore((s) => s.setDeviceId);
  const setActive = useSpotifyPlayerStore((s) => s.setActive);
  const setPaused = useSpotifyPlayerStore((s) => s.setPaused);

  // 생성중인지 여부
  const isCreatingRef = useRef(false);

  const accessToken = useSpotifyAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!sdkReady) return;
    if (!accessToken) return;
    if (player) return;
    if (isCreatingRef.current) return;

    isCreatingRef.current = true;

    const p = new Spotify.Player({
      name: 'VIBR Web',
      getOAuthToken: (cb) => {
        // 왜 다르게 접근할까
        const latest = useSpotifyAuthStore.getState().accessToken;
        if (latest) cb(latest);
      },
      volume: 0.5,
    });

    setPlayer(p);

    p.addListener('ready', ({ device_id }) => {
      setDeviceId(device_id);
    });

    p.addListener('not_ready', ({ device_id }) => {
      //
    });

    p.addListener('player_state_changed', (state) => {
      if (!state) {
        setActive(false);
        return;
      }

      setPaused(state.paused);

      p.getCurrentState().then((s) => setActive(!!s));
    });

    p.connect().finally(() => {
      isCreatingRef.current = false;
    });

    return () => {
      p.disconnect();
      setPlayer(null);
      setDeviceId(null);
      setActive(false);
      setPaused(true);
    };
  }, [sdkReady, accessToken, player, setPlayer, setDeviceId, setActive, setPaused]);
}
