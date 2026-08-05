'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { GetCommentsResDto } from '@repo/dto';

import { authMe, getComments, queryKeys } from '@/api';
import { usePostReactionOverridesStore } from '@/stores/usePostReactionOverridesStore';
import { AUTH_ME_STALE_TIME_MS } from '../auth/client/useAuthMe';
import { setPostPatchInCaches } from './post-cache-updaters';
import { usePostCommentMutation } from './use-post-comment-mutation';
import { getOptimisticLikeState, usePostLikeMutation } from './use-post-like-mutation';

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

type Result = {
  isAuthenticated: boolean;

  isLiked: boolean;
  likeCount: number;
  toggleLike: () => Promise<void>;
  isSubmittingLike: boolean;

  comments: CommentItem[];
  commentsLoading: boolean;

  commentText: string;
  setCommentText: (v: string) => void;
  submitComment: () => Promise<void>;
  isSubmittingComment: boolean;

  commentCount: number;

  refetchComments: () => Promise<void>;
};

const getEffectivePollMs = (base: number) => {
  const isHidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
  if (isHidden) return Math.max(base * 6, 30000);
  return base;
};

export default function usePostReactions({ enabled, postId, initialIsLiked, initialLikeCount, initialCommentCount, pollMs = 5000 }: Options): Result {
  const queryClient = useQueryClient();

  const likeOverride = usePostReactionOverridesStore((s) => s.likesByPostId[postId]);
  const isLiked = likeOverride?.isLiked ?? initialIsLiked;
  const likeCount = likeOverride?.likeCount ?? initialLikeCount;
  const likeMutation = usePostLikeMutation({ postId });

  const [commentText, setCommentText] = useState('');
  const [commentCount, setCommentCount] = useState(initialCommentCount);

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

  const syncCommentCount = useCallback(
    (count: number) => {
      setCommentCount(count);
      usePostReactionOverridesStore.getState().setCommentOverride(postId, { commentCount: count });
      setPostPatchInCaches(queryClient, postId, { commentCount: count });
    },
    [postId, queryClient],
  );

  const commentMutation = usePostCommentMutation({ postId, onCommentCountChange: setCommentCount });
  const isSubmittingComment = commentMutation.isPending;

  const clearTimer = useCallback(() => {
    if (!timerRef.current) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (!commentsData) return;

    syncCommentCount(comments.length);
  }, [enabled, comments.length, commentsData, syncCommentCount]);

  /**
   * postId가 바뀔 때만 입력/타이머 상태를 초기화한다.
   * 댓글 목록 자체는 postId 기반 query cache가 source of truth로 관리한다.
   */
  useEffect(() => {
    setCommentCount(initialCommentCount);
    setCommentText('');

    clearTimer();
  }, [postId, initialCommentCount, clearTimer]);

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
  const toggleLike = useCallback(async () => {
    if (!isAuthenticated) return;
    if (likeMutation.isPending) return;
    await likeMutation.mutateAsync(getOptimisticLikeState({ isLiked, likeCount }));
  }, [isAuthenticated, isLiked, likeCount, likeMutation]);

  // 댓글 작성(optimistic + 실패 시 rollback)
  const submitComment = useCallback(async () => {
    if (!isAuthenticated) return;
    if (commentMutation.isPending) return;

    const content = commentText.trim();
    if (!content) return;

    if (!me) return;

    setCommentText('');

    try {
      await commentMutation.mutateAsync({ content, author: me, currentCommentCount: commentCount });
    } catch {
      // mutation onError에서 comments cache와 댓글 수를 rollback한다.
    }
  }, [isAuthenticated, commentMutation, commentText, commentCount, me]);

  return {
    isAuthenticated,

    isLiked,
    likeCount,
    toggleLike,
    isSubmittingLike: likeMutation.isPending,

    comments,
    commentsLoading: isCommentsLoading,

    commentText,
    setCommentText,
    submitComment,
    isSubmittingComment,

    commentCount,
    refetchComments,
  };
}
