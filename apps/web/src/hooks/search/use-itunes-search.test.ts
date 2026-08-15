import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ItunesSearchResponse, ItunesSongResult } from '@/api/itunes/searchSongs';

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

const advanceTimers = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
    await Promise.resolve();
  });
};

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
      initialProps: { query: '' },
    });

    expect(result.current.status).toBe('idle');

    rerender({ query: 'fi' });
    await advanceTimers(100);
    rerender({ query: 'final' });
    await advanceTimers(299);

    expect(searchMocks.searchItunesSongs).not.toHaveBeenCalled();

    await advanceTimers(1);

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
    const { result } = renderHook(() => useItunesSearch({ query: 'keyword', enabled: false, debounceMs: 0 }));

    await advanceTimers(0);

    expect(searchMocks.searchItunesSongs).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
    expect(result.current.results).toEqual([]);
  });

  it('aborts the previous request when the debounced query changes', async () => {
    searchMocks.searchItunesSongs.mockImplementation(() => new Promise(() => {}));

    const { rerender } = renderHook(({ query }) => useItunesSearch({ query, debounceMs: 0 }), {
      initialProps: { query: 'first' },
    });

    expect(searchMocks.searchItunesSongs).toHaveBeenCalledTimes(1);

    const firstSignal = searchMocks.searchItunesSongs.mock.calls[0]?.[0].signal as AbortSignal;
    expect(firstSignal.aborted).toBe(false);

    rerender({ query: 'second' });
    await advanceTimers(0);

    expect(searchMocks.searchItunesSongs).toHaveBeenCalledTimes(2);
    expect(firstSignal.aborted).toBe(true);
    expect((searchMocks.searchItunesSongs.mock.calls[1]?.[0].signal as AbortSignal).aborted).toBe(false);
  });

  it('keeps the latest results when an older response resolves later', async () => {
    const first = createDeferred<ItunesSearchResponse>();
    const second = createDeferred<ItunesSearchResponse>();

    searchMocks.searchItunesSongs.mockImplementationOnce(() => first.promise).mockImplementationOnce(() => second.promise);

    const { result, rerender } = renderHook(({ query }) => useItunesSearch({ query, debounceMs: 0 }), {
      initialProps: { query: 'old' },
    });

    rerender({ query: 'new' });
    await advanceTimers(0);

    await act(async () => {
      second.resolve(createResponse(2, 'new result'));
      await Promise.resolve();
    });

    expect(result.current.status).toBe('success');
    expect(result.current.results).toEqual([expect.objectContaining({ id: '2', title: 'new result' })]);

    await act(async () => {
      first.resolve(createResponse(1, 'old result'));
      await Promise.resolve();
    });

    expect(result.current.status).toBe('success');
    expect(result.current.results).toEqual([expect.objectContaining({ id: '2', title: 'new result' })]);
  });

  it('moves from loading to empty when the search response has no playable results', async () => {
    const search = createDeferred<ItunesSearchResponse>();
    searchMocks.searchItunesSongs.mockReturnValue(search.promise);

    const { result } = renderHook(() => useItunesSearch({ query: 'empty', debounceMs: 0 }));

    expect(result.current.status).toBe('loading');

    await act(async () => {
      search.resolve(emptyResponse);
      await Promise.resolve();
    });

    expect(result.current.status).toBe('empty');
    expect(result.current.results).toEqual([]);
  });
});
