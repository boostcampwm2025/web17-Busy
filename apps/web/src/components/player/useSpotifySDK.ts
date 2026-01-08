import { useEffect, useState, useRef } from 'react';
import { useSpotifyAuthStore } from '@/stores/useSpotifyAuthStore';
import { usePlayerStore } from '@/stores';
import { Music } from '@/types';

export const useSpotifySDK = () => {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);

  const [isSdkReady, setIsSdkReady] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const isPausedRef = useRef(true);

  // SDK 사용을 위한 spotify 토큰
  const { ensureValidToken } = useSpotifyAuthStore();
  // UI 동기화 및 음악 track URI 요청함수
  const playNext = usePlayerStore((state) => state.playNext);
  const currentMusic = usePlayerStore((state) => state.currentMusic);
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  useEffect(() => {
    // Spotify SDK 스크립트 로드
    const scriptTag = document.getElementById('spotify-player-script');
    if (!scriptTag) {
      const script = document.createElement('script');
      script.id = 'spotify-player-script';
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
    }

    // SDK 준비 완료 시 실행될 콜백
    window.onSpotifyWebPlaybackSDKReady = () => {
      setIsSdkReady(true);
    };
  }, []);

  useEffect(() => {
    if (!isSdkReady) return;

    // 플레이어 초기화
    const newPlayer = new window.Spotify.Player({
      name: 'VIBR Web Player',
      getOAuthToken: async (cb) => {
        const token = await ensureValidToken();
        cb(token);
      },
      volume: 0.5,
    });

    // 이벤트 리스너 영역

    // device id 생성
    newPlayer.addListener('ready', async ({ device_id }) => {
      setDeviceId(device_id);
      const token = await ensureValidToken();
      // 기기 연결
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_ids: [device_id],
          play: false,
        }),
      });
    });

    // 준비 안됨
    newPlayer.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline', device_id);
    });

    // 곡 종료시 orderIndex 변경
    newPlayer.addListener('player_state_changed', (state) => {
      if (!state) return;

      if (!isPausedRef.current && state.paused && state.position === 0) {
        isPausedRef.current = true;
        playNext();
      }
    });

    newPlayer.connect();
    setPlayer(newPlayer);

    return () => {
      newPlayer.disconnect();
    };
  }, [isSdkReady, ensureValidToken]);

  // 순서를 통해 트랙 재생
  const playTrackByOrder = async (current: Music | null) => {
    const uri = current!.trackUri;
    const token = ensureValidToken();

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uris: [uri],
      }),
    });
  };

  // 곡 변경
  useEffect(() => {
    playTrackByOrder(currentMusic);
  }, [currentMusic]);

  // 일시정지
  useEffect(() => {
    player?.togglePlay();
  }, [isPlaying]);

  return null;
};
