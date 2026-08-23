import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NotiResponseDto, UserDto } from '@repo/dto';

import { queryKeys } from '@/api/queryKeys';
import { createTestQueryClient } from '@/test/render-with-query-client';

import { useNotificationsQuery } from './use-notifications-query';

const apiMocks = vi.hoisted(() => ({
  authMe: vi.fn(),
  fetchNotis: vi.fn(),
}));

vi.mock('@/api/internal/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/internal/auth')>()),
  authMe: apiMocks.authMe,
}));

vi.mock('@/api/internal/noti', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/internal/noti')>()),
  fetchNotis: apiMocks.fetchNotis,
}));

const user: UserDto = { id: 'user-1', nickname: '지훈', profileImgUrl: null };

const notification = (id: string, isRead: boolean): NotiResponseDto =>
  ({
    id,
    isRead,
    type: 'LIKE',
    createdAt: '2026-08-10T00:00:00.000Z',
  }) as unknown as NotiResponseDto;

const createWrapper = (queryClient: ReturnType<typeof createTestQueryClient>) => {
  const TestQueryClientProvider = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);
  TestQueryClientProvider.displayName = 'TestQueryClientProvider';

  return TestQueryClientProvider;
};

describe('useNotificationsQuery', () => {
  beforeEach(() => {
    apiMocks.authMe.mockReset();
    apiMocks.fetchNotis.mockReset();
  });

  /**
   * 이전에는 `AuthBootstrap`이 `useAuthMe` 결과를 zustand로 복사해 줘야만 인증 상태를 알 수 있었다.
   * 이제는 auth cache를 직접 구독하므로 bridge 컴포넌트 없이도 조회가 활성화된다.
   */
  it('enables the query from the auth cache without a bridge component', async () => {
    apiMocks.authMe.mockResolvedValue(user);
    apiMocks.fetchNotis.mockResolvedValue([notification('noti-1', false)]);
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKeys.auth.me, user);

    const { result } = renderHook(() => useNotificationsQuery(), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(apiMocks.fetchNotis).toHaveBeenCalled();
    expect(result.current.unreadCount).toBe(1);
  });

  /**
   * bridge가 `useEffect`로 zustand를 갱신하던 구조에서는 cache가 이미 채워져 있어도
   * 첫 렌더에서 로그아웃 상태로 보였다. query를 직접 구독하면 그 지연 창이 사라진다.
   */
  it('reflects the logged-in state on the very first render', () => {
    apiMocks.authMe.mockResolvedValue(user);
    apiMocks.fetchNotis.mockResolvedValue([notification('noti-1', false)]);
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKeys.auth.me, user);
    queryClient.setQueryData(queryKeys.notifications.all, [notification('noti-1', false), notification('noti-2', true)]);

    // effect가 한 번 돌고 나서 맞아지는 것으로는 부족하다. 첫 렌더의 값이 이미 맞아야 한다.
    const statuses: string[] = [];
    const { result } = renderHook(
      () => {
        const query = useNotificationsQuery();
        statuses.push(query.status);
        return query;
      },
      { wrapper: createWrapper(queryClient) },
    );

    expect(statuses[0]).toBe('success');
    expect(result.current.unreadCount).toBe(1);
  });

  it('stays disabled while the user is not authenticated', async () => {
    apiMocks.authMe.mockRejectedValue(new Error('unauthorized'));
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useNotificationsQuery(), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(result.current.status).toBe('no-login'));
    expect(apiMocks.fetchNotis).not.toHaveBeenCalled();
  });

  it('starts fetching once authMe resolves', async () => {
    apiMocks.authMe.mockResolvedValue(user);
    apiMocks.fetchNotis.mockResolvedValue([]);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useNotificationsQuery(), { wrapper: createWrapper(queryClient) });

    expect(apiMocks.fetchNotis).not.toHaveBeenCalled();

    await waitFor(() => expect(apiMocks.fetchNotis).toHaveBeenCalled());
    await waitFor(() => expect(result.current.status).toBe('success'));
  });
});
