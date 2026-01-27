'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { searchYoutubeVideos } from '@/api';
import { youtubeVideoToMusic } from '@/mappers';
import { useDebouncedValue } from '@/hooks';
import { YOUTUBE_SEARCH } from '@/constants';
import { SearchStatus } from '@/types';
import type { MusicResponseDto as Music } from '@repo/dto';

type Options = {
  query: string;
  enabled?: boolean;
  debounceMs?: number;
  minQueryLength?: number;
  limit?: number;
  country?: typeof YOUTUBE_SEARCH.COUNTRY;
};

type Result = {
  status: SearchStatus;
  results: Music[];
  errorMessage: string | null;
  trimmedQuery: string;
};

export default function useYoutubeSearch({
  query,
  enabled = true,
  debounceMs = YOUTUBE_SEARCH.DEBOUNCE_MS,
  minQueryLength = YOUTUBE_SEARCH.MIN_QUERY_LENGTH,
  limit = YOUTUBE_SEARCH.DEFAULT_LIMIT,
  country = YOUTUBE_SEARCH.COUNTRY,
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
        const items = await searchYoutubeVideos({
          keyword: trimmedQuery,
          limit,
          country,
          signal: controller.signal,
        });

        const mapped = items.map(youtubeVideoToMusic);

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
