'use client';

import { useCallback } from 'react';

import { useAuthMe } from '../auth/client/use-auth-me';
import { usePostComments, type PostComments } from './use-post-comments';
import { usePostLikeMutation } from './use-post-like-mutation';

type Options = {
  enabled: boolean;
  postId: string;

  initialIsLiked: boolean;
  initialLikeCount: number;
  initialCommentCount: number;

  /** 기본 5000ms */
  pollMs?: number;
};

export type PostReactions = PostComments & {
  isAuthenticated: boolean;

  isLiked: boolean;
  likeCount: number;
  toggleLike: () => void;
  isSubmittingLike: boolean;
};

export default function usePostReactions({
  enabled,
  postId,
  initialIsLiked,
  initialLikeCount,
  initialCommentCount,
  pollMs = 5000,
}: Options): PostReactions {
  const { user: me, isAuthenticated: hasSession } = useAuthMe();
  const isAuthenticated = enabled && hasSession;

  const likeMutation = usePostLikeMutation({ postId });

  // 좋아요 토글(Detail -> Feed 동기화 포함)
  // mutateAsync는 실패 시 거절한다. 호출부가 클릭 핸들러라 await하지 않으므로 unhandled rejection이 된다.
  // 롤백은 mutation의 onError가 이미 하므로 fire-and-forget인 mutate로 부른다.
  const toggleLike = useCallback(() => {
    if (!isAuthenticated) return;
    if (likeMutation.isPending) return;
    likeMutation.mutate({ isLiked: initialIsLiked, likeCount: initialLikeCount });
  }, [isAuthenticated, initialIsLiked, initialLikeCount, likeMutation]);

  const postComments = usePostComments({ enabled, postId, initialCommentCount, isAuthenticated, me, pollMs });

  return {
    isAuthenticated,

    isLiked: initialIsLiked,
    likeCount: initialLikeCount,
    toggleLike,
    isSubmittingLike: likeMutation.isPending,

    ...postComments,
  };
}
