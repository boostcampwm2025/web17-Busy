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
  /** 목록마다 고유해야 한다. 값이 바뀌면 새 query가 되어 목록이 처음부터 다시 로드된다. */
  queryKey: QueryKey;
  enabled?: boolean;
}

const selectItems = <T>(page: InfiniteResponse<T>) => page.items;
const getHasNext = <T>(page: InfiniteResponse<T>) => page.hasNext;
const getNextCursor = <T>(page: InfiniteResponse<T>) => page.nextCursor;

export default function useInfiniteScroll<T>({ fetchFn, queryKey, enabled = true }: UseInfiniteScrollParams<T>) {
  return useInfiniteQueryScroll<T, string, InfiniteResponse<T>>({
    queryKey,
    fetchPage: fetchFn,
    selectItems,
    getHasNext,
    getNextCursor,
    enabled,
  });
}
