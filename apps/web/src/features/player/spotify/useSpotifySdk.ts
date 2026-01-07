import { useSpotifyPlayerStore } from '@/stores/useSpotifyPlayerStore';
import { useEffect } from 'react';

const SDK_SRC = 'https://sdk.scdn.co/spotify-player.js';
const SCRIPT_ID = 'spotify-web-playback-sdk'; // 이건 왜 필요한거지?

export function useSpotifySdk() {
  const sdkReady = useSpotifyPlayerStore((s) => s.sdkReady);
  const setSdkReady = useSpotifyPlayerStore((s) => s.setSdkReady);

  useEffect(() => {
    if (sdkReady) return;

    if (typeof window !== 'undefined' && window.Spotify) {
      setSdkReady(true);
      return;
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      window.onSpotifyWebPlaybackSDKReady = () => setSdkReady(true);
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SDK_SRC;
    script.async = true;

    window.onSpotifyWebPlaybackSDKReady = () => setSdkReady(true);

    document.body.appendChild(script);

    return () => {
      if (window.onSpotifyWebPlaybackSDKReady) {
        window.onSpotifyWebPlaybackSDKReady = () => {};
      }
    };
  }, [sdkReady, setSdkReady]);

  return { sdkReady };
}
