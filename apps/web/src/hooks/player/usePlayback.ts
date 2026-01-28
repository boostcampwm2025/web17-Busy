import { usePlayerStore } from '@/stores';
import { useItunesHook } from './useItunesHook';
import { useYouTubeHook } from './useYouTubeHook';
import { MusicProvider } from '@repo/dto/values';

export function usePlayback() {
  const currentMusic = usePlayerStore((s) => s.currentMusic);
  const provider = currentMusic?.provider;

  const it = useItunesHook();
  const yt = useYouTubeHook();

  if (provider === MusicProvider.YOUTUBE) return { kind: 'youtube' as const, ...yt };
  return { kind: 'itunes' as const, ...it, containerRef: null };
}
