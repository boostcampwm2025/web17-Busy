import type { GetCommentsResDto, UserDto } from '@repo/dto';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@/api';
import { createTestQueryClient } from '@/test/render-with-query-client';

import { usePostCommentMutation } from './use-post-comment-mutation';

const apiMocks = vi.hoisted(() => ({
  createComment: vi.fn(),
}));

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>();

  return {
    ...actual,
    createComment: apiMocks.createComment,
  };
});

const createWrapper = (queryClient: ReturnType<typeof createTestQueryClient>) => {
  const TestQueryClientProvider = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);
  TestQueryClientProvider.displayName = 'TestQueryClientProvider';

  return TestQueryClientProvider;
};

const author = {
  id: 'user-1',
  nickname: 'tester',
  profileImgUrl: null,
} as unknown as UserDto;

describe('usePostCommentMutation', () => {
  beforeEach(() => {
    apiMocks.createComment.mockReset();
    vi.spyOn(Date, 'now').mockReturnValue(123);
  });

  it('adds an optimistic comment and replaces the temporary id when the mutation succeeds', async () => {
    const queryClient = createTestQueryClient();
    apiMocks.createComment.mockResolvedValueOnce({ message: 'created', id: 'comment-1' });
    queryClient.setQueryData<GetCommentsResDto>(queryKeys.posts.comments('post-1'), { comments: [] });
    queryClient.setQueryData(queryKeys.posts.detail('post-1'), {
      id: 'post-1',
      commentCount: 0,
    });

    const { result } = renderHook(() => usePostCommentMutation({ postId: 'post-1' }), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({
      content: 'hello',
      author,
      currentCommentCount: 0,
    });

    expect(apiMocks.createComment).toHaveBeenCalledWith({ postId: 'post-1', content: 'hello' });
    expect(queryClient.getQueryData<GetCommentsResDto>(queryKeys.posts.comments('post-1'))).toMatchObject({
      comments: [{ id: 'comment-1', content: 'hello', author }],
    });
    expect(queryClient.getQueryData(queryKeys.posts.detail('post-1'))).toMatchObject({
      commentCount: 1,
    });
  });

  it('rolls back optimistic comment and count changes when the mutation fails', async () => {
    const queryClient = createTestQueryClient();
    apiMocks.createComment.mockRejectedValueOnce(new Error('comment failed'));
    const previousComments = {
      comments: [{ id: 'comment-old', content: 'before', author, createdAt: '2026-08-10T00:00:00.000Z' }],
    } as unknown as GetCommentsResDto;

    queryClient.setQueryData(queryKeys.posts.comments('post-1'), previousComments);
    queryClient.setQueryData(queryKeys.posts.detail('post-1'), {
      id: 'post-1',
      commentCount: 1,
    });

    const { result } = renderHook(() => usePostCommentMutation({ postId: 'post-1' }), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      result.current.mutateAsync({
        content: 'hello',
        author,
        currentCommentCount: 1,
      }),
    ).rejects.toThrow('comment failed');

    expect(queryClient.getQueryData(queryKeys.posts.comments('post-1'))).toEqual(previousComments);
    expect(queryClient.getQueryData(queryKeys.posts.detail('post-1'))).toEqual({
      id: 'post-1',
      commentCount: 1,
    });
  });
});
