'use client';

import { useCallback, useMemo } from 'react';

import { useInfiniteScroll, useDebouncedValue } from '@/hooks';
import { ITUNES_SEARCH, MOCK_SEARCH_USERS } from '@/constants';
import { searchUsers } from '@/api';

import type { SearchUsersResDto } from '@repo/dto';

export type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

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

const toFallbackMessage = (): string => '사용자 검색 API 미연동: 목업 데이터로 대체합니다. (백엔드 연동 후 제거)';

const shouldFetch = (enabled: boolean, q: string, minLen: number) => enabled && q.length >= minLen;

const filterMockUsers = (keyword: string): SearchUser[] => {
  const q = keyword.trim().toLowerCase();
  if (!q) return [];
  return MOCK_SEARCH_USERS.filter((u) => u.nickname.toLowerCase().includes(q));
};

const paginateMock = (all: SearchUser[], cursor?: string, limit = DEFAULT_LIMIT): SearchUsersResDto => {
  const offset = cursor ? Math.max(0, Number(cursor)) : 0;
  const users = all.slice(offset, offset + limit);
  const nextOffset = offset + users.length;
  const hasNext = nextOffset < all.length;

  return { users, hasNext, nextCursor: hasNext ? String(nextOffset) : undefined };
};

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

      try {
        const data = await searchUsers(trimmedQuery, cursor, limit);
        const users = Array.isArray(data.users) ? data.users : [];

        return {
          items: users,
          hasNext: Boolean(data.hasNext),
          nextCursor: data.nextCursor,
        };
      } catch {
        /**
         * TODO(BE):
         * - /user/search 백엔드 연동 완료 후 fallback 제거
         * - error UX(토스트/재시도) 정책 확정
         */
        const all = filterMockUsers(trimmedQuery);
        const page = paginateMock(all, cursor, limit);

        return {
          items: page.users,
          hasNext: page.hasNext,
          nextCursor: page.nextCursor,
        };
      }
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
    // mock fallback 사용 중 안내는 "error"가 아니라도 표시 가능(SearchDrawer에서만 노출도 가능)
    return initialError ? toFallbackMessage() : null;
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
