import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GetPlaylistDetailResDto as PlaylistDetail, MusicRequestDto as UnsavedMusic, MusicResponseDto as SavedMusic } from '@repo/dto';

import { queryKeys } from '@/api/queryKeys';
import { createTestQueryClient } from '@/test/render-with-query-client';

import {
  useAddMusicsToPlaylistMutation,
  useAddPlaylistSongMutation,
  useCreatePlaylistMutation,
  useDeletePlaylistMutation,
  usePlaylistSongsMutation,
  useRenamePlaylistMutation,
} from './use-playlist-mutations';

const apiMocks = vi.hoisted(() => ({
  changeMusicOrderOfPlaylist: vi.fn(),
  addMusicsToPlaylist: vi.fn(),
  createNewPlaylist: vi.fn(),
  editTitleOfPlaylist: vi.fn(),
  deletePlaylist: vi.fn(),
}));

vi.mock('@/api/internal/playlist', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/internal/playlist')>()),
  ...apiMocks,
}));

const PLAYLIST_ID = 'playlist-1';
const detailKey = queryKeys.playlists.detail(PLAYLIST_ID);

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

const createWrapper = (queryClient: ReturnType<typeof createTestQueryClient>) => {
  const TestQueryClientProvider = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);
  TestQueryClientProvider.displayName = 'TestQueryClientProvider';

  return TestQueryClientProvider;
};

const songIdsInCache = (queryClient: ReturnType<typeof createTestQueryClient>) =>
  queryClient.getQueryData<PlaylistDetail>(detailKey)?.musics.map((m) => m.id);

describe('playlist mutations', () => {
  beforeEach(() => {
    Object.values(apiMocks).forEach((mock) => mock.mockReset());
  });

  describe('usePlaylistSongsMutation', () => {
    it('applies the new song order before the request resolves', async () => {
      const queryClient = createTestQueryClient();
      queryClient.setQueryData(detailKey, detail([music('a'), music('b')]));
      let resolveRequest: (() => void) | undefined;
      apiMocks.changeMusicOrderOfPlaylist.mockReturnValue(
        new Promise<{ ok: true }>((resolve) => {
          resolveRequest = () => resolve({ ok: true });
        }),
      );

      const { result } = renderHook(() => usePlaylistSongsMutation({ playlistId: PLAYLIST_ID }), { wrapper: createWrapper(queryClient) });
      result.current.mutate([music('b'), music('a')]);

      // 응답을 기다리지 않고 목록이 먼저 바뀐다.
      await waitFor(() => expect(songIdsInCache(queryClient)).toEqual(['b', 'a']));
      expect(apiMocks.changeMusicOrderOfPlaylist).toHaveBeenCalledWith(PLAYLIST_ID, ['b', 'a']);

      resolveRequest?.();
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it('restores the previous song list when the request fails', async () => {
      const queryClient = createTestQueryClient();
      queryClient.setQueryData(detailKey, detail([music('a'), music('b'), music('c')]));
      apiMocks.changeMusicOrderOfPlaylist.mockRejectedValue(new Error('network'));

      const { result } = renderHook(() => usePlaylistSongsMutation({ playlistId: PLAYLIST_ID }), { wrapper: createWrapper(queryClient) });
      // 선택 삭제도 같은 mutation을 쓴다. 남길 곡만 넘긴다.
      result.current.mutate([music('a')]);

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(songIdsInCache(queryClient)).toEqual(['a', 'b', 'c']);
    });
  });

  describe('useAddPlaylistSongMutation', () => {
    it('appends the saved music the server returned to the current list', async () => {
      const queryClient = createTestQueryClient();
      queryClient.setQueryData(detailKey, detail([music('a')]));
      apiMocks.addMusicsToPlaylist.mockResolvedValue({ addedMusics: [music('b')] });

      const { result } = renderHook(() => useAddPlaylistSongMutation({ playlistId: PLAYLIST_ID }), { wrapper: createWrapper(queryClient) });
      result.current.mutate({ ...music('b'), id: undefined } as UnsavedMusic);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(songIdsInCache(queryClient)).toEqual(['a', 'b']);
    });

    it('appends to the list in cache rather than the one captured at render time', async () => {
      const queryClient = createTestQueryClient();
      queryClient.setQueryData(detailKey, detail([music('a')]));
      apiMocks.addMusicsToPlaylist.mockResolvedValue({ addedMusics: [music('c')] });

      const { result } = renderHook(() => useAddPlaylistSongMutation({ playlistId: PLAYLIST_ID }), { wrapper: createWrapper(queryClient) });
      result.current.mutate({ ...music('c'), id: undefined } as UnsavedMusic);
      // 요청이 도는 사이 다른 경로로 목록이 바뀐 상황
      queryClient.setQueryData(detailKey, detail([music('a'), music('b')]));

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(songIdsInCache(queryClient)).toEqual(['a', 'b', 'c']);
    });
  });

  describe('useRenamePlaylistMutation', () => {
    it('shows the new title before the request resolves', async () => {
      const queryClient = createTestQueryClient();
      queryClient.setQueryData(detailKey, detail([music('a')], '이전 제목'));
      let resolveRequest: (() => void) | undefined;
      apiMocks.editTitleOfPlaylist.mockReturnValue(
        new Promise<{ ok: true }>((resolve) => {
          resolveRequest = () => resolve({ ok: true });
        }),
      );

      const { result } = renderHook(() => useRenamePlaylistMutation({ playlistId: PLAYLIST_ID }), { wrapper: createWrapper(queryClient) });
      result.current.mutate('바뀐 제목');

      await waitFor(() => expect(queryClient.getQueryData<PlaylistDetail>(detailKey)?.title).toBe('바뀐 제목'));

      resolveRequest?.();
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it('restores the previous title when the request fails', async () => {
      const queryClient = createTestQueryClient();
      queryClient.setQueryData(detailKey, detail([music('a')], '이전 제목'));
      apiMocks.editTitleOfPlaylist.mockRejectedValue(new Error('network'));

      const { result } = renderHook(() => useRenamePlaylistMutation({ playlistId: PLAYLIST_ID }), { wrapper: createWrapper(queryClient) });
      result.current.mutate('바뀐 제목');

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(queryClient.getQueryData<PlaylistDetail>(detailKey)?.title).toBe('이전 제목');
    });
  });

  describe('useDeletePlaylistMutation', () => {
    it('closes the screen before dropping the detail cache', async () => {
      const queryClient = createTestQueryClient();
      queryClient.setQueryData(detailKey, detail([music('a')]));
      apiMocks.deletePlaylist.mockResolvedValue({ ok: true });

      const order: string[] = [];
      const onDeleted = vi.fn(() => {
        // 이 시점에 cache가 남아 있어야 구독자가 없어진 플레이리스트를 다시 조회하지 않는다.
        order.push(queryClient.getQueryData(detailKey) ? 'closed-with-cache' : 'closed-without-cache');
      });

      const { result } = renderHook(() => useDeletePlaylistMutation({ playlistId: PLAYLIST_ID, onDeleted }), { wrapper: createWrapper(queryClient) });
      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(order).toEqual(['closed-with-cache']);
      expect(queryClient.getQueryData(detailKey)).toBeUndefined();
    });

    it('keeps the playlist when the request fails', async () => {
      const queryClient = createTestQueryClient();
      queryClient.setQueryData(detailKey, detail([music('a')]));
      apiMocks.deletePlaylist.mockRejectedValue(new Error('network'));
      const onDeleted = vi.fn();

      const { result } = renderHook(() => useDeletePlaylistMutation({ playlistId: PLAYLIST_ID, onDeleted }), { wrapper: createWrapper(queryClient) });
      result.current.mutate();

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(onDeleted).not.toHaveBeenCalled();
      expect(songIdsInCache(queryClient)).toEqual(['a']);
    });
  });

  describe('useCreatePlaylistMutation', () => {
    /** 호출부가 만들어진 플레이리스트에 이어서 곡을 저장하므로 응답을 그대로 돌려줘야 한다. */
    it('refreshes the list and hands the created playlist back', async () => {
      const queryClient = createTestQueryClient();
      queryClient.setQueryData(queryKeys.playlists.all, [{ id: PLAYLIST_ID }]);
      apiMocks.createNewPlaylist.mockResolvedValue({ id: 'new-playlist', title: '새 플레이리스트' });

      const { result } = renderHook(() => useCreatePlaylistMutation(), { wrapper: createWrapper(queryClient) });
      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.id).toBe('new-playlist');
      expect(queryClient.getQueryState(queryKeys.playlists.all)?.isInvalidated).toBe(true);
    });
  });

  describe('useAddMusicsToPlaylistMutation', () => {
    /** 저장 대상 플레이리스트의 상세를 이미 열어 봤다면 곡 수와 커버가 예전 값으로 남는다. */
    it('refreshes both the list and the target playlist detail', async () => {
      const queryClient = createTestQueryClient();
      queryClient.setQueryData(queryKeys.playlists.all, [{ id: PLAYLIST_ID }]);
      queryClient.setQueryData(detailKey, detail([music('a')]));
      apiMocks.addMusicsToPlaylist.mockResolvedValue({ addedMusics: [music('b')] });

      const songs = [{ ...music('b'), id: undefined } as UnsavedMusic];
      const { result } = renderHook(() => useAddMusicsToPlaylistMutation(), { wrapper: createWrapper(queryClient) });
      result.current.mutate({ playlistId: PLAYLIST_ID, musics: songs });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(apiMocks.addMusicsToPlaylist).toHaveBeenCalledWith(PLAYLIST_ID, songs);
      expect(queryClient.getQueryState(queryKeys.playlists.all)?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(detailKey)?.isInvalidated).toBe(true);
    });
  });
});
