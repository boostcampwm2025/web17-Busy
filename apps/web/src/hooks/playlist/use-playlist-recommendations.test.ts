import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GetAllPlaylistsResDto, MusicResponseDto as SavedMusic } from '@repo/dto';

import { createTestQueryClient } from '@/test/render-with-query-client';

import { usePlaylistRecommendations } from './use-playlist-recommendations';

const apiMocks = vi.hoisted(() => ({
  getAllPlaylists: vi.fn(),
  getPlaylistDetail: vi.fn(),
}));
vi.mock('@/api/internal/playlist', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/internal/playlist')>()),
  getAllPlaylists: apiMocks.getAllPlaylists,
  getPlaylistDetail: apiMocks.getPlaylistDetail,
}));

type Brief = GetAllPlaylistsResDto['playlists'][number];

const brief = (id: string): Brief => ({ id, title: `title-${id}`, tracksCount: 3, firstAlbumCoverUrl: `https://cdn.test/${id}.jpg` });

const music = (id: string): SavedMusic =>
  ({
    id,
    trackUri: `spotify:track:${id}`,
    provider: 'youtube',
    albumCoverUrl: `https://cdn.test/${id}.jpg`,
    title: id,
    artistName: 'a',
    durationMs: 1,
  }) as SavedMusic;

const createWrapper = () => {
  const queryClient = createTestQueryClient();
  const TestQueryClientProvider = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);
  TestQueryClientProvider.displayName = 'TestQueryClientProvider';
  return TestQueryClientProvider;
};

describe('usePlaylistRecommendations', () => {
  beforeEach(() => {
    apiMocks.getAllPlaylists.mockReset().mockResolvedValue([brief('1'), brief('2')]);
    apiMocks.getPlaylistDetail.mockReset();
  });

  it('enabled가 false면 목록을 조회하지 않고 idle을 유지한다', async () => {
    const { result } = renderHook(() => usePlaylistRecommendations({ enabled: false }), { wrapper: createWrapper() });

    await act(async () => {});

    expect(apiMocks.getAllPlaylists).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('enabled면 목록을 조회해 success로 전환한다', async () => {
    const { result } = renderHook(() => usePlaylistRecommendations({ enabled: true }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(result.current.briefs.map((b) => b.id)).toEqual(['1', '2']);
  });

  it('목록 조회가 실패하면 목록 에러 메시지를 담는다', async () => {
    apiMocks.getAllPlaylists.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => usePlaylistRecommendations({ enabled: true }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.errorMessage).toBe('플레이리스트를 불러오지 못했습니다.'));
  });

  it('selectPlaylist가 성공하면 id/title/musics만 골라 반환한다', async () => {
    apiMocks.getPlaylistDetail.mockResolvedValue({ id: '1', title: 'title-1', musics: [music('a')], extraField: 'ignored' });
    const { result } = renderHook(() => usePlaylistRecommendations({ enabled: true }), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.status).toBe('success'));

    let detail;
    await act(async () => {
      detail = await result.current.selectPlaylist('1');
    });

    expect(detail).toEqual({ id: '1', title: 'title-1', musics: [music('a')] });
    expect(result.current.selectedPlaylistId).toBeNull();
  });

  it('selectPlaylist 진행 중에는 selectedPlaylistId가 채워진다', async () => {
    let resolveDetail!: (value: unknown) => void;
    apiMocks.getPlaylistDetail.mockReturnValue(new Promise((resolve) => (resolveDetail = resolve)));
    const { result } = renderHook(() => usePlaylistRecommendations({ enabled: true }), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.status).toBe('success'));

    let pending!: Promise<unknown>;
    act(() => {
      pending = result.current.selectPlaylist('1');
    });

    expect(result.current.selectedPlaylistId).toBe('1');

    await act(async () => {
      resolveDetail({ id: '1', title: 'title-1', musics: [] });
      await pending;
    });

    expect(result.current.selectedPlaylistId).toBeNull();
  });

  it('selectPlaylist가 실패하면 상세 에러 메시지를 담고 null을 반환한다', async () => {
    apiMocks.getPlaylistDetail.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => usePlaylistRecommendations({ enabled: true }), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.status).toBe('success'));

    let detail;
    await act(async () => {
      detail = await result.current.selectPlaylist('1');
    });

    expect(detail).toBeNull();
    expect(result.current.errorMessage).toBe('플레이리스트 상세를 불러오지 못했습니다.');
    expect(result.current.selectedPlaylistId).toBeNull();
  });

  it('refetch는 상세 에러 메시지를 지우고 목록을 다시 불러온다', async () => {
    apiMocks.getPlaylistDetail.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => usePlaylistRecommendations({ enabled: true }), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.status).toBe('success'));

    await act(async () => {
      await result.current.selectPlaylist('1');
    });
    expect(result.current.errorMessage).toBe('플레이리스트 상세를 불러오지 못했습니다.');

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.errorMessage).toBeNull();
    expect(apiMocks.getAllPlaylists).toHaveBeenCalledTimes(2);
  });
});
