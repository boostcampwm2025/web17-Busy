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

    if (!enabled || trimmedQuery.length === 0 || trimmedQuery.length < minQueryLength) {
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
      // 캐시에 데이터 있으면 추가 요청 없이 사용
      if (cache.current.has(query)) {
        const cachedItems = cache.current.get(query) ?? [];
        setResults(cachedItems);
        setStatus(cachedItems.length > 0 ? 'success' : 'empty');
        return;
      }

      try {
        const items = await searchYoutubeVideos({
          keyword: trimmedQuery,
          signal: controller.signal,
        });

        const mapped = items.map(youtubeVideoToMusic);

        if (!alive) return;

        // 캐시 업데이트
        cache.current.set(query, mapped);

        // 상태 업데이트
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

    run();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [enabled, trimmedQuery, minQueryLength]);

  return { status, results, errorMessage, trimmedQuery };
}
