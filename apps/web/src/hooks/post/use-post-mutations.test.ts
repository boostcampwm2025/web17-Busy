import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PostResponseDto as Post } from '@repo/dto';

import { queryKeys } from '@/api/queryKeys';
import { createTestQueryClient } from '@/test/render-with-query-client';

const apiMocks = vi.hoisted(() => ({
  deletePost: vi.fn(),
  updatePost: vi.fn(),
}));

vi.mock('@/api/internal/post', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/internal/post')>()),
  deletePost: apiMocks.deletePost,
  updatePost: apiMocks.updatePost,
}));

import { useDeletePostMutation, useUpdatePostMutation } from './use-post-mutations';

const POST_ID = 'post-1';

const post = (overrides: Partial<Post> = {}): Post => ({ id: POST_ID, content: '원본', ...overrides }) as unknown as Post;

const createWrapper = (queryClient: ReturnType<typeof createTestQueryClient>) => {
  const TestQueryClientProvider = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);
  TestQueryClientProvider.displayName = 'TestQueryClientProvider';

  return TestQueryClientProvider;
};

describe('useDeletePostMutation', () => {
  beforeEach(() => {
    apiMocks.deletePost.mockReset().mockResolvedValue(undefined);
  });

  /** 삭제한 게시글의 상세 key가 남아 있으면 다음 구독에서 404를 다시 조회한다. */
  it('drops the deleted post from the caches', async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKeys.posts.detail(POST_ID), post());

    const { result } = renderHook(() => useDeletePostMutation({ postId: POST_ID }), { wrapper: createWrapper(queryClient) });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(queryKeys.posts.detail(POST_ID))).toBeUndefined();
  });

  it('runs onDeleted before the caches are refreshed', async () => {
    const queryClient = createTestQueryClient();
    const onDeleted = vi.fn();

    const { result } = renderHook(() => useDeletePostMutation({ postId: POST_ID, onDeleted }), { wrapper: createWrapper(queryClient) });
    result.current.mutate();

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
  });

  it('keeps the cache intact when the request fails', async () => {
    apiMocks.deletePost.mockRejectedValue(new Error('network'));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKeys.posts.detail(POST_ID), post());

    const { result } = renderHook(() => useDeletePostMutation({ postId: POST_ID }), { wrapper: createWrapper(queryClient) });
    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(queryKeys.posts.detail(POST_ID))).toEqual(post());
  });
});

describe('useUpdatePostMutation', () => {
  beforeEach(() => {
    apiMocks.updatePost.mockReset().mockResolvedValue(undefined);
  });

  it('writes the new content into the post caches', async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKeys.posts.detail(POST_ID), post());

    const { result } = renderHook(() => useUpdatePostMutation({ postId: POST_ID }), { wrapper: createWrapper(queryClient) });
    result.current.mutate('수정된 내용');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData<Post>(queryKeys.posts.detail(POST_ID))?.content).toBe('수정된 내용');
    expect(apiMocks.updatePost).toHaveBeenCalledWith(POST_ID, { content: '수정된 내용' });
  });

  it('leaves the cached content alone when the request fails', async () => {
    apiMocks.updatePost.mockRejectedValue(new Error('network'));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKeys.posts.detail(POST_ID), post());

    const { result } = renderHook(() => useUpdatePostMutation({ postId: POST_ID }), { wrapper: createWrapper(queryClient) });
    result.current.mutate('수정된 내용');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData<Post>(queryKeys.posts.detail(POST_ID))?.content).toBe('원본');
  });
});
