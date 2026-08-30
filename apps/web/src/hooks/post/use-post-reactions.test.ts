import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserDto } from '@repo/dto';

const authMocks = vi.hoisted(() => ({ isAuthenticated: true, user: { id: 'user-1' } as UserDto }));
vi.mock('../auth/client/use-auth-me', () => ({
  useAuthMe: () => ({ user: authMocks.user, userId: authMocks.user?.id ?? null, isAuthenticated: authMocks.isAuthenticated, isLoading: false }),
}));

const likeMutationMocks = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }));
vi.mock('./use-post-like-mutation', () => ({
  usePostLikeMutation: () => likeMutationMocks,
}));

const postCommentsMocks = vi.hoisted(() => ({
  comments: [],
  commentsLoading: false,
  commentText: '',
  setCommentText: vi.fn(),
  submitComment: vi.fn(),
  isSubmittingComment: false,
  refetchComments: vi.fn(),
}));
const usePostCommentsSpy = vi.hoisted(() => vi.fn(() => postCommentsMocks));
vi.mock('./use-post-comments', () => ({
  usePostComments: usePostCommentsSpy,
}));

import usePostReactions from './use-post-reactions';

describe('usePostReactions', () => {
  beforeEach(() => {
    authMocks.isAuthenticated = true;
    authMocks.user = { id: 'user-1' } as UserDto;
    likeMutationMocks.mutate.mockReset();
    likeMutationMocks.isPending = false;
    usePostCommentsSpy.mockClear();
  });

  const options = { enabled: true, postId: 'post-1', initialIsLiked: false, initialLikeCount: 2, initialCommentCount: 0 };

  it('로그인 안 됨 + enabled면 isAuthenticated는 false다', () => {
    authMocks.isAuthenticated = false;
    const { result } = renderHook((props: typeof options) => usePostReactions(props), { initialProps: options });

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('로그인 됨이어도 enabled가 false면 isAuthenticated는 false다', () => {
    const { result } = renderHook((props: typeof options) => usePostReactions(props), { initialProps: { ...options, enabled: false } });

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('로그인 됨 + enabled면 isAuthenticated는 true다', () => {
    const { result } = renderHook((props: typeof options) => usePostReactions(props), { initialProps: options });

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('로그인하지 않았으면 좋아요를 토글하지 않는다', () => {
    authMocks.isAuthenticated = false;
    const { result } = renderHook(() => usePostReactions(options));

    result.current.toggleLike();

    expect(likeMutationMocks.mutate).not.toHaveBeenCalled();
  });

  it('로그인했으면 현재 좋아요 상태를 반전해 mutation을 호출한다', () => {
    const { result } = renderHook(() => usePostReactions({ ...options, initialIsLiked: false, initialLikeCount: 2 }));

    result.current.toggleLike();

    expect(likeMutationMocks.mutate).toHaveBeenCalledWith({ isLiked: false, likeCount: 2 });
  });

  it('mutation이 진행 중이면 다시 토글하지 않는다', () => {
    likeMutationMocks.isPending = true;
    const { result } = renderHook(() => usePostReactions(options));

    result.current.toggleLike();

    expect(likeMutationMocks.mutate).not.toHaveBeenCalled();
  });

  it('usePostComments에 파생된 isAuthenticated와 me를 그대로 전달한다', () => {
    renderHook(() => usePostReactions(options));

    expect(usePostCommentsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true, postId: 'post-1', isAuthenticated: true, me: authMocks.user }),
    );
  });

  it('usePostComments가 반환한 필드를 그대로 노출한다', () => {
    const { result } = renderHook(() => usePostReactions(options));

    expect(result.current.comments).toBe(postCommentsMocks.comments);
    expect(result.current.submitComment).toBe(postCommentsMocks.submitComment);
    expect(result.current.refetchComments).toBe(postCommentsMocks.refetchComments);
  });
});
