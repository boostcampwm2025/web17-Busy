import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LikedUserDto } from '@repo/dto';

import { createTestQueryClient } from '@/test/render-with-query-client';

import useLikedUsers from './use-liked-users';
import { usePostLikeMutation } from './use-post-like-mutation';

const apiMocks = vi.hoisted(() => ({
  getLikedUsers: vi.fn(),
  addLike: vi.fn(),
  removeLike: vi.fn(),
}));

vi.mock('@/api/internal/like', () => ({
  getLikedUsers: apiMocks.getLikedUsers,
  addLike: apiMocks.addLike,
  removeLike: apiMocks.removeLike,
}));

vi.mock('@/api/internal', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/internal')>()),
  getLikedUsers: apiMocks.getLikedUsers,
}));

const POST_ID = 'post-1';

const likedUser = (id: string): LikedUserDto => ({ id, nickname: `user-${id}`, profileImgUrl: null }) as LikedUserDto;

const createWrapper = (queryClient: ReturnType<typeof createTestQueryClient>) => {
  const TestQueryClientProvider = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);
  TestQueryClientProvider.displayName = 'TestQueryClientProvider';

  return TestQueryClientProvider;
};

describe('useLikedUsers', () => {
  beforeEach(() => {
    apiMocks.getLikedUsers.mockReset();
    apiMocks.addLike.mockReset();
    apiMocks.removeLike.mockReset();
  });

  it('does not fetch until the overlay is opened', async () => {
    apiMocks.getLikedUsers.mockResolvedValue([likedUser('a')]);
    const queryClient = createTestQueryClient();

    const { result, rerender } = renderHook(({ enabled }) => useLikedUsers({ enabled, postId: POST_ID }), {
      wrapper: createWrapper(queryClient),
      initialProps: { enabled: false },
    });

    expect(apiMocks.getLikedUsers).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.users).toEqual([]);

    rerender({ enabled: true });

    await waitFor(() => expect(result.current.users).toEqual([likedUser('a')]));
    expect(apiMocks.getLikedUsers).toHaveBeenCalledWith(POST_ID);
  });

  it('does not fetch without a postId', async () => {
    apiMocks.getLikedUsers.mockResolvedValue([]);
    const queryClient = createTestQueryClient();

    const { result } = renderHook(() => useLikedUsers({ enabled: true, postId: '' }), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(apiMocks.getLikedUsers).not.toHaveBeenCalled();
  });

  /**
   * 이 훅이 `queryKeys.posts.likedUsers`를 구독하기 전에는
   * `usePostLikeMutation`의 invalidate가 아무 query에도 닿지 않아 공회전했다.
   */
  it('refetches when a like mutation invalidates the liked users cache', async () => {
    apiMocks.getLikedUsers.mockResolvedValueOnce([likedUser('a')]).mockResolvedValueOnce([likedUser('a'), likedUser('me')]);
    apiMocks.addLike.mockResolvedValue({ ok: true });

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);

    const list = renderHook(() => useLikedUsers({ enabled: true, postId: POST_ID }), { wrapper });
    await waitFor(() => expect(list.result.current.users).toEqual([likedUser('a')]));
    expect(apiMocks.getLikedUsers).toHaveBeenCalledTimes(1);

    const like = renderHook(() => usePostLikeMutation({ postId: POST_ID }), { wrapper });
    await act(async () => {
      await like.result.current.mutateAsync({ isLiked: false, likeCount: 1 });
    });

    await waitFor(() => expect(apiMocks.getLikedUsers).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(list.result.current.users).toEqual([likedUser('a'), likedUser('me')]));
  });

  it('reports an error without keeping the previous list', async () => {
    apiMocks.getLikedUsers.mockResolvedValueOnce([likedUser('a')]).mockRejectedValueOnce(new Error('network'));

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useLikedUsers({ enabled: true, postId: POST_ID }), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(result.current.users).toEqual([likedUser('a')]));

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.errorMsg).toBe('좋아요 목록을 불러오지 못했습니다.'));
    expect(result.current.users).toEqual([]);
    // '다시 시도'가 바로 뜨도록 재시도 없이 한 번만 호출한다.
    expect(apiMocks.getLikedUsers).toHaveBeenCalledTimes(2);
  });

  it('refetches on demand when the retry button asks for it', async () => {
    apiMocks.getLikedUsers.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce([likedUser('a')]);

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useLikedUsers({ enabled: true, postId: POST_ID }), { wrapper: createWrapper(queryClient) });

    await waitFor(() => expect(result.current.errorMsg).not.toBeNull());

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.users).toEqual([likedUser('a')]));
    expect(result.current.errorMsg).toBeNull();
  });
});
