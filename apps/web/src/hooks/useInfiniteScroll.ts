'use client';

import type { QueryKey } from '@tanstack/react-query';

import useInfiniteQueryScroll from './use-infinite-query-scroll';

interface InfiniteResponse<T> {
  items: T[];
  hasNext: boolean;
  nextCursor?: string; // UUID
}

interface UseInfiniteScrollParams<T> {
  fetchFn: (cursor?: string, limit?: number) => Promise<InfiniteResponse<T>>;
  queryKey?: QueryKey;
  /** query 변경 등으로 목록을 초기화해야 할 때 사용 */
  resetKey?: string;
  enabled?: boolean;
}

const selectItems = <T>(page: InfiniteResponse<T>) => page.items;
const getHasNext = <T>(page: InfiniteResponse<T>) => page.hasNext;
const getNextCursor = <T>(page: InfiniteResponse<T>) => page.nextCursor;

export default function useInfiniteScroll<T>({ fetchFn, queryKey, resetKey, enabled = true }: UseInfiniteScrollParams<T>) {
  return useInfiniteQueryScroll<T, string, InfiniteResponse<T>>({
    queryKey: queryKey ?? ['infinite-scroll', resetKey ?? 'default'],
    fetchPage: fetchFn,
    selectItems,
    getHasNext,
    getNextCursor,
    enabled,
  });
}
