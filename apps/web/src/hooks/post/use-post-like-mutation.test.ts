import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@/api';
import { createTestQueryClient } from '@/test/render-with-query-client';

import { usePostLikeMutation } from './use-post-like-mutation';

const apiMocks = vi.hoisted(() => ({
  addLike: vi.fn(),
  removeLike: vi.fn(),
}));

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>();

  return {
    ...actual,
    addLike: apiMocks.addLike,
    removeLike: apiMocks.removeLike,
  };
});

const createWrapper = (queryClient: ReturnType<typeof createTestQueryClient>) => {
  const TestQueryClientProvider = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);
  TestQueryClientProvider.displayName = 'TestQueryClientProvider';

  return TestQueryClientProvider;
};

describe('usePostLikeMutation', () => {
  beforeEach(() => {
    apiMocks.addLike.mockReset();
    apiMocks.removeLike.mockReset();
  });

  it('keeps optimistic like cache changes when the mutation succeeds', async () => {
    const queryClient = createTestQueryClient();
    apiMocks.addLike.mockResolvedValueOnce({ ok: true });
    queryClient.setQueryData(queryKeys.posts.detail('post-1'), {
      id: 'post-1',
      isLiked: false,
      likeCount: 1,
    });

    const { result } = renderHook(() => usePostLikeMutation({ postId: 'post-1' }), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({ isLiked: false, likeCount: 1 });

    expect(apiMocks.addLike).toHaveBeenCalledWith({ postId: 'post-1' });
    expect(queryClient.getQueryData(queryKeys.posts.detail('post-1'))).toMatchObject({
      isLiked: true,
      likeCount: 2,
    });
  });

  it('rolls back optimistic like cache changes when the mutation fails', async () => {
    const queryClient = createTestQueryClient();
    apiMocks.addLike.mockRejectedValueOnce(new Error('like failed'));
    queryClient.setQueryData(queryKeys.posts.detail('post-1'), {
      id: 'post-1',
      isLiked: false,
      likeCount: 1,
    });

    const { result } = renderHook(() => usePostLikeMutation({ postId: 'post-1' }), {
      wrapper: createWrapper(queryClient),
    });

    await expect(result.current.mutateAsync({ isLiked: false, likeCount: 1 })).rejects.toThrow('like failed');

    expect(queryClient.getQueryData(queryKeys.posts.detail('post-1'))).toEqual({
      id: 'post-1',
      isLiked: false,
      likeCount: 1,
    });
  });
});
