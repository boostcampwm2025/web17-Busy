'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { searchItunesSongs } from '@/api';
import { itunesSongToMusic } from '@/mappers';
import { useDebouncedValue } from '@/hooks';
import { ITUNES_SEARCH } from '@/constants';
import { MusicResponseDto as Music } from '@repo/dto';

export type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

type Options = {
  query: string;
  enabled?: boolean;
  debounceMs?: number;
  minQueryLength?: number;
  limit?: number;
  country?: typeof ITUNES_SEARCH.COUNTRY;
};

type Result = {
  status: SearchStatus;
  results: Music[];
  errorMessage: string | null;
  trimmedQuery: string;
};

const filterPlayable = (musics: Music[]): Music[] => musics.filter((m) => m.trackUri.trim().length > 0);

export default function useItunesSearch({
  query,
  enabled = true,
  debounceMs = ITUNES_SEARCH.DEBOUNCE_MS,
  minQueryLength = ITUNES_SEARCH.MIN_QUERY_LENGTH,
  limit = ITUNES_SEARCH.DEFAULT_LIMIT,
  country = ITUNES_SEARCH.COUNTRY,
}: Options): Result {
  const debounced = useDebouncedValue(query, debounceMs);
  const trimmedQuery = useMemo(() => debounced.trim(), [debounced]);

  const [status, setStatus] = useState<SearchStatus>('idle');
  const [results, setResults] = useState<Music[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;

    if (!enabled) {
      setStatus('idle');
      setResults([]);
      setErrorMessage(null);
      return;
    }

    if (trimmedQuery.length === 0) {
      setStatus('idle');
      setResults([]);
      setErrorMessage(null);
      return;
    }

    if (trimmedQuery.length < minQueryLength) {
      setStatus('idle');
      setResults([]);
      setErrorMessage(null);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setErrorMessage(null);

    let alive = true;

    const run = async () => {
      try {
        const data = await searchItunesSongs({
          keyword: trimmedQuery,
          limit,
          country,
          signal: controller.signal,
        });

        const mapped = filterPlayable(data.results.map(itunesSongToMusic));

        if (!alive) return;

        setResults(mapped);
        setStatus(mapped.length > 0 ? 'success' : 'empty');
      } catch (e) {
        if (!alive) return;

        const err = e as { name?: string; message?: string };
        if (err?.name === 'AbortError') return;

        setResults([]);
        setStatus('error');
        setErrorMessage(err?.message ?? '검색 중 오류가 발생했습니다.');
      }
    };

    void run();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [enabled, trimmedQuery, minQueryLength, limit, country]);

  return { status, results, errorMessage, trimmedQuery };
}
