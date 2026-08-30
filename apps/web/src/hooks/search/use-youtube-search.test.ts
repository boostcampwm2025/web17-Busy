import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestQueryClient } from '@/test/render-with-query-client';

import useYoutubeSearch from './use-youtube-search';

const searchMocks = vi.hoisted(() => ({
  searchYoutubeVideos: vi.fn(),
}));

vi.mock('@/api/youtube/searchVideos', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/youtube/searchVideos')>()),
  searchYoutubeVideos: searchMocks.searchYoutubeVideos,
}));

vi.mock('@/mappers/youtubeVideoToMusic', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/mappers/youtubeVideoToMusic')>()),
  youtubeVideoToMusic: (video: { id: string; title: string }) => ({
    id: video.id,
    provider: 'youtube',
    trackUri: `https://youtube.com/watch?v=${video.id}`,
    albumCoverUrl: `https://img.youtube.com/${video.id}.jpg`,
    title: video.title,
    artistName: 'channel',
    durationMs: 0,
  }),
}));

const video = (id: string, title: string) => ({ id, title });

const createWrapper = () => {
  const queryClient = createTestQueryClient();
  const TestQueryClientProvider = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);
  TestQueryClientProvider.displayName = 'TestQueryClientProvider';

  return TestQueryClientProvider;
};

const advanceTimers = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

/**
 * debounce 타이머가 풀려 query가 시작되고, 응답 알림이 렌더에 반영될 때까지 두 번 돌린다.
 * TanStack Query는 구독자 알림을 setTimeout으로 배치하므로 마이크로태스크만 흘려서는 부족하다.
 */
const flush = async () => {
  await advanceTimers(0);
  await advanceTimers(0);
};

describe('useYoutubeSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    searchMocks.searchYoutubeVideos.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('searches with the trimmed query and maps the results', async () => {
    searchMocks.searchYoutubeVideos.mockResolvedValue([video('v1', 'first')]);

    const { result } = renderHook(() => useYoutubeSearch({ query: '  keyword  ', debounceMs: 0 }), { wrapper: createWrapper() });

    await flush();

    expect(searchMocks.searchYoutubeVideos).toHaveBeenCalledWith(expect.objectContaining({ keyword: 'keyword' }));
    expect(result.current.trimmedQuery).toBe('keyword');
    expect(result.current.status).toBe('success');
    expect(result.current.results).toEqual([expect.objectContaining({ id: 'v1', title: 'first' })]);
  });

  /**
   * 기존 수동 Map 캐시는 trim 전 `query`를 key로 저장하면서 값은 `trimmedQuery`로 조회한 결과를 담아,
   * 공백 차이만으로 같은 검색어가 캐시를 빗나갔다. query key를 trim된 검색어로 통일해 이 경우를 덮는다.
   */
  it('treats queries that differ only by surrounding spaces as the same search', async () => {
    searchMocks.searchYoutubeVideos.mockResolvedValue([video('v1', 'first')]);

    const { result, rerender } = renderHook(({ query }) => useYoutubeSearch({ query, debounceMs: 0 }), {
      wrapper: createWrapper(),
      initialProps: { query: 'keyword' },
    });

    await flush();
    expect(searchMocks.searchYoutubeVideos).toHaveBeenCalledTimes(1);

    rerender({ query: 'keyword  ' });
    await flush();

    expect(searchMocks.searchYoutubeVideos).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('success');
  });

  it('reuses the cached result when the same query comes back', async () => {
    searchMocks.searchYoutubeVideos.mockResolvedValue([video('v1', 'cached')]);

    const { result, rerender } = renderHook(({ query }) => useYoutubeSearch({ query, debounceMs: 0 }), {
      wrapper: createWrapper(),
      initialProps: { query: 'cached' },
    });

    await flush();
    expect(searchMocks.searchYoutubeVideos).toHaveBeenCalledTimes(1);

    rerender({ query: 'other' });
    await flush();
    expect(searchMocks.searchYoutubeVideos).toHaveBeenCalledTimes(2);

    rerender({ query: 'cached' });
    await flush();

    expect(searchMocks.searchYoutubeVideos).toHaveBeenCalledTimes(2);
    expect(result.current.results).toEqual([expect.objectContaining({ id: 'v1', title: 'cached' })]);
  });

  it('keeps the latest results when an older response resolves later', async () => {
    let resolveOld: ((value: unknown) => void) | undefined;
    searchMocks.searchYoutubeVideos
      .mockImplementationOnce(() => new Promise((resolve) => (resolveOld = resolve)))
      .mockResolvedValueOnce([video('v2', 'new result')]);

    const { result, rerender } = renderHook(({ query }) => useYoutubeSearch({ query, debounceMs: 0 }), {
      wrapper: createWrapper(),
      initialProps: { query: 'old' },
    });

    await flush();
    rerender({ query: 'new' });
    await flush();

    expect(result.current.results).toEqual([expect.objectContaining({ id: 'v2' })]);

    // 이전 검색어의 응답이 늦게 도착해도 그 검색어의 cache로만 들어간다.
    await act(async () => {
      resolveOld?.([video('v1', 'old result')]);
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.results).toEqual([expect.objectContaining({ id: 'v2' })]);
  });

  it('does not request search results when disabled', async () => {
    const { result } = renderHook(() => useYoutubeSearch({ query: 'keyword', enabled: false, debounceMs: 0 }), { wrapper: createWrapper() });

    await flush();

    expect(searchMocks.searchYoutubeVideos).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
    expect(result.current.results).toEqual([]);
  });

  it('stays idle until the query reaches the minimum length', async () => {
    searchMocks.searchYoutubeVideos.mockResolvedValue([video('v1', 'first')]);

    const { result, rerender } = renderHook(({ query }) => useYoutubeSearch({ query, debounceMs: 0, minQueryLength: 3 }), {
      wrapper: createWrapper(),
      initialProps: { query: 'ab' },
    });

    await flush();
    expect(searchMocks.searchYoutubeVideos).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');

    rerender({ query: 'abc' });
    await flush();

    expect(searchMocks.searchYoutubeVideos).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('success');
  });
});
