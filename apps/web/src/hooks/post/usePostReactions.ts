'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GetCommentsResDto, UserDto } from '@repo/dto';

import { addLike, removeLike, getComments, createComment } from '@/api/internal';
import { authMe } from '@/api/internal/auth';
import { usePostReactionOverridesStore } from '@/stores/usePostReactionOverridesStore';

type CommentItem = GetCommentsResDto['comments'][number];

type Options = {
  enabled: boolean;
  postId: string;

  initialIsLiked: boolean;
  initialLikeCount: number;

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

const nowIso = () => new Date().toISOString();

const safeComments = (v: unknown): CommentItem[] => {
  if (!v || typeof v !== 'object') return [];
  const list = (v as any).comments;
  if (!Array.isArray(list)) return [];
  return list as CommentItem[];
};

const isTmp = (id: string) => id.startsWith('tmp-');

const mergeComments = (server: CommentItem[], local: CommentItem[]) => {
  const tmp = local.filter((c) => isTmp(c.id));
  if (tmp.length === 0) return server;

  const serverIds = new Set(server.map((c) => c.id));
  const remainingTmp = tmp.filter((c) => !serverIds.has(c.id));

  return [...server, ...remainingTmp];
};

const getEffectivePollMs = (base: number) => {
  const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
  if (hidden) return Math.max(base * 6, 30000);
  return base;
};

export default function usePostReactions({ enabled, postId, initialIsLiked, initialLikeCount, pollMs = 5000 }: Options): Result {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isSubmittingLike, setIsSubmittingLike] = useState(false);

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [commentCount, setCommentCount] = useState(0);

  // 최신 comments를 항상 참조하기 위한 ref (setState updater 내부에서 다른 setState 호출 방지)
  const commentsRef = useRef<CommentItem[]>([]);
  useEffect(() => {
    commentsRef.current = comments;
  }, [comments]);

  const meRef = useRef<UserDto | null>(null);
  const timerRef = useRef<number | null>(null);
  const onlineRef = useRef<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const clearTimer = useCallback(() => {
    if (!timerRef.current) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const setGlobalCommentCount = useCallback(
    (count: number) => {
      // store가 없거나 미구현이면 여기서 타입 에러가 날 수 있음(스토어 확장 필요)
      usePostReactionOverridesStore.getState().setCommentOverride(postId, { commentCount: count });
    },
    [postId],
  );

  /**
   * comments/카운트/스토어를 "한 번에" 맞추는 헬퍼
   * - setComments(updater) 안에서 setState/store set을 호출하지 않도록 분리
   */
  const applyComments = useCallback(
    (next: CommentItem[]) => {
      commentsRef.current = next;
      setComments(next);

      const nextCount = next.length;
      setCommentCount(nextCount);
      setGlobalCommentCount(nextCount);
    },
    [setGlobalCommentCount],
  );

  /**
   * postId가 바뀔 때만 전체 리셋
   */
  useEffect(() => {
    applyComments([]);
    setCommentText('');
    setCommentsLoading(false);

    setIsSubmittingComment(false);
    setIsSubmittingLike(false);

    clearTimer();
  }, [postId, clearTimer, applyComments]);

  /**
   * like 초기값 동기화는 postId 단위로만 반영
   */
  useEffect(() => {
    setIsLiked(initialIsLiked);
    setLikeCount(initialLikeCount);
  }, [postId, initialIsLiked, initialLikeCount]);

  // 내 정보 로드(댓글 optimistic author + 로그인 여부)
  useEffect(() => {
    if (!enabled) return;

    let alive = true;

    const run = async () => {
      try {
        const me = await authMe();
        if (!alive) return;
        meRef.current = me;
        setIsAuthenticated(true);
      } catch {
        if (!alive) return;
        meRef.current = null;
        setIsAuthenticated(false);
      }
    };

    void run();

    return () => {
      alive = false;
    };
  }, [enabled, postId]);

  const refetchComments = useCallback(async () => {
    if (!enabled) return;
    if (!onlineRef.current) return;

    const data = await getComments(postId);
    const server = safeComments(data);

    const merged = mergeComments(server, commentsRef.current);
    applyComments(merged);
  }, [enabled, postId, applyComments]);

  // 최초 댓글 로드
  useEffect(() => {
    if (!enabled) return;

    let alive = true;

    const run = async () => {
      if (!onlineRef.current) return;

      setCommentsLoading(true);
      try {
        const data = await getComments(postId);
        if (!alive) return;

        const server = safeComments(data);
        const merged = mergeComments(server, commentsRef.current);
        applyComments(merged);
      } finally {
        if (alive) setCommentsLoading(false);
      }
    };

    void run();

    return () => {
      alive = false;
    };
  }, [enabled, postId, applyComments]);

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
        if (commentText.trim().length > 0 || isSubmittingComment) {
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
  }, [enabled, pollMs, commentText, isSubmittingComment, refetchComments, clearTimer]);

  // 좋아요 토글(Detail -> Feed 동기화 포함)
  const toggleLike = useCallback(async () => {
    if (!isAuthenticated) return;
    if (isSubmittingLike) return;

    const prevLiked = isLiked;
    const prevCount = likeCount;

    const nextLiked = !prevLiked;
    const nextCount = prevCount + (nextLiked ? 1 : -1);

    setIsSubmittingLike(true);
    setIsLiked(nextLiked);
    setLikeCount(nextCount);

    usePostReactionOverridesStore.getState().setLikeOverride(postId, {
      isLiked: nextLiked,
      likeCount: nextCount,
    });

    try {
      if (nextLiked) await addLike({ postId });
      else await removeLike(postId);
    } catch {
      setIsLiked(prevLiked);
      setLikeCount(prevCount);

      usePostReactionOverridesStore.getState().setLikeOverride(postId, {
        isLiked: prevLiked,
        likeCount: prevCount,
      });
    } finally {
      setIsSubmittingLike(false);
    }
  }, [isAuthenticated, isSubmittingLike, isLiked, likeCount, postId]);

  // 댓글 작성(optimistic + 성공 시 refetch)
  const submitComment = useCallback(async () => {
    if (!isAuthenticated) return;
    if (isSubmittingComment) return;

    const content = commentText.trim();
    if (!content) return;

    const me = meRef.current;
    if (!me) return;

    const tmpId = `tmp-${Date.now()}`;

    const optimistic: CommentItem = {
      id: tmpId,
      content,
      createdAt: nowIso(),
      author: me,
    };

    setIsSubmittingComment(true);
    setCommentText('');

    // optimistic append
    applyComments([...commentsRef.current, optimistic]);

    try {
      const res = await createComment({ postId, content });

      // tmp id -> server id
      const replaced = commentsRef.current.map((c) => (c.id === tmpId ? { ...c, id: res.id } : c));
      applyComments(replaced);

      // 정합성 보정 + 동시 댓글 반영
      await refetchComments();
    } catch {
      // rollback
      const rolled = commentsRef.current.filter((c) => c.id !== tmpId);
      applyComments(rolled);
    } finally {
      setIsSubmittingComment(false);
    }
  }, [isAuthenticated, isSubmittingComment, commentText, postId, refetchComments, applyComments]);

  return {
    isAuthenticated,

    isLiked,
    likeCount,
    toggleLike,
    isSubmittingLike,

    comments,
    commentsLoading,

    commentText,
    setCommentText,
    submitComment,
    isSubmittingComment,

    commentCount,
    refetchComments,
  };
}
