import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ItunesSearchResponse, ItunesSongResult } from '@/api/itunes/searchSongs';
import { createTestQueryClient } from '@/test/render-with-query-client';

import useItunesSearch from './use-itunes-search';

const searchMocks = vi.hoisted(() => ({
  searchItunesSongs: vi.fn(),
}));

vi.mock('@/api/itunes/searchSongs', () => ({
  searchItunesSongs: searchMocks.searchItunesSongs,
}));

vi.mock('@/mappers/itunesSongToMusic', () => ({
  itunesSongToMusic: (track: ItunesSongResult) => ({
    id: String(track.trackId),
    provider: 'ITUNES',
    trackUri: track.previewUrl ?? '',
    albumCoverUrl: track.artworkUrl100 ?? '',
    title: track.trackName,
    artistName: track.artistName,
    durationMs: track.trackTimeMillis ?? 0,
  }),
}));

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

const createDeferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

const createResponse = (trackId: number, title: string): ItunesSearchResponse => ({
  resultCount: 1,
  results: [
    {
      trackId,
      trackName: title,
      artistName: 'artist',
      previewUrl: `https://example.com/${trackId}.mp3`,
      artworkUrl100: `https://example.com/${trackId}-100x100bb.jpg`,
      trackTimeMillis: 180000,
    },
  ],
});

const emptyResponse: ItunesSearchResponse = {
  resultCount: 0,
  results: [],
};

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
 * query 상태 전이가 React state로 반영될 때까지 기다린다.
 * TanStack Query는 구독자 알림을 setTimeout으로 배치하므로 마이크로태스크만 흘려서는 부족하다.
 */
const flush = () => advanceTimers(0);

describe('useItunesSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    searchMocks.searchItunesSongs.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces rapid query changes and searches only the last query', async () => {
    searchMocks.searchItunesSongs.mockResolvedValue(createResponse(1, 'final keyword'));

    const { result, rerender } = renderHook(({ query }) => useItunesSearch({ query, debounceMs: 300 }), {
      wrapper: createWrapper(),
      initialProps: { query: '' },
    });

    expect(result.current.status).toBe('idle');

    rerender({ query: 'fi' });
    await advanceTimers(100);
    rerender({ query: 'final' });
    await advanceTimers(299);

    expect(searchMocks.searchItunesSongs).not.toHaveBeenCalled();

    await advanceTimers(1);
    await flush();

    expect(searchMocks.searchItunesSongs).toHaveBeenCalledTimes(1);
    expect(searchMocks.searchItunesSongs).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: 'final',
        signal: expect.any(AbortSignal),
      }),
    );
    expect(result.current.results).toEqual([expect.objectContaining({ id: '1', title: 'final keyword' })]);
  });

  it('does not request search results when disabled', async () => {
    const { result } = renderHook(() => useItunesSearch({ query: 'keyword', enabled: false, debounceMs: 0 }), { wrapper: createWrapper() });

    await advanceTimers(0);
    await flush();

    expect(searchMocks.searchItunesSongs).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
    expect(result.current.results).toEqual([]);
  });

  it('aborts the previous request when the debounced query changes', async () => {
    searchMocks.searchItunesSongs.mockImplementation(() => new Promise(() => {}));

    const { rerender } = renderHook(({ query }) => useItunesSearch({ query, debounceMs: 0 }), {
      wrapper: createWrapper(),
      initialProps: { query: 'first' },
    });

    await flush();
    expect(searchMocks.searchItunesSongs).toHaveBeenCalledTimes(1);

    const firstSignal = searchMocks.searchItunesSongs.mock.calls[0]?.[0].signal as AbortSignal;
    expect(firstSignal.aborted).toBe(false);

    rerender({ query: 'second' });
    await advanceTimers(0);
    await flush();

    expect(searchMocks.searchItunesSongs).toHaveBeenCalledTimes(2);
    expect(firstSignal.aborted).toBe(true);
    expect((searchMocks.searchItunesSongs.mock.calls[1]?.[0].signal as AbortSignal).aborted).toBe(false);
  });

  it('keeps the latest results when an older response resolves later', async () => {
    const first = createDeferred<ItunesSearchResponse>();
    const second = createDeferred<ItunesSearchResponse>();

    searchMocks.searchItunesSongs.mockImplementationOnce(() => first.promise).mockImplementationOnce(() => second.promise);

    const { result, rerender } = renderHook(({ query }) => useItunesSearch({ query, debounceMs: 0 }), {
      wrapper: createWrapper(),
      initialProps: { query: 'old' },
    });

    await flush();
    rerender({ query: 'new' });
    await advanceTimers(0);
    await flush();

    await act(async () => {
      second.resolve(createResponse(2, 'new result'));
      await Promise.resolve();
    });
    await flush();

    expect(result.current.status).toBe('success');
    expect(result.current.results).toEqual([expect.objectContaining({ id: '2', title: 'new result' })]);

    await act(async () => {
      first.resolve(createResponse(1, 'old result'));
      await Promise.resolve();
    });
    await flush();

    expect(result.current.status).toBe('success');
    expect(result.current.results).toEqual([expect.objectContaining({ id: '2', title: 'new result' })]);
  });

  it('moves from loading to empty when the search response has no playable results', async () => {
    const search = createDeferred<ItunesSearchResponse>();
    searchMocks.searchItunesSongs.mockReturnValue(search.promise);

    const { result } = renderHook(() => useItunesSearch({ query: 'empty', debounceMs: 0 }), { wrapper: createWrapper() });

    await flush();
    expect(result.current.status).toBe('loading');

    await act(async () => {
      search.resolve(emptyResponse);
      await Promise.resolve();
    });
    await flush();

    expect(result.current.status).toBe('empty');
    expect(result.current.results).toEqual([]);
  });

  it('reuses the cached result when the same query comes back', async () => {
    searchMocks.searchItunesSongs.mockResolvedValue(createResponse(1, 'cached'));

    const { result, rerender } = renderHook(({ query }) => useItunesSearch({ query, debounceMs: 0 }), {
      wrapper: createWrapper(),
      initialProps: { query: 'cached' },
    });

    await flush();
    expect(searchMocks.searchItunesSongs).toHaveBeenCalledTimes(1);

    rerender({ query: 'other' });
    await advanceTimers(0);
    await flush();
    expect(searchMocks.searchItunesSongs).toHaveBeenCalledTimes(2);

    // 이전에 조회한 검색어로 돌아오면 재요청 없이 캐시된 결과를 보여준다.
    rerender({ query: 'cached' });
    await advanceTimers(0);
    await flush();

    expect(searchMocks.searchItunesSongs).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('success');
    expect(result.current.results).toEqual([expect.objectContaining({ id: '1', title: 'cached' })]);
  });

  it('reports an error without retrying', async () => {
    searchMocks.searchItunesSongs.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useItunesSearch({ query: 'broken', debounceMs: 0 }), { wrapper: createWrapper() });

    await flush();

    expect(searchMocks.searchItunesSongs).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('error');
    expect(result.current.errorMessage).toBe('boom');
    expect(result.current.results).toEqual([]);
  });
});
