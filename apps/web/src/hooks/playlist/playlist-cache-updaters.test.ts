import { describe, expect, it } from 'vitest';
import type { GetPlaylistDetailResDto as PlaylistDetail, MusicResponseDto as SavedMusic } from '@repo/dto';

import { queryKeys } from '@/api/queryKeys';
import { createTestQueryClient } from '@/test/render-with-query-client';

import { patchPlaylistDetailInCache, removePlaylistDetailCache } from './playlist-cache-updaters';

const PLAYLIST_ID = 'playlist-1';

const music = (id: string): SavedMusic => ({
  id,
  trackUri: `spotify:track:${id}`,
  provider: 'youtube' as SavedMusic['provider'],
  albumCoverUrl: `https://cdn.test/${id}.jpg`,
  title: `title-${id}`,
  artistName: `artist-${id}`,
  durationMs: 180000,
});

const detail = (musics: SavedMusic[], title = '내 플레이리스트'): PlaylistDetail => ({ id: PLAYLIST_ID, title, musics });

describe('playlist cache updaters', () => {
  it('reorders the song list in the detail cache', () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKeys.playlists.detail(PLAYLIST_ID), detail([music('a'), music('b')]));

    patchPlaylistDetailInCache(queryClient, PLAYLIST_ID, { musics: [music('b'), music('a')] });

    const cached = queryClient.getQueryData<PlaylistDetail>(queryKeys.playlists.detail(PLAYLIST_ID));
    expect(cached?.musics.map((m) => m.id)).toEqual(['b', 'a']);
    expect(cached?.title).toBe('내 플레이리스트');
  });

  it('renames the playlist without touching the song list', () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKeys.playlists.detail(PLAYLIST_ID), detail([music('a')]));

    patchPlaylistDetailInCache(queryClient, PLAYLIST_ID, { title: '바뀐 이름' });

    const cached = queryClient.getQueryData<PlaylistDetail>(queryKeys.playlists.detail(PLAYLIST_ID));
    expect(cached?.title).toBe('바뀐 이름');
    expect(cached?.musics.map((m) => m.id)).toEqual(['a']);
  });

  it('leaves an empty cache untouched instead of creating a partial entry', () => {
    const queryClient = createTestQueryClient();

    patchPlaylistDetailInCache(queryClient, PLAYLIST_ID, { title: '바뀐 이름' });

    expect(queryClient.getQueryData(queryKeys.playlists.detail(PLAYLIST_ID))).toBeUndefined();
  });

  it('patches only the target playlist', () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKeys.playlists.detail(PLAYLIST_ID), detail([music('a')]));
    queryClient.setQueryData(queryKeys.playlists.detail('playlist-2'), detail([music('z')], '다른 플레이리스트'));

    patchPlaylistDetailInCache(queryClient, PLAYLIST_ID, { title: '바뀐 이름' });

    expect(queryClient.getQueryData<PlaylistDetail>(queryKeys.playlists.detail('playlist-2'))?.title).toBe('다른 플레이리스트');
  });

  it('drops the detail cache of a deleted playlist', () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKeys.playlists.detail(PLAYLIST_ID), detail([music('a')]));

    removePlaylistDetailCache(queryClient, PLAYLIST_ID);

    expect(queryClient.getQueryData(queryKeys.playlists.detail(PLAYLIST_ID))).toBeUndefined();
  });
});
