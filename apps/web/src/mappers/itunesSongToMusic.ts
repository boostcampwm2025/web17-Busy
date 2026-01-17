import type { Music } from '@/types';
import type { ItunesSongResult } from '@/api';
import { Provider } from '@repo/dto';

const FALLBACK_COVER_URL = 'https://via.placeholder.com/400?text=No+Cover';

const toHighResArtworkUrl = (artworkUrl100?: string): string => {
  if (!artworkUrl100) {
    return FALLBACK_COVER_URL;
  }
  return artworkUrl100.replace('100x100bb', '600x600bb');
};

/**
 * NOTE:
 * - iTunes(APPLE) provider에서는 `trackUri` 필드에 previewUrl(30초 미리듣기 URL)을 저장합니다.
 * - 실제 음원 재생(전체 재생)은 별도 설계가 필요하므로, 지금 단계에서는 preview 기준으로 통일합니다.
 */
export const itunesSongToMusic = (track: ItunesSongResult): Music => {
  return {
    musicId: track.trackId.toString(),
    provider: Provider.ITUNES,
    trackUri: track.previewUrl ?? '',

    albumCoverUrl: toHighResArtworkUrl(track.artworkUrl100),
    title: track.trackName,
    artistName: track.artistName,
    durationMs: track.trackTimeMillis ?? 0,
  };
};
