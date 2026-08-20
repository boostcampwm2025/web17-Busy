import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestQueryClient } from '@/test/render-with-query-client';

import useInfiniteScroll from './useInfiniteScroll';

// jsdom에는 IntersectionObserver가 없다. 센티넬이 계속 보이는 상태를 고정한다.
vi.mock('react-intersection-observer', () => ({
  useInView: () => ({ ref: () => {}, inView: true }),
}));

/** 피드가 쓰는 복합 커서. 삭제된 useFeedInfiniteScroll이 전담하던 형태다. */
type FeedCursor = { recent?: string };

interface Item {
  id: string;
}

const TOTAL_PAGES = 3;

const createWrapper = (queryClient: ReturnType<typeof createTestQueryClient>) => {
  const TestQueryClientProvider = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);
  TestQueryClientProvider.displayName = 'TestQueryClientProvider';

  return TestQueryClientProvider;
};

const dedupeById = (items: Item[]) => Array.from(new Map(items.map((item) => [item.id, item])).values());

describe('useInfiniteScroll', () => {
  let requestedCursors: (FeedCursor | undefined)[] = [];

  beforeEach(() => {
    requestedCursors = [];
  });

  /** 페이지마다 항목 1개를 주고, 복합 커서로 다음 페이지를 가리킨다. */
  const fetchWithCompositeCursor = async (cursor?: FeedCursor) => {
    requestedCursors.push(cursor);

    const pageIndex = cursor?.recent ? Number(cursor.recent) : 0;
    const isLastPage = pageIndex >= TOTAL_PAGES - 1;

    return {
      items: [{ id: `item-${pageIndex}` }],
      hasNext: !isLastPage,
      nextCursor: isLastPage ? undefined : { recent: String(pageIndex + 1) },
    };
  };

  it('carries a non-string cursor through to the next page request', async () => {
    const { result } = renderHook(
      () =>
        useInfiniteScroll<Item, FeedCursor>({
          queryKey: ['composite-cursor'],
          fetchFn: fetchWithCompositeCursor,
        }),
      { wrapper: createWrapper(createTestQueryClient()) },
    );

    await waitFor(() => {
      expect(result.current.items).toHaveLength(TOTAL_PAGES);
    });

    // 커서가 문자열로 뭉개지지 않고 객체 형태 그대로 전달돼야 한다.
    expect(requestedCursors).toEqual([undefined, { recent: '1' }, { recent: '2' }]);
    expect(result.current.items.map((item) => item.id)).toEqual(['item-0', 'item-1', 'item-2']);
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
