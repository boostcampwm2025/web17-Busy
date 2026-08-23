import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GetPlaylistDetailResDto as PlaylistDetail } from '@repo/dto';

import { queryKeys } from '@/api/queryKeys';
import { createTestQueryClient } from '@/test/render-with-query-client';

const apiMocks = vi.hoisted(() => ({
  deletePlaylist: vi.fn(),
  editTitleOfPlaylist: vi.fn(),
}));

vi.mock('@/api/internal/playlist', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/internal/playlist')>()),
  deletePlaylist: apiMocks.deletePlaylist,
  editTitleOfPlaylist: apiMocks.editTitleOfPlaylist,
}));

import { useDeletePlaylistInListMutation, useRenamePlaylistInListMutation } from './use-playlist-mutations';

const PLAYLIST_ID = 'playlist-1';

const detail = (title: string): PlaylistDetail => ({ id: PLAYLIST_ID, title, musics: [] }) as unknown as PlaylistDetail;

const createWrapper = (queryClient: ReturnType<typeof createTestQueryClient>) => {
  const TestQueryClientProvider = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);
  TestQueryClientProvider.displayName = 'TestQueryClientProvider';

  return TestQueryClientProvider;
};

describe('playlist mutations from the archive list', () => {
  beforeEach(() => {
    apiMocks.deletePlaylist.mockReset().mockResolvedValue(undefined);
    apiMocks.editTitleOfPlaylist.mockReset().mockResolvedValue(undefined);
  });

  /**
   * 목록만 무효화하면 이미 열어 본 상세 cache가 지워진 플레이리스트로 남는다.
   * 다음에 그 상세를 구독하면 없는 리소스를 다시 조회하게 된다.
   */
  it('drops the detail cache of the deleted playlist', async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKeys.playlists.detail(PLAYLIST_ID), detail('내 플리'));

    const { result } = renderHook(() => useDeletePlaylistInListMutation(), { wrapper: createWrapper(queryClient) });
    result.current.mutate(PLAYLIST_ID);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(queryKeys.playlists.detail(PLAYLIST_ID))).toBeUndefined();
    expect(apiMocks.deletePlaylist).toHaveBeenCalledWith(PLAYLIST_ID);
  });

  /** 목록에서 이름을 바꿔도 이미 열어 본 상세가 예전 제목으로 남으면 안 된다. */
  it('keeps the detail cache title in sync after a rename', async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKeys.playlists.detail(PLAYLIST_ID), detail('예전 제목'));

    const { result } = renderHook(() => useRenamePlaylistInListMutation(), { wrapper: createWrapper(queryClient) });
    result.current.mutate({ playlistId: PLAYLIST_ID, title: '새 제목' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData<PlaylistDetail>(queryKeys.playlists.detail(PLAYLIST_ID))?.title).toBe('새 제목');
  });

  it('leaves the caches alone when the delete request fails', async () => {
    apiMocks.deletePlaylist.mockRejectedValue(new Error('network'));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKeys.playlists.detail(PLAYLIST_ID), detail('내 플리'));

    const { result } = renderHook(() => useDeletePlaylistInListMutation(), { wrapper: createWrapper(queryClient) });
    result.current.mutate(PLAYLIST_ID);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(queryKeys.playlists.detail(PLAYLIST_ID))).toEqual(detail('내 플리'));
  });
});
