import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestQueryClient } from '@/test/render-with-query-client';

import useInfiniteQueryScroll from './use-infinite-query-scroll';

// jsdom에는 IntersectionObserver가 없다. 센티넬이 계속 보이는 상태를 고정한다.
vi.mock('react-intersection-observer', () => ({
  useInView: () => ({ ref: () => {}, inView: true }),
}));

/** 제거된 고정 지연값. 회차 간 간격이 이 값에 못 미치는지로 지연 부활을 잡는다. */
const REMOVED_SPINNER_DELAY_MS = 300;
const TOTAL_PAGES = 3;

interface TestPage {
  items: string[];
  hasNext: boolean;
  nextCursor?: string;
}

const createWrapper = (queryClient: ReturnType<typeof createTestQueryClient>) => {
  const TestQueryClientProvider = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);
  TestQueryClientProvider.displayName = 'TestQueryClientProvider';

  return TestQueryClientProvider;
};

// 실제 어댑터 훅(useInfiniteScroll)과 같이 모듈 스코프에 둔다.
// 렌더마다 새 참조를 넘기면 queryItems가 매번 새 배열이 되어 setItems effect가 멈추지 않는다.
const QUERY_KEY = ['infinite-scroll-test'];
const selectItems = (page: TestPage) => page.items;
const getHasNext = (page: TestPage) => page.hasNext;
const getNextCursor = (page: TestPage) => page.nextCursor;

const renderInfiniteScroll = (fetchPage: (cursor?: string) => Promise<TestPage>, queryClient = createTestQueryClient()) =>
  renderHook(
    () =>
      useInfiniteQueryScroll<string, string, TestPage>({
        queryKey: QUERY_KEY,
        fetchPage,
        selectItems,
        getHasNext,
        getNextCursor,
      }),
    { wrapper: createWrapper(queryClient) },
  );

describe('useInfiniteQueryScroll', () => {
  let callTimestamps: number[] = [];

  const fetchPage = vi.fn(async (cursor?: string): Promise<TestPage> => {
    callTimestamps.push(Date.now());

    const pageIndex = cursor ? Number(cursor) : 0;
    const isLastPage = pageIndex >= TOTAL_PAGES - 1;

    return {
      items: [`item-${pageIndex}`],
      hasNext: !isLastPage,
      nextCursor: isLastPage ? undefined : String(pageIndex + 1),
    };
  });

  beforeEach(() => {
    callTimestamps = [];
    fetchPage.mockClear();
  });

  it('requests the next page without waiting out a fixed delay', async () => {
    const { result } = renderInfiniteScroll(fetchPage);

    // hasNext는 첫 응답 전에도 false라 대기 조건으로 쓸 수 없다. 실제 적재량으로 기다린다.
    await waitFor(() => {
      expect(result.current.items).toHaveLength(TOTAL_PAGES);
    });

    expect(fetchPage).toHaveBeenCalledTimes(TOTAL_PAGES);

    // 지연이 요청 앞에 되살아나면 연속 요청 간격이 지연값 이상으로 벌어진다.
    const gaps = callTimestamps.slice(1).map((timestamp, index) => timestamp - (callTimestamps[index] ?? 0));

    expect(gaps).toHaveLength(TOTAL_PAGES - 1);
    gaps.forEach((gap) => {
      expect(gap).toBeLessThan(REMOVED_SPINNER_DELAY_MS);
    });
  });

  it('requests each page exactly once while the sentinel stays visible', async () => {
    const { result } = renderInfiniteScroll(fetchPage);

    await waitFor(() => {
      expect(result.current.items).toHaveLength(TOTAL_PAGES);
    });

    expect(result.current.hasNext).toBe(false);

    const requestedCursors = fetchPage.mock.calls.map(([cursor]) => cursor);

    expect(requestedCursors).toEqual([undefined, '1', '2']);
    expect(new Set(requestedCursors).size).toBe(requestedCursors.length);
  });

  it('derives items from the query cache instead of copying them into local state', async () => {
    const queryClient = createTestQueryClient();
    const { result } = renderInfiniteScroll(fetchPage, queryClient);

    await waitFor(() => {
      expect(result.current.items).toHaveLength(TOTAL_PAGES);
    });

    // cache가 목록의 유일한 출처임을 고정한다. 동기화되지 않는 복사본이 다시 생기면 여기서 깨진다.
    queryClient.setQueryData(QUERY_KEY, (current: { pages: TestPage[]; pageParams: unknown[] }) => ({
      ...current,
      pages: current.pages.map((page) => ({ ...page, items: page.items.map((item) => `${item}-patched`) })),
    }));

    await waitFor(() => {
      expect(result.current.items.every((item) => item.endsWith('-patched'))).toBe(true);
    });
  });

  it('does not expose a setter for the item list', async () => {
    const { result } = renderInfiniteScroll(fetchPage);

    await waitFor(() => {
      expect(result.current.items).toHaveLength(TOTAL_PAGES);
    });

    expect(result.current).not.toHaveProperty('setItems');
  });
});
