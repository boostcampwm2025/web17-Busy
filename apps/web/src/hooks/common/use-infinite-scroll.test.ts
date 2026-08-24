import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestQueryClient } from '@/test/render-with-query-client';

import useInfiniteScroll from './use-infinite-scroll';

// jsdom에는 IntersectionObserver가 없다. 센티넬이 계속 보이는 상태를 고정한다.
vi.mock('react-intersection-observer', () => ({
  useInView: () => ({ ref: () => {}, inView: true }),
}));

/** 피드가 쓰는 복합 커서. 삭제된 useFeedInfiniteScroll이 전담하던 형태다. */
type FeedCursor = { recent?: string };

interface Item {
  id: string;
}

/** 제거된 고정 지연값. 회차 간 간격이 이 값에 못 미치는지로 지연 부활을 잡는다. */
const REMOVED_SPINNER_DELAY_MS = 300;
const TOTAL_PAGES = 3;
const CURSOR_QUERY_KEY = ['composite-cursor'];

const createWrapper = (queryClient: ReturnType<typeof createTestQueryClient>) => {
  const TestQueryClientProvider = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);
  TestQueryClientProvider.displayName = 'TestQueryClientProvider';

  return TestQueryClientProvider;
};

const dedupeById = (items: Item[]) => Array.from(new Map(items.map((item) => [item.id, item])).values());

describe('useInfiniteScroll', () => {
  let requestedCursors: (FeedCursor | undefined)[] = [];
  let callTimestamps: number[] = [];

  beforeEach(() => {
    requestedCursors = [];
    callTimestamps = [];
  });

  /** 페이지마다 항목 1개를 주고, 복합 커서로 다음 페이지를 가리킨다. */
  const fetchWithCompositeCursor = vi.fn(async (cursor?: FeedCursor) => {
    requestedCursors.push(cursor);
    callTimestamps.push(Date.now());

    const pageIndex = cursor?.recent ? Number(cursor.recent) : 0;
    const isLastPage = pageIndex >= TOTAL_PAGES - 1;

    return {
      items: [{ id: `item-${pageIndex}` }],
      hasNext: !isLastPage,
      nextCursor: isLastPage ? undefined : { recent: String(pageIndex + 1) },
    };
  });

  const renderWithCompositeCursor = (queryClient = createTestQueryClient()) =>
    renderHook(
      () =>
        useInfiniteScroll<Item, FeedCursor>({
          queryKey: CURSOR_QUERY_KEY,
          fetchFn: fetchWithCompositeCursor,
        }),
      { wrapper: createWrapper(queryClient) },
    );

  it('carries a non-string cursor through to the next page request', async () => {
    const { result } = renderWithCompositeCursor();

    await waitFor(() => {
      expect(result.current.items).toHaveLength(TOTAL_PAGES);
    });

    // 커서가 문자열로 뭉개지지 않고 객체 형태 그대로 전달돼야 한다.
    expect(requestedCursors).toEqual([undefined, { recent: '1' }, { recent: '2' }]);
    expect(result.current.items.map((item) => item.id)).toEqual(['item-0', 'item-1', 'item-2']);
  });

  it('requests each page exactly once while the sentinel stays visible', async () => {
    const { result } = renderWithCompositeCursor();

    await waitFor(() => {
      expect(result.current.items).toHaveLength(TOTAL_PAGES);
    });

    expect(result.current.hasNext).toBe(false);
    expect(requestedCursors).toHaveLength(TOTAL_PAGES);
    expect(new Set(requestedCursors.map((cursor) => cursor?.recent)).size).toBe(TOTAL_PAGES);
  });

  it('requests the next page without waiting out a fixed delay', async () => {
    const { result } = renderWithCompositeCursor();

    await waitFor(() => {
      expect(result.current.items).toHaveLength(TOTAL_PAGES);
    });

    // 지연이 요청 앞에 되살아나면 연속 요청 간격이 지연값 이상으로 벌어진다.
    const gaps = callTimestamps.slice(1).map((timestamp, index) => timestamp - (callTimestamps[index] ?? 0));

    expect(gaps).toHaveLength(TOTAL_PAGES - 1);
    gaps.forEach((gap) => {
      expect(gap).toBeLessThan(REMOVED_SPINNER_DELAY_MS);
    });
  });

  it('derives items from the query cache instead of copying them into local state', async () => {
    const queryClient = createTestQueryClient();
    const { result } = renderWithCompositeCursor(queryClient);

    await waitFor(() => {
      expect(result.current.items).toHaveLength(TOTAL_PAGES);
    });

    // cache가 목록의 유일한 출처임을 고정한다. 동기화되지 않는 복사본이 다시 생기면 여기서 깨진다.
    queryClient.setQueryData(CURSOR_QUERY_KEY, (current: { pages: { items: Item[] }[]; pageParams: unknown[] }) => ({
      ...current,
      pages: current.pages.map((page) => ({ ...page, items: page.items.map((item) => ({ id: `${item.id}-patched` })) })),
    }));

    await waitFor(() => {
      expect(result.current.items.every((item) => item.id.endsWith('-patched'))).toBe(true);
    });
  });

  it('does not expose a setter for the item list', async () => {
    const { result } = renderWithCompositeCursor();

    await waitFor(() => {
      expect(result.current.items).toHaveLength(TOTAL_PAGES);
    });

    expect(result.current).not.toHaveProperty('setItems');
  });

  it('removes items repeated across pages when dedupeItems is given', async () => {
    // 두 페이지가 같은 항목을 함께 반환하는 상황
    const fetchWithOverlap = async (cursor?: FeedCursor) => {
      const pageIndex = cursor?.recent ? Number(cursor.recent) : 0;
      const isLastPage = pageIndex >= 1;

      return {
        items: pageIndex === 0 ? [{ id: 'a' }, { id: 'b' }] : [{ id: 'b' }, { id: 'c' }],
        hasNext: !isLastPage,
        nextCursor: isLastPage ? undefined : { recent: String(pageIndex + 1) },
      };
    };

    const { result } = renderHook(
      () =>
        useInfiniteScroll<Item, FeedCursor>({
          queryKey: ['dedupe'],
          fetchFn: fetchWithOverlap,
          dedupeItems: dedupeById,
        }),
      { wrapper: createWrapper(createTestQueryClient()) },
    );

    await waitFor(() => {
      expect(result.current.hasNext).toBe(false);
    });

    await waitFor(() => {
      expect(result.current.items.map((item) => item.id)).toEqual(['a', 'b', 'c']);
    });
  });

  it('keeps initialItems in front of the pages fetched from the server', async () => {
    const { result } = renderHook(
      () =>
        useInfiniteScroll<Item, FeedCursor>({
          queryKey: ['initial-items'],
          fetchFn: fetchWithCompositeCursor,
          initialItems: [{ id: 'shared-post' }],
        }),
      { wrapper: createWrapper(createTestQueryClient()) },
    );

    // 서버 응답 전에도 초기 항목이 먼저 보인다.
    expect(result.current.items.map((item) => item.id)).toEqual(['shared-post']);

    await waitFor(() => {
      expect(result.current.items).toHaveLength(TOTAL_PAGES + 1);
    });

    expect(result.current.items.map((item) => item.id)).toEqual(['shared-post', 'item-0', 'item-1', 'item-2']);
  });
});
