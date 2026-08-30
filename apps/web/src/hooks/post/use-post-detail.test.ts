import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PostResponseDto as Post } from '@repo/dto';

import { createTestQueryClient } from '@/test/render-with-query-client';

import { usePostDetail } from './use-post-detail';

const apiMocks = vi.hoisted(() => ({
  getPostDetail: vi.fn(),
}));

vi.mock('@/api/internal/post', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/internal/post')>()),
  getPostDetail: apiMocks.getPostDetail,
}));

const createWrapper = (queryClient: ReturnType<typeof createTestQueryClient>) => {
  const TestQueryClientProvider = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);
  TestQueryClientProvider.displayName = 'TestQueryClientProvider';

  return TestQueryClientProvider;
};

const createPost = (id: string): Post => ({
  id,
  author: { id: 'user-1', nickname: 'tester', profileImgUrl: null },
  coverImgUrl: 'https://example.com/cover.png',
  musics: [],
  content: 'passed content',
  likeCount: 1,
  commentCount: 2,
  createdAt: '2026-08-01T00:00:00.000Z',
  isEdited: false,
  isLiked: false,
});

describe('usePostDetail', () => {
  beforeEach(() => {
    apiMocks.getPostDetail.mockReset();
  });

  it('does not refetch when the list already passed the post as initial data', async () => {
    const queryClient = createTestQueryClient();
    const passedPost = createPost('post-1');

    const { result } = renderHook(() => usePostDetail({ enabled: true, postId: 'post-1', passedPost }), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.post).toEqual(passedPost);
    });

    expect(apiMocks.getPostDetail).not.toHaveBeenCalled();
  });

  it('fetches when the modal is opened without a passed post', async () => {
    const queryClient = createTestQueryClient();
    const fetched = createPost('post-2');
    apiMocks.getPostDetail.mockResolvedValueOnce(fetched);

    const { result } = renderHook(() => usePostDetail({ enabled: true, postId: 'post-2' }), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.post).toEqual(fetched);
    });

    expect(apiMocks.getPostDetail).toHaveBeenCalledTimes(1);
  });

  it('does not refetch when the passed post belongs to a different postId', async () => {
    const queryClient = createTestQueryClient();
    const fetched = createPost('post-3');
    apiMocks.getPostDetail.mockResolvedValueOnce(fetched);

    const { result } = renderHook(() => usePostDetail({ enabled: true, postId: 'post-3', passedPost: createPost('post-9') }), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.post).toEqual(fetched);
    });

    expect(apiMocks.getPostDetail).toHaveBeenCalledTimes(1);
  });
});
