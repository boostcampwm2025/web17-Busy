import type { SpotifyTrack } from '@/api';
import type { MusicResponseDto as Music } from '@repo/dto';
import { MusicProvider } from '@repo/dto/values';

const joinArtistNames = (artists: { name: string }[]): string =>
  artists
    .map((a) => a.name)
    .filter(Boolean)
    .join(', ');

const pickAlbumCoverUrl = (track: SpotifyTrack): string => {
  const first = track.album.images[0];
  return first?.url ?? 'https://via.placeholder.com/400?text=No+Cover';
};

export const spotifyTrackToMusic = (track: SpotifyTrack): Music => ({
  // NOTE: DB UUID는 서버 저장 시 생성. 검색 결과 단계에서는 Spotify track id를 임시 key로 사용.
  id: track.id,
  trackUri: track.uri,
  provider: MusicProvider.SPOTIFY,
  albumCoverUrl: pickAlbumCoverUrl(track),
  title: track.name,
  artistName: joinArtistNames(track.artists),
  durationMs: track.duration_ms,
});
