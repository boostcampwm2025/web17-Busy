'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';

const EMPTY_PAGES: never[] = [];

/** 목록 API가 맞춰야 하는 응답 계약. 커서 형태는 목록마다 다를 수 있다(피드는 복합 커서). */
interface InfiniteResponse<TItem, TCursor> {
  items: TItem[];
  hasNext: boolean;
  nextCursor?: TCursor;
}

interface Params<TItem, TCursor> {
  fetchFn: (cursor?: TCursor, limit?: number) => Promise<InfiniteResponse<TItem, TCursor>>;
  /** 목록마다 고유해야 한다. 값이 바뀌면 새 query가 되어 목록이 처음부터 다시 로드된다. */
  queryKey: QueryKey;
  enabled?: boolean;
  /** 서버 응답보다 앞에 놓을 항목. 첫 렌더 값으로 고정된다. */
  initialItems?: TItem[];
  /** 렌더마다 새 참조를 넘기면 목록이 매번 다시 계산된다. 모듈 스코프에 두고 넘긴다. */
  dedupeItems?: (items: TItem[]) => TItem[];
}

/**
 * 커서 기반 무한 스크롤. 센티넬 관측, 다음 페이지 요청, 목록 파생을 함께 담당한다.
 * 목록 API는 응답을 `InfiniteResponse` 형태로 맞춰 넘긴다(`api/internal/post.ts` 참고).
 */
export default function useInfiniteScroll<TItem, TCursor = string>({
  fetchFn,
  queryKey,
  enabled = true,
  initialItems,
  dedupeItems,
}: Params<TItem, TCursor>) {
  const { ref, inView: isInView } = useInView({ threshold: 0.8, rootMargin: '200px' });
  // 첫 렌더의 initialItems를 고정한다. 이후 호출부가 새 배열을 넘겨도 목록이 흔들리지 않는다.
  const [initialItemsSnapshot] = useState<TItem[]>(() => initialItems ?? []);

  const query = useInfiniteQuery<InfiniteResponse<TItem, TCursor>, Error, InfiniteResponse<TItem, TCursor>[], QueryKey, TCursor | undefined>({
    queryKey,
    queryFn: ({ pageParam }) => fetchFn(pageParam as TCursor | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
    enabled,
    select: (data) => data.pages,
  });

  const pages = query.data ?? EMPTY_PAGES;

  // query cache에서 바로 파생시킨다. 로컬 state로 복사하면 cache와 어긋날 수 있다.
  const items = useMemo(() => {
    const merged = [...initialItemsSnapshot, ...pages.flatMap((page) => page.items)];
    return dedupeItems ? dedupeItems(merged) : merged;
  }, [dedupeItems, initialItemsSnapshot, pages]);

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
