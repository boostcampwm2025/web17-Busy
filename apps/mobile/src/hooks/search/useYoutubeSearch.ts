import { useEffect, useMemo, useRef, useState } from 'react';
import { searchYoutubeVideos } from '@/src/api/youtube';
import { youtubeVideoToMusic } from '@/src/mappers';
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue';
import { YOUTUBE_SEARCH } from '@/src/constants';
import type { MusicResponseDto as Music } from '@repo/dto';

type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

type Options = {
  query: string;
  enabled?: boolean;
  debounceMs?: number;
  minQueryLength?: number;
};

type Result = {
  status: SearchStatus;
  results: Music[];
  errorMessage: string | null;
  trimmedQuery: string;
};

export function useYoutubeSearch({
  query,
  enabled = true,
  debounceMs = YOUTUBE_SEARCH.DEBOUNCE_MS,
  minQueryLength = YOUTUBE_SEARCH.MIN_QUERY_LENGTH,
}: Options): Result {
  const debounced = useDebouncedValue(query, debounceMs);
  const trimmedQuery = useMemo(() => debounced.trim(), [debounced]);

  const [status, setStatus] = useState<SearchStatus>('idle');
  const [results, setResults] = useState<Music[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const cache = useRef(new Map<string, Music[]>());

  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;

    if (!enabled || trimmedQuery.length < minQueryLength) {
      setStatus('idle');
      setResults([]);
      setErrorMessage(null);
      return;
    }

    if (cache.current.has(trimmedQuery)) {
      const cached = cache.current.get(trimmedQuery)!;
      setResults(cached);
      setStatus(cached.length > 0 ? 'success' : 'empty');
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
          limit: YOUTUBE_SEARCH.DEFAULT_LIMIT,
          signal: controller.signal,
        });

        const mapped = items.map(youtubeVideoToMusic);
        if (!alive) return;

        cache.current.set(trimmedQuery, mapped);
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
  }, [enabled, trimmedQuery, minQueryLength]);

  return { status, results, errorMessage, trimmedQuery };
}
