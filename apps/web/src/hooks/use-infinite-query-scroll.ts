'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';

const EMPTY_ITEMS: never[] = [];
const SCROLL_SPINNER_DELAY_MS = 300;

type Params<TItem, TCursor, TPage> = {
  queryKey: QueryKey;
  fetchPage: (cursor?: TCursor) => Promise<TPage>;
  selectItems: (page: TPage) => TItem[];
  getHasNext: (page: TPage) => boolean;
  getNextCursor: (page: TPage) => TCursor | undefined;
  enabled?: boolean;
  initialItems?: TItem[];
  dedupeItems?: (items: TItem[]) => TItem[];
};

const delay = () => new Promise((resolve) => window.setTimeout(resolve, SCROLL_SPINNER_DELAY_MS));

export default function useInfiniteQueryScroll<TItem, TCursor, TPage>({
  queryKey,
  fetchPage,
  selectItems,
  getHasNext,
  getNextCursor,
  enabled = true,
  initialItems,
  dedupeItems,
}: Params<TItem, TCursor, TPage>) {
  const queryClient = useQueryClient();
  const { ref, inView: isInView } = useInView({ threshold: 0.8, rootMargin: '200px' });
  const [initialItemsSnapshot] = useState<TItem[]>(() => initialItems ?? []);
  const [items, setItems] = useState<TItem[]>(initialItemsSnapshot);

  const query = useInfiniteQuery<TPage, Error, TPage[], QueryKey, TCursor | undefined>({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam as TCursor | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => (getHasNext(lastPage) ? getNextCursor(lastPage) : undefined),
    enabled,
    select: (data) => data.pages,
  });

  const pages = query.data ?? EMPTY_ITEMS;

  const queryItems = useMemo(() => {
    const merged = [...initialItemsSnapshot, ...pages.flatMap(selectItems)];
    return dedupeItems ? dedupeItems(merged) : merged;
  }, [dedupeItems, initialItemsSnapshot, pages, selectItems]);

  useEffect(() => {
    setItems(queryItems);
  }, [queryItems]);

  const lastPage = pages.at(-1);
  const hasNext = query.hasNextPage;
  const nextCursor = lastPage ? getNextCursor(lastPage) : undefined;
  const initialError = query.isError && pages.length === 0 ? query.error : null;
  const errorMsg = query.isError ? '오류가 발생했습니다.' : null;

  const loadMore = useCallback(async () => {
    if (!hasNext) return;
    if (query.isFetchingNextPage) return;

    await delay();
    await query.fetchNextPage();
  }, [hasNext, query]);

  useEffect(() => {
    if (!isInView) return;
    void loadMore();
  }, [isInView, loadMore]);

  const reset = useCallback(() => {
    setItems(initialItemsSnapshot);
    void queryClient.resetQueries({ queryKey });
  }, [initialItemsSnapshot, queryClient, queryKey]);

  return {
    items,
    setItems,
    hasNext,
    nextCursor,
    isLoading: query.isFetchingNextPage,
    isInitialLoading: query.isLoading,
    initialError,
    errorMsg,
    ref,
    reset,
  };
}
