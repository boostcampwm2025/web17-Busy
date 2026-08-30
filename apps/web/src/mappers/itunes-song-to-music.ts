import type { ItunesSongResult } from '@/api/itunes/searchSongs';
import type { MusicResponseDto as Music } from '@repo/dto';
import { MusicProvider } from '@repo/dto/values';

const FALLBACK_COVER_URL = 'https://via.placeholder.com/400?text=No+Cover';

/**
 * 실제 렌더 크기(가장 큰 곳이 풀플레이어 앨범아트 max-w-55≈220px)를 감안해 400x400로 맞춘다.
 * 원본 100x100은 리스트 표시엔 흐릿하고, 600x600은 어디서도 그 해상도를 못 써 전송량만 낭비한다.
 */
const toArtworkUrl = (artworkUrl100?: string): string => {
  if (!artworkUrl100) {
    return FALLBACK_COVER_URL;
  }
  return artworkUrl100.replace('100x100bb', '400x400bb');
};

/**
 * NOTE:
 * - iTunes(APPLE) provider에서는 `trackUri` 필드에 previewUrl(30초 미리듣기 URL)을 저장합니다.
 * - 실제 음원 재생(전체 재생)은 별도 설계가 필요하므로, 지금 단계에서는 preview 기준으로 통일합니다.
 */
export const itunesSongToMusic = (track: ItunesSongResult): Music => {
  return {
    id: track.trackId.toString(),
    provider: MusicProvider.ITUNES,
    trackUri: track.previewUrl ?? '',

    albumCoverUrl: toArtworkUrl(track.artworkUrl100),
    title: track.trackName,
    artistName: track.artistName,
    durationMs: track.trackTimeMillis ?? 0,
  };
};
