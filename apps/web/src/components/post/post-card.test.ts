import { fireEvent, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PostResponseDto as Post } from '@repo/dto';
import { queryKeys } from '@/api/queryKeys';
import { createTestQueryClient, renderWithQueryClient } from '@/test/render-with-query-client';

const apiMocks = vi.hoisted(() => ({ addLike: vi.fn(), removeLike: vi.fn() }));
vi.mock('@/api/internal/like', () => ({ addLike: apiMocks.addLike, removeLike: apiMocks.removeLike }));

vi.mock('@/hooks/auth/client/use-auth-me', () => ({
  useAuthMe: () => ({ user: null, userId: 'me', isAuthenticated: true, isLoading: false }),
}));

import PostCard from './PostCard';

const POST: Post = {
  id: 'post-1',
  author: { id: 'author-1', nickname: 'nick', profileImgUrl: '' },
  coverImgUrl: 'https://example.com/cover.jpg',
  content: 'content',
  likeCount: 1,
  commentCount: 0,
  createdAt: new Date(0).toISOString(),
  musics: [],
  isLiked: false,
  isEdited: false,
};

const renderPostCard = (queryClient: ReturnType<typeof createTestQueryClient>) =>
  renderWithQueryClient(
    createElement(PostCard, {
      post: POST,
      currentMusicId: null,
      isPlayingGlobal: false,
      onPlay: vi.fn(),
      onUserClick: vi.fn(),
      onOpenDetail: vi.fn(),
    }),
    { queryClient },
  );

/** Node는 마이크로태스크 큐가 비워진 뒤에야 unhandledRejection을 발화한다. */
const flushRejections = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
};

describe('PostCard like button', () => {
  const rejections: unknown[] = [];
  const collectRejection = (reason: unknown) => rejections.push(reason);

  beforeEach(() => {
    rejections.length = 0;
    apiMocks.addLike.mockReset();
    apiMocks.removeLike.mockReset();
    process.on('unhandledRejection', collectRejection);
  });

  afterEach(() => {
    process.off('unhandledRejection', collectRejection);
  });

  /**
   * 좋아요 실패는 흔하다(네트워크 끊김·세션 만료).
   * 클릭 핸들러를 await하는 쪽이 없으므로 여기서 거절이 새면 그대로 unhandled rejection이 된다.
   */
  it('does not leak an unhandled rejection when the like request fails', async () => {
    apiMocks.addLike.mockRejectedValue(new Error('like failed'));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKeys.posts.detail(POST.id), { ...POST });

    renderPostCard(queryClient);
    fireEvent.click(screen.getByTitle('좋아요'));

    await waitFor(() => expect(apiMocks.addLike).toHaveBeenCalledTimes(1));
    await flushRejections();

    expect(rejections).toEqual([]);
  });

  it('rolls the optimistic like back into the cache after a failure', async () => {
    apiMocks.addLike.mockRejectedValue(new Error('like failed'));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(queryKeys.posts.detail(POST.id), { ...POST });

    renderPostCard(queryClient);
    fireEvent.click(screen.getByTitle('좋아요'));

    await waitFor(() => {
      const cached = queryClient.getQueryData<Post>(queryKeys.posts.detail(POST.id));
      expect(cached).toMatchObject({ isLiked: false, likeCount: 1 });
    });
  });

  it('sends the like request once per click', async () => {
    apiMocks.addLike.mockResolvedValue({ ok: true });
    const queryClient = createTestQueryClient();

    renderPostCard(queryClient);
    fireEvent.click(screen.getByTitle('좋아요'));

    await waitFor(() => expect(apiMocks.addLike).toHaveBeenCalledWith({ postId: POST.id }));
    await flushRejections();

    expect(rejections).toEqual([]);
  });
});
