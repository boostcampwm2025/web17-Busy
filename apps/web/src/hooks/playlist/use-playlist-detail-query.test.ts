import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GetPlaylistDetailResDto as PlaylistDetail, MusicResponseDto as SavedMusic } from '@repo/dto';

import { queryKeys } from '@/api/queryKeys';
import { createTestQueryClient } from '@/test/render-with-query-client';

import { patchPlaylistDetailInCache, removePlaylistDetailCache } from './playlist-cache-updaters';
import { usePlaylistDetailQuery } from './use-playlist-detail-query';

const apiMocks = vi.hoisted(() => ({
  getPlaylistDetail: vi.fn(),
}));

vi.mock('@/api/internal/playlist', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/internal/playlist')>()),
  getPlaylistDetail: apiMocks.getPlaylistDetail,
}));

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

const createWrapper = (queryClient: ReturnType<typeof createTestQueryClient>) => {
  const TestQueryClientProvider = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);
  TestQueryClientProvider.displayName = 'TestQueryClientProvider';

  return TestQueryClientProvider;
};

describe('usePlaylistDetailQuery', () => {
  beforeEach(() => {
    apiMocks.getPlaylistDetail.mockReset();
  });

  it('reflects a cache patch without refetching', async () => {
    const queryClient = createTestQueryClient();
    apiMocks.getPlaylistDetail.mockResolvedValue(detail([music('a'), music('b')]));

    const { result } = renderHook(() => usePlaylistDetailQuery(PLAYLIST_ID), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(apiMocks.getPlaylistDetail).toHaveBeenCalledTimes(1);

    act(() => {
      patchPlaylistDetailInCache(queryClient, PLAYLIST_ID, { musics: [music('b'), music('a')] });
    });

    await waitFor(() => expect(result.current.data?.musics.map((m) => m.id)).toEqual(['b', 'a']));
    expect(apiMocks.getPlaylistDetail).toHaveBeenCalledTimes(1);
  });

  it('renders from the detail cache another screen already filled for the same key', async () => {
    const queryClient = createTestQueryClient();
    apiMocks.getPlaylistDetail.mockResolvedValue(detail([music('a')]));
    // `usePlaylistRecommendations`가 fetchQuery로 같은 key를 채워 둔 상황
    queryClient.setQueryData(queryKeys.playlists.detail(PLAYLIST_ID), detail([music('a')]));

    const { result } = renderHook(() => usePlaylistDetailQuery(PLAYLIST_ID), { wrapper: createWrapper(queryClient) });

    // 로딩 상태를 거치지 않고 첫 렌더부터 캐시 값이 그려진다.
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data?.musics.map((m) => m.id)).toEqual(['a']);

    await waitFor(() => expect(result.current.isFetching).toBe(false));
  });

  it('refetches the server list when a failed edit invalidates the detail', async () => {
    const queryClient = createTestQueryClient();
    apiMocks.getPlaylistDetail.mockResolvedValue(detail([music('a'), music('b')]));

    const { result } = renderHook(() => usePlaylistDetailQuery(PLAYLIST_ID), { wrapper: createWrapper(queryClient) });
    await waitFor(() => expect(result.current.data).toBeDefined());

    // 낙관적으로 순서를 바꿨다가 요청이 실패한 상황
    act(() => {
      patchPlaylistDetailInCache(queryClient, PLAYLIST_ID, { musics: [music('b'), music('a')] });
    });
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.playlists.detail(PLAYLIST_ID) });
    });

    await waitFor(() => expect(result.current.data?.musics.map((m) => m.id)).toEqual(['a', 'b']));
    expect(apiMocks.getPlaylistDetail).toHaveBeenCalledTimes(2);
  });

  it('does not fetch a deleted playlist after its detail cache is dropped', async () => {
    const queryClient = createTestQueryClient();
    apiMocks.getPlaylistDetail.mockResolvedValue(detail([music('a')]));

    const { result, unmount } = renderHook(() => usePlaylistDetailQuery(PLAYLIST_ID), { wrapper: createWrapper(queryClient) });
    await waitFor(() => expect(result.current.data).toBeDefined());

    // 모달이 먼저 닫힌 뒤 cache를 버려야 없어진 플레이리스트를 다시 조회하지 않는다.
    unmount();
    removePlaylistDetailCache(queryClient, PLAYLIST_ID);

    expect(queryClient.getQueryData(queryKeys.playlists.detail(PLAYLIST_ID))).toBeUndefined();
    expect(apiMocks.getPlaylistDetail).toHaveBeenCalledTimes(1);
  });
});
