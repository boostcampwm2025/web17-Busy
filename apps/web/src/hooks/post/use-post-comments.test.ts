import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GetCommentsResDto, UserDto } from '@repo/dto';

import { createTestQueryClient } from '@/test/render-with-query-client';

const apiMocks = vi.hoisted(() => ({
  getComments: vi.fn(),
}));
vi.mock('@/api/internal/comment', () => ({ getComments: apiMocks.getComments }));

const mutationMocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  isPending: false,
}));
vi.mock('./use-post-comment-mutation', () => ({
  usePostCommentMutation: () => mutationMocks,
}));

import { usePostComments } from './use-post-comments';

const POST_ID = 'post-1';
const ME: UserDto = { id: 'user-1', nickname: '나' } as UserDto;

const emptyComments: GetCommentsResDto = { comments: [] };

const createWrapper = () => {
  const queryClient = createTestQueryClient();
  const TestQueryClientProvider = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);
  TestQueryClientProvider.displayName = 'TestQueryClientProvider';
  return TestQueryClientProvider;
};

const renderComments = (overrides: Partial<Parameters<typeof usePostComments>[0]> = {}) =>
  renderHook(
    () =>
      usePostComments({
        enabled: true,
        postId: POST_ID,
        initialCommentCount: 0,
        isAuthenticated: true,
        me: ME,
        ...overrides,
      }),
    { wrapper: createWrapper() },
  );

describe('usePostComments', () => {
  beforeEach(() => {
    apiMocks.getComments.mockReset().mockResolvedValue(emptyComments);
    mutationMocks.mutateAsync.mockReset().mockResolvedValue({ id: 'comment-1' });
    mutationMocks.isPending = false;
  });

  it('enabled면 댓글을 조회한다', async () => {
    renderComments();

    await waitFor(() => expect(apiMocks.getComments).toHaveBeenCalledWith(POST_ID));
  });

  it('enabled가 false면 조회하지 않는다', async () => {
    renderComments({ enabled: false });

    await act(async () => {});

    expect(apiMocks.getComments).not.toHaveBeenCalled();
  });

  it('로그인하지 않았으면 댓글을 제출하지 않는다', async () => {
    const { result } = renderComments({ isAuthenticated: false });

    await act(async () => {
      result.current.setCommentText('안녕');
    });
    await act(async () => {
      await result.current.submitComment();
    });

    expect(mutationMocks.mutateAsync).not.toHaveBeenCalled();
  });

  it('빈 내용은 제출하지 않는다', async () => {
    const { result } = renderComments();

    await act(async () => {
      result.current.setCommentText('   ');
    });
    await act(async () => {
      await result.current.submitComment();
    });

    expect(mutationMocks.mutateAsync).not.toHaveBeenCalled();
  });

  it('작성자 정보가 없으면 제출하지 않는다', async () => {
    const { result } = renderComments({ me: null });

    await act(async () => {
      result.current.setCommentText('안녕');
    });
    await act(async () => {
      await result.current.submitComment();
    });

    expect(mutationMocks.mutateAsync).not.toHaveBeenCalled();
  });

  it('정상 제출 시 트림된 내용과 작성자로 mutation을 호출하고 입력을 비운다', async () => {
    const { result } = renderComments();

    await act(async () => {
      result.current.setCommentText('  반가워요  ');
    });
    await act(async () => {
      await result.current.submitComment();
    });

    expect(mutationMocks.mutateAsync).toHaveBeenCalledWith({ content: '반가워요', author: ME, currentCommentCount: 0 });
    expect(result.current.commentText).toBe('');
  });

  /**
   * currentCommentCount는 initialCommentCount 그대로가 아니라, 로드된 댓글 목록 길이를 따른다.
   * "댓글 목록은 query cache가 source of truth"라는 설계를 잠근다.
   */
  it('댓글 수는 initialCommentCount가 아니라 로드된 목록 길이를 따른다', async () => {
    apiMocks.getComments.mockResolvedValue({
      comments: [
        { id: 'c1', content: 'a', createdAt: '', author: ME },
        { id: 'c2', content: 'b', createdAt: '', author: ME },
        { id: 'c3', content: 'c', createdAt: '', author: ME },
      ],
    });

    const { result } = renderComments({ initialCommentCount: 0 });

    await waitFor(() => expect(result.current.comments).toHaveLength(3));

    await act(async () => {
      result.current.setCommentText('네 번째');
    });
    await act(async () => {
      await result.current.submitComment();
    });

    expect(mutationMocks.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ currentCommentCount: 3 }));
  });

  it('제출 중이면 중복 제출하지 않는다', async () => {
    mutationMocks.isPending = true;
    const { result } = renderComments();

    await act(async () => {
      result.current.setCommentText('안녕');
    });
    await act(async () => {
      await result.current.submitComment();
    });

    expect(mutationMocks.mutateAsync).not.toHaveBeenCalled();
  });

  it('enabled가 false면 refetchComments가 아무 것도 하지 않는다', async () => {
    const { result } = renderComments({ enabled: false });

    await act(async () => {
      await result.current.refetchComments();
    });

    expect(apiMocks.getComments).not.toHaveBeenCalled();
  });
});
