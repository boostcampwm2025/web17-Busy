'use client';

import { useCallback, useMemo } from 'react';

import { useInfiniteScroll, useDebouncedValue } from '@/hooks';
import { ITUNES_SEARCH } from '@/constants';
import { searchUsers } from '@/api';
import { SearchStatus } from '@/types';
import type { SearchUsersResDto } from '@repo/dto';

type SearchUser = SearchUsersResDto['users'][number];

type Options = {
  query: string;
  enabled?: boolean;
  debounceMs?: number;
  minQueryLength?: number;
  limit?: number;
};

type Result = {
  status: SearchStatus;
  results: SearchUser[];
  errorMessage: string | null;
  trimmedQuery: string;

  hasNext: boolean;
  isLoadingMore: boolean;
  ref: (node?: Element | null) => void;
};

const DEFAULT_LIMIT = 10;

const shouldFetch = (enabled: boolean, q: string, minLen: number) => enabled && q.length >= minLen;

export default function useUserSearch({
  query,
  enabled = true,
  debounceMs = ITUNES_SEARCH.DEBOUNCE_MS,
  minQueryLength = ITUNES_SEARCH.MIN_QUERY_LENGTH,
  limit = DEFAULT_LIMIT,
}: Options): Result {
  const debounced = useDebouncedValue(query, debounceMs);
  const trimmedQuery = useMemo(() => debounced.trim(), [debounced]);

  const canFetch = useMemo(() => shouldFetch(enabled, trimmedQuery, minQueryLength), [enabled, trimmedQuery, minQueryLength]);

  const fetchFn = useCallback(
    async (cursor?: string) => {
      if (!canFetch) return { items: [], hasNext: false, nextCursor: undefined };

      const data = await searchUsers(trimmedQuery, cursor, limit);
      const users = Array.isArray(data.users) ? data.users : [];

      return {
        items: users,
        hasNext: Boolean(data.hasNext),
        nextCursor: data.nextCursor,
      };
    },
    [canFetch, trimmedQuery, limit],
  );

  const { items, hasNext, isLoading, isInitialLoading, initialError, errorMsg, ref } = useInfiniteScroll<SearchUser>({
    fetchFn,
    resetKey: canFetch ? trimmedQuery : '',
  });

  const status: SearchStatus = useMemo(() => {
    if (!enabled) return 'idle';
    if (trimmedQuery.length === 0) return 'idle';
    if (trimmedQuery.length < minQueryLength) return 'idle';

    if (initialError) return 'error';
    if (isInitialLoading) return 'loading';
    if (items.length === 0) return 'empty';
    return 'success';
  }, [enabled, trimmedQuery, minQueryLength, initialError, isInitialLoading, items.length]);

  const errorMessage = useMemo(() => {
    if (status === 'error') return initialError?.message ?? '검색 중 오류가 발생했습니다.';
    if (errorMsg) return errorMsg;
    return 'error';
  }, [status, initialError, errorMsg]);

  return {
    status,
    results: items,
    errorMessage,
    trimmedQuery,
    hasNext,
    isLoadingMore: isLoading,
    ref,
  };
}
