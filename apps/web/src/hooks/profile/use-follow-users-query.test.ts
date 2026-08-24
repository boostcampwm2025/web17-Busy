import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GetUserFollowDto } from '@repo/dto';

import { queryKeys } from '@/api/queryKeys';
import { createTestQueryClient } from '@/test/render-with-query-client';

// jsdom에는 IntersectionObserver가 없다. 센티넬이 보이지 않는 상태로 고정해 첫 페이지만 읽는다.
vi.mock('react-intersection-observer', () => ({
  useInView: () => ({ ref: () => {}, inView: false }),
}));

const apiMocks = vi.hoisted(() => ({
  getFollowerUsers: vi.fn(),
  getFollowingUsers: vi.fn(),
}));

vi.mock('@/api/internal/follow', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/internal/follow')>()),
  ...apiMocks,
}));

import { useFollowUsersQuery } from './use-follow-users-query';

const USER_ID = 'profile-user';

const followPage = (nickname: string): GetUserFollowDto =>
  ({ users: [{ id: `${nickname}-id`, nickname, profileImgUrl: null, isFollowing: false }], hasNext: false }) as unknown as GetUserFollowDto;

const createWrapper = (queryClient: ReturnType<typeof createTestQueryClient>) => {
  const TestQueryClientProvider = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);
  TestQueryClientProvider.displayName = 'TestQueryClientProvider';

  return TestQueryClientProvider;
};

describe('useFollowUsersQuery', () => {
  beforeEach(() => {
    apiMocks.getFollowerUsers.mockReset().mockResolvedValue(followPage('follower'));
    apiMocks.getFollowingUsers.mockReset().mockResolvedValue(followPage('following'));
  });

  it('reads the follower list for the followers type', async () => {
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useFollowUsersQuery('followers', USER_ID), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0]?.nickname).toBe('follower');
    expect(apiMocks.getFollowerUsers).toHaveBeenCalled();
    expect(apiMocks.getFollowingUsers).not.toHaveBeenCalled();
  });

  /**
   * 두 목록이 같은 key를 쓰면 팔로워를 본 뒤 팔로잉을 열었을 때 이전 목록이 그대로 보인다.
   * 목록 종류를 key에 넣어 캐시를 가른다.
   */
  it('keeps the follower and following lists in separate caches', async () => {
    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);

    const followers = renderHook(() => useFollowUsersQuery('followers', USER_ID), { wrapper });
    await waitFor(() => expect(followers.result.current.items).toHaveLength(1));

    const followings = renderHook(() => useFollowUsersQuery('followings', USER_ID), { wrapper });
    await waitFor(() => expect(followings.result.current.items).toHaveLength(1));

    expect(followers.result.current.items[0]?.nickname).toBe('follower');
    expect(followings.result.current.items[0]?.nickname).toBe('following');
    expect(queryClient.getQueryData(queryKeys.users.list('followers', USER_ID))).toBeDefined();
    expect(queryClient.getQueryData(queryKeys.users.list('followings', USER_ID))).toBeDefined();
  });

  /** 팔로우 mutation이 열려 있는 모든 사용자 목록을 함께 갱신하므로 프리픽스 아래에 있어야 한다. */
  it('stores the list under the shared user-list prefix', async () => {
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useFollowUsersQuery('followers', USER_ID), { wrapper: createWrapper(queryClient) });
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    const prefix = queryKeys.users.lists;
    const cached = queryClient.getQueriesData({ queryKey: prefix });

    expect(cached).toHaveLength(1);
  });
});
