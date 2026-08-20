'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';

const EMPTY_ITEMS: never[] = [];

interface Params<TItem, TCursor, TPage> {
  queryKey: QueryKey;
  fetchPage: (cursor?: TCursor) => Promise<TPage>;
  selectItems: (page: TPage) => TItem[];
  getHasNext: (page: TPage) => boolean;
  getNextCursor: (page: TPage) => TCursor | undefined;
  enabled?: boolean;
  initialItems?: TItem[];
  dedupeItems?: (items: TItem[]) => TItem[];
}

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
  const { ref, inView: isInView } = useInView({ threshold: 0.8, rootMargin: '200px' });
  // 첫 렌더의 initialItems를 고정한다. 이후 호출부가 새 배열을 넘겨도 목록이 흔들리지 않는다.
  const [initialItemsSnapshot] = useState<TItem[]>(() => initialItems ?? []);

  const query = useInfiniteQuery<TPage, Error, TPage[], QueryKey, TCursor | undefined>({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam as TCursor | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => (getHasNext(lastPage) ? getNextCursor(lastPage) : undefined),
    enabled,
    select: (data) => data.pages,
  });

  const pages = query.data ?? EMPTY_ITEMS;

  // query cache에서 바로 파생시킨다. 로컬 state로 복사하면 cache와 어긋날 수 있다.
  const items = useMemo(() => {
    const merged = [...initialItemsSnapshot, ...pages.flatMap(selectItems)];
    return dedupeItems ? dedupeItems(merged) : merged;
  }, [dedupeItems, initialItemsSnapshot, pages, selectItems]);

  const hasNext = query.hasNextPage;
  const initialError = query.isError && pages.length === 0 ? query.error : null;
  const errorMsg = query.isError ? '오류가 발생했습니다.' : null;

  // query는 렌더마다 새 객체라 의존성에 두면 loadMore가 매 렌더 새 참조가 되고, 아래 effect가 매 렌더 재실행된다.
  const fetchNextPage = query.fetchNextPage;
  // 요청 상태(isFetchingNextPage)는 갱신 시점이 늦어 가드로 쓸 수 없다. ref로 동기적으로 잠근다.
  const isLoadingMoreRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (!hasNext) return;
    if (isLoadingMoreRef.current) return;

    isLoadingMoreRef.current = true;

    try {
      await fetchNextPage();
    } finally {
      isLoadingMoreRef.current = false;
    }
  }, [fetchNextPage, hasNext]);

  // 페이지가 도착해도 센티넬이 계속 보이는 경우가 있어 pages.length에도 의존한다.
  // 중복 요청은 loadMore의 in-flight 가드가 막는다.
  useEffect(() => {
    if (!isInView) return;
    void loadMore();
  }, [isInView, loadMore, pages.length]);

  return {
    items,
    hasNext,
    isLoading: query.isFetchingNextPage,
    isInitialLoading: query.isLoading,
    initialError,
    errorMsg,
    ref,
  };
}
