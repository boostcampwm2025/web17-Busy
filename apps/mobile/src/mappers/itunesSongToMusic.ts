import type { ItunesSongResult } from '@/src/api/itunes';
import { MusicProvider } from '@repo/dto/values';
import type { MusicResponseDto as Music } from '@repo/dto';

const FALLBACK_COVER_URL = 'https://placehold.co/400x400?text=No+Cover';

const toHighResArtworkUrl = (artworkUrl100?: string): string => {
  if (!artworkUrl100) return FALLBACK_COVER_URL;
  return artworkUrl100.replace('100x100bb', '600x600bb');
};

export const itunesSongToMusic = (track: ItunesSongResult): Music => ({
  id: track.trackId.toString(),
  provider: MusicProvider.ITUNES,
  trackUri: track.previewUrl ?? '',
  albumCoverUrl: toHighResArtworkUrl(track.artworkUrl100),
  title: track.trackName,
  artistName: track.artistName,
  durationMs: track.trackTimeMillis ?? 0,
});
