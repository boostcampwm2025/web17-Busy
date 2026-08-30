import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GetUserDto as Profile, UserDto } from '@repo/dto';

import { queryKeys } from '@/api/queryKeys';
import { createTestQueryClient } from '@/test/render-with-query-client';

const apiMocks = vi.hoisted(() => ({
  addFollow: vi.fn(),
  removeFollow: vi.fn(),
  updateProfile: vi.fn(),
}));
vi.mock('@/api/internal/follow', () => ({ addFollow: apiMocks.addFollow, removeFollow: apiMocks.removeFollow }));
vi.mock('@/api/internal/user', () => ({ updateProfile: apiMocks.updateProfile }));

import { useProfileFollowMutation, useUpdateProfileMutation } from './use-profile-mutations';

const createProfile = (overrides: Partial<Profile>): Profile =>
  ({
    id: 'user-1',
    nickname: 'user',
    profileImgUrl: null,
    bio: null,
    followerCount: 0,
    followingCount: 0,
    isFollowing: false,
    ...overrides,
  }) as Profile;

const createWrapper = (queryClient: ReturnType<typeof createTestQueryClient>) => {
  const TestQueryClientProvider = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);
  TestQueryClientProvider.displayName = 'TestQueryClientProvider';
  return TestQueryClientProvider;
};

describe('useProfileFollowMutation', () => {
  beforeEach(() => {
    apiMocks.addFollow.mockReset().mockResolvedValue(undefined);
    apiMocks.removeFollow.mockReset().mockResolvedValue(undefined);
  });

  it('안 팔로우 상태였으면 addFollow를 호출한다', async () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useProfileFollowMutation(), { wrapper: createWrapper(queryClient) });

    await act(async () => {
      await result.current.mutateAsync({ targetUserId: 'target-1', viewerUserId: 'viewer-1', wasFollowing: false });
    });

    expect(apiMocks.addFollow).toHaveBeenCalledWith('target-1');
    expect(apiMocks.removeFollow).not.toHaveBeenCalled();
  });

  it('팔로우 상태였으면 removeFollow를 호출한다', async () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useProfileFollowMutation(), { wrapper: createWrapper(queryClient) });

    await act(async () => {
      await result.current.mutateAsync({ targetUserId: 'target-1', viewerUserId: 'viewer-1', wasFollowing: true });
    });

    expect(apiMocks.removeFollow).toHaveBeenCalledWith('target-1');
    expect(apiMocks.addFollow).not.toHaveBeenCalled();
  });

  it('성공하면 대상 프로필 캐시의 팔로우 상태와 팔로워 수를 반영한다', async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKeys.profiles.detail('target-1'), createProfile({ id: 'target-1', isFollowing: false, followerCount: 2 }));
    const { result } = renderHook(() => useProfileFollowMutation(), { wrapper: createWrapper(queryClient) });

    await act(async () => {
      await result.current.mutateAsync({ targetUserId: 'target-1', viewerUserId: 'viewer-1', wasFollowing: false });
    });

    expect(queryClient.getQueryData(queryKeys.profiles.detail('target-1'))).toMatchObject({ isFollowing: true, followerCount: 3 });
  });

  it('viewer와 target이 같으면 프로필 캐시를 한 번만 무효화한다', async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useProfileFollowMutation(), { wrapper: createWrapper(queryClient) });

    await act(async () => {
      await result.current.mutateAsync({ targetUserId: 'user-1', viewerUserId: 'user-1', wasFollowing: false });
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.profiles.detail('user-1') });
  });

  it('viewer와 target이 다르면 둘 다 무효화한다', async () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useProfileFollowMutation(), { wrapper: createWrapper(queryClient) });

    await act(async () => {
      await result.current.mutateAsync({ targetUserId: 'target-1', viewerUserId: 'viewer-1', wasFollowing: false });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.profiles.detail('target-1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.profiles.detail('viewer-1') });
  });
});

describe('useUpdateProfileMutation', () => {
  beforeEach(() => {
    apiMocks.updateProfile.mockReset().mockResolvedValue(undefined);
  });

  it('성공하면 대상 프로필 캐시의 닉네임을 갱신한다', async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKeys.profiles.detail('user-1'), createProfile({ id: 'user-1', nickname: 'before' }));
    const { result } = renderHook(() => useUpdateProfileMutation('user-1'), { wrapper: createWrapper(queryClient) });

    await act(async () => {
      await result.current.mutateAsync({ nickname: 'after', bio: '' });
    });

    expect(queryClient.getQueryData(queryKeys.profiles.detail('user-1'))).toMatchObject({ nickname: 'after' });
  });

  /** setting에서 닉네임을 바꾸면 헤더 등 auth.me를 구독하는 곳도 즉시 새 닉네임을 봐야 한다 */
  it('로그인 사용자(auth.me) 캐시의 닉네임도 함께 갱신한다', async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKeys.auth.me, { id: 'user-1', nickname: 'before' } as UserDto);
    const { result } = renderHook(() => useUpdateProfileMutation('user-1'), { wrapper: createWrapper(queryClient) });

    await act(async () => {
      await result.current.mutateAsync({ nickname: 'after', bio: '' });
    });

    expect(queryClient.getQueryData(queryKeys.auth.me)).toMatchObject({ nickname: 'after' });
  });

  it('auth.me 캐시가 비어 있으면 채우지 않는다', async () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useUpdateProfileMutation('user-1'), { wrapper: createWrapper(queryClient) });

    await act(async () => {
      await result.current.mutateAsync({ nickname: 'after', bio: '' });
    });

    expect(queryClient.getQueryData(queryKeys.auth.me)).toBeUndefined();
  });
});
