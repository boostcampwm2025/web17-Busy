'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { GetCommentsResDto } from '@repo/dto';

import { authMe } from '@/api/internal/auth';
import { getComments } from '@/api/internal/comment';
import { queryKeys } from '@/api/queryKeys';
import { AUTH_ME_STALE_TIME_MS } from '../auth/client/use-auth-me';
import { setPostPatchInCaches } from './post-cache-updaters';
import { usePostCommentMutation } from './use-post-comment-mutation';
import { usePostLikeMutation } from './use-post-like-mutation';

type CommentItem = GetCommentsResDto['comments'][number];

type Options = {
  enabled: boolean;
  postId: string;

  initialIsLiked: boolean;
  initialLikeCount: number;
  initialCommentCount: number;

  /** 기본 5000ms */
  pollMs?: number;
};

export type PostReactions = {
  isAuthenticated: boolean;

  isLiked: boolean;
  likeCount: number;
  toggleLike: () => void;
  isSubmittingLike: boolean;

  comments: CommentItem[];
  commentsLoading: boolean;

  commentText: string;
  setCommentText: (v: string) => void;
  submitComment: () => Promise<void>;
  isSubmittingComment: boolean;

  refetchComments: () => Promise<void>;
};

const getEffectivePollMs = (base: number) => {
  const isHidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
  if (isHidden) return Math.max(base * 6, 30000);
  return base;
};

export default function usePostReactions({
  enabled,
  postId,
  initialIsLiked,
  initialLikeCount,
  initialCommentCount,
  pollMs = 5000,
}: Options): PostReactions {
  const queryClient = useQueryClient();

  const likeMutation = usePostLikeMutation({ postId });

  const [commentText, setCommentText] = useState('');

  const timerRef = useRef<number | null>(null);
  const onlineRef = useRef<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const { data: me = null } = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: authMe,
    enabled,
    retry: false,
    staleTime: AUTH_ME_STALE_TIME_MS,
  });

  const isAuthenticated = enabled && Boolean(me);

  const {
    data: commentsData,
    isLoading: isCommentsLoading,
    refetch: refetchCommentsQuery,
  } = useQuery({
    queryKey: queryKeys.posts.comments(postId),
    queryFn: () => getComments(postId),
    enabled,
  });

  const comments = commentsData?.comments ?? [];
  const currentCommentCount = commentsData ? comments.length : initialCommentCount;

  const commentMutation = usePostCommentMutation({ postId });

  const clearTimer = useCallback(() => {
    if (!timerRef.current) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (!commentsData) return;

    setPostPatchInCaches(queryClient, postId, { commentCount: comments.length });
  }, [enabled, comments.length, commentsData, postId, queryClient]);

  /**
   * postId가 바뀔 때만 입력/타이머 상태를 초기화한다.
   * 댓글 목록 자체는 postId 기반 query cache가 source of truth로 관리한다.
   */
  useEffect(() => {
    setCommentText('');

    clearTimer();
  }, [postId, clearTimer]);

  const refetchComments = useCallback(async () => {
    if (!enabled) return;
    if (!onlineRef.current) return;

    await refetchCommentsQuery();
  }, [enabled, refetchCommentsQuery]);

  // 댓글 폴링(모달 열린 동안만)
  useEffect(() => {
    if (!enabled) {
      clearTimer();
      return;
    }

    const schedule = () => {
      clearTimer();
      const effective = getEffectivePollMs(pollMs);

      timerRef.current = window.setTimeout(() => {
        // 입력 중/전송 중이면 skip
        if (commentText.trim().length > 0 || commentMutation.isPending) {
          schedule();
          return;
        }
        if (!onlineRef.current) {
          schedule();
          return;
        }

        void refetchComments().finally(schedule);
      }, effective);
    };

    const onOnline = () => {
      onlineRef.current = true;
      void refetchComments();
      schedule();
    };

    const onOffline = () => {
      onlineRef.current = false;
      schedule();
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    schedule();

    return () => {
      clearTimer();
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [enabled, pollMs, commentText, commentMutation.isPending, refetchComments, clearTimer]);

  // 좋아요 토글(Detail -> Feed 동기화 포함)
  // mutateAsync는 실패 시 거절한다. 호출부가 클릭 핸들러라 await하지 않으므로 unhandled rejection이 된다.
  // 롤백은 mutation의 onError가 이미 하므로 fire-and-forget인 mutate로 부른다.
  const toggleLike = useCallback(() => {
    if (!isAuthenticated) return;
    if (likeMutation.isPending) return;
    likeMutation.mutate({ isLiked: initialIsLiked, likeCount: initialLikeCount });
  }, [isAuthenticated, initialIsLiked, initialLikeCount, likeMutation]);

  // 댓글 작성(optimistic + 실패 시 rollback)
  const submitComment = useCallback(async () => {
    if (!isAuthenticated) return;
    if (commentMutation.isPending) return;

    const content = commentText.trim();
    if (!content) return;

    if (!me) return;

    setCommentText('');

    try {
      await commentMutation.mutateAsync({ content, author: me, currentCommentCount });
    } catch {
      // mutation onError에서 comments cache와 댓글 수를 rollback한다.
    }
  }, [isAuthenticated, commentMutation, commentText, currentCommentCount, me]);

  return {
    isAuthenticated,

    isLiked: initialIsLiked,
    likeCount: initialLikeCount,
    toggleLike,
    isSubmittingLike: likeMutation.isPending,

    comments,
    commentsLoading: isCommentsLoading,

    commentText,
    setCommentText,
    submitComment,
    isSubmittingComment: commentMutation.isPending,

    refetchComments,
  };
}
