import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SearchUsersResDto } from '@repo/dto';

import { createTestQueryClient } from '@/test/render-with-query-client';

// jsdom에는 IntersectionObserver가 없다. 센티넬이 계속 보이는 상태로 고정한다(use-infinite-scroll.test.ts와 동일).
vi.mock('react-intersection-observer', () => ({
  useInView: () => ({ ref: () => {}, inView: true }),
}));

const apiMocks = vi.hoisted(() => ({ searchUsers: vi.fn() }));
vi.mock('@/api/internal/user', () => ({ searchUsers: apiMocks.searchUsers }));

import useUserSearch from './use-user-search';

const user = (id: string) => ({ id, nickname: `user-${id}`, profileImgUrl: null }) as SearchUsersResDto['users'][number];

const response = (users: SearchUsersResDto['users'], hasNext = false): SearchUsersResDto => ({ users, hasNext, nextCursor: undefined });

const createWrapper = () => {
  const queryClient = createTestQueryClient();
  const TestQueryClientProvider = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);
  TestQueryClientProvider.displayName = 'TestQueryClientProvider';
  return TestQueryClientProvider;
};

const advanceTimers = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

/** TanStack Query는 구독자 알림을 setTimeout으로 배치하므로 마이크로태스크만 흘려서는 부족하다. */
const flush = () => advanceTimers(0);

describe('useUserSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    apiMocks.searchUsers.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('짧은 검색어는 idle을 유지하고 요청하지 않는다', async () => {
    const { result } = renderHook(() => useUserSearch({ query: 'a', debounceMs: 0, minQueryLength: 2 }), { wrapper: createWrapper() });

    await flush();

    expect(apiMocks.searchUsers).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('디바운스 후 최소 길이를 넘긴 검색어로 요청한다', async () => {
    apiMocks.searchUsers.mockResolvedValue(response([user('1')]));

    const { result, rerender } = renderHook(({ query }) => useUserSearch({ query, debounceMs: 300, minQueryLength: 2 }), {
      wrapper: createWrapper(),
      initialProps: { query: '' },
    });

    rerender({ query: 'j' });
    await advanceTimers(100);
    rerender({ query: 'jae' });
    await advanceTimers(299);

    expect(apiMocks.searchUsers).not.toHaveBeenCalled();

    await advanceTimers(1);
    await flush();

    expect(apiMocks.searchUsers).toHaveBeenCalledTimes(1);
    expect(apiMocks.searchUsers).toHaveBeenCalledWith('jae', undefined, expect.any(Number));
    expect(result.current.results).toEqual([user('1')]);
    expect(result.current.status).toBe('success');
  });

  it('결과가 없으면 empty를 반환한다', async () => {
    apiMocks.searchUsers.mockResolvedValue(response([]));

    const { result } = renderHook(() => useUserSearch({ query: 'nobody', debounceMs: 0, minQueryLength: 2 }), { wrapper: createWrapper() });

    await flush();

    expect(result.current.status).toBe('empty');
    expect(result.current.results).toEqual([]);
  });

  it('요청이 실패하면 error를 반환하고 재시도하지 않는다', async () => {
    apiMocks.searchUsers.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useUserSearch({ query: 'broken', debounceMs: 0, minQueryLength: 2 }), { wrapper: createWrapper() });

    await flush();

    expect(apiMocks.searchUsers).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('error');
    expect(result.current.errorMessage).toBeTruthy();
  });

  it('enabled가 false면 요청하지 않는다', async () => {
    const { result } = renderHook(() => useUserSearch({ query: 'jae', enabled: false, debounceMs: 0, minQueryLength: 2 }), {
      wrapper: createWrapper(),
    });

    await flush();

    expect(apiMocks.searchUsers).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });
});
