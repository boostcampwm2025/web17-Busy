import type { GetAllPlaylistsResDto, GetPlaylistDetailResDto, MusicResponseDto as Music } from '@repo/dto';
import { MusicProvider } from '@repo/dto';

/**
 * DTO 타입 정리
 * - brief: GET /playlist 응답의 playlists 아이템 타입
 * - detail: GET /playlist/{id} 응답 타입
 */
type PlaylistBrief = GetAllPlaylistsResDto['playlists'][number];
type PlaylistDetail = GetPlaylistDetailResDto;

const MUSIC_DURATION_MS = 30_000;

const PLAYLIST_IDS = {
  RAINY: 'p1',
  WORK: 'p2',
} as const;

type PlaylistId = (typeof PLAYLIST_IDS)[keyof typeof PLAYLIST_IDS];

const PLAYLIST_TITLES: Record<PlaylistId, string> = {
  [PLAYLIST_IDS.RAINY]: '비 오는 날 듣기 좋은 노래',
  [PLAYLIST_IDS.WORK]: '노동요',
};

const MOCK_MUSICS: readonly Music[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'we cant be friends',
    artistName: 'Ariana Grande',
    albumCoverUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/2e/88/88/2e8888ad-a0cf-eece-70a7-1ff81377a3ab/24UMGIM00198.rgb.jpg/600x600bb.jpg',
    trackUri:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/22/fc/88/22fc885b-27c8-4693-7400-9e774eae9d7a/mzaf_5140833304960295464.plus.aac.p.m4a',
    provider: MusicProvider.ITUNES,
    durationMs: MUSIC_DURATION_MS,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    title: 'Die For You',
    artistName: 'The Weekend',
    albumCoverUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b5/92/bb/b592bb72-52e3-e756-9b26-9f56d08f47ab/16UMGIM67864.rgb.jpg/600x600bb.jpg',
    trackUri:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/de/52/1d/de521dd3-f0f5-b694-4f30-3d465cc5bd0b/mzaf_9744418488383113655.plus.aac.p.m4a',
    provider: MusicProvider.ITUNES,
    durationMs: MUSIC_DURATION_MS,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    title: 'Ditto',
    artistName: 'NewJeans',
    albumCoverUrl:
      'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/f6/29/42/f629426e-92fe-535c-cbe4-76e70850819b/196922287107_Cover.jpg/600x600bb.jpg',
    trackUri:
      'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/67/af/3d/67af3de7-8967-bc14-073d-a8712338ac32/mzaf_190692881480987912.plus.aac.p.m4a',
    provider: MusicProvider.ITUNES,
    durationMs: MUSIC_DURATION_MS,
  },
] as const;

const pick = (index: number): Music => MOCK_MUSICS[index] as unknown as Music;

export const MOCK_PLAYLIST_DETAILS: Record<PlaylistId, PlaylistDetail> = {
  [PLAYLIST_IDS.RAINY]: {
    id: PLAYLIST_IDS.RAINY,
    title: PLAYLIST_TITLES[PLAYLIST_IDS.RAINY],
    musics: [pick(0), pick(1)],
  },
  [PLAYLIST_IDS.WORK]: {
    id: PLAYLIST_IDS.WORK,
    title: PLAYLIST_TITLES[PLAYLIST_IDS.WORK],
    musics: [pick(2)],
  },
};

const toBrief = (detail: PlaylistDetail): PlaylistBrief => ({
  id: detail.id,
  title: detail.title,
  tracksCount: detail.musics.length,
  firstAlbumCoverUrl: detail.musics[0]?.albumCoverUrl ?? '',
});

export const MOCK_PLAYLIST_BRIEFS: PlaylistBrief[] = Object.values(MOCK_PLAYLIST_DETAILS).map(toBrief);
