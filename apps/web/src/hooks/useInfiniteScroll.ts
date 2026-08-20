'use client';

import type { QueryKey } from '@tanstack/react-query';

import useInfiniteQueryScroll from './use-infinite-query-scroll';

/** 목록 API가 맞춰야 하는 응답 계약. 커서 형태는 목록마다 다를 수 있다(피드는 복합 커서). */
interface InfiniteResponse<TItem, TCursor> {
  items: TItem[];
  hasNext: boolean;
  nextCursor?: TCursor;
}

interface UseInfiniteScrollParams<TItem, TCursor> {
  fetchFn: (cursor?: TCursor, limit?: number) => Promise<InfiniteResponse<TItem, TCursor>>;
  /** 목록마다 고유해야 한다. 값이 바뀌면 새 query가 되어 목록이 처음부터 다시 로드된다. */
  queryKey: QueryKey;
  enabled?: boolean;
  /** 서버 응답보다 앞에 놓을 항목. 첫 렌더 값으로 고정된다. */
  initialItems?: TItem[];
  /** 렌더마다 새 참조를 넘기면 목록이 매번 다시 계산된다. 모듈 스코프에 두고 넘긴다. */
  dedupeItems?: (items: TItem[]) => TItem[];
}

const selectItems = <TItem, TCursor>(page: InfiniteResponse<TItem, TCursor>) => page.items;
const getHasNext = <TItem, TCursor>(page: InfiniteResponse<TItem, TCursor>) => page.hasNext;
const getNextCursor = <TItem, TCursor>(page: InfiniteResponse<TItem, TCursor>) => page.nextCursor;

/**
 * 커서 기반 목록 어댑터. 응답을 `InfiniteResponse` 계약으로 고정해 공통 훅에 연결한다.
 * 도메인별 차이(복합 커서, 초기 데이터, 중복 제거)는 호출부가 인자로 넘긴다.
 */
export default function useInfiniteScroll<TItem, TCursor = string>({
  fetchFn,
  queryKey,
  enabled = true,
  initialItems,
  dedupeItems,
}: UseInfiniteScrollParams<TItem, TCursor>) {
  return useInfiniteQueryScroll<TItem, TCursor, InfiniteResponse<TItem, TCursor>>({
    queryKey,
    fetchPage: fetchFn,
    selectItems,
    getHasNext,
    getNextCursor,
    enabled,
    initialItems,
    dedupeItems,
  });
}
