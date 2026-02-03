'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { MusicResponseDto as Music, PostResponseDto as Post } from '@repo/dto';

import { useRouter } from 'next/navigation';
import { PostHeader } from '../../post';
import { useAuthMe } from '@/hooks/auth/client/useAuthMe';
import { useModalStore, MODAL_TYPES, usePlayerStore } from '@/stores';
import { useScrollLock, usePostDetail, useLikedUsers, usePostReactions } from '@/hooks';
import { usePostReactionOverridesStore } from '@/stores';

import { EMPTY_POST, DEFAULT_IMAGES } from '@/constants';
import { LoadingSpinner, PostMedia } from '@/components';
import { coalesceImageSrc } from '@/utils';

import { PostDetailBody, PostDetailActions, PostDetailCommentComposer, LikedUsersOverlay } from './partials';

// UX 로그
import { enqueueLog } from '@/utils/logQueue';
import { makePostDetailLog } from '@/api/internal/logging';

export const PostCardDetailModal = () => {
  const { userId } = useAuthMe();
  const router = useRouter();
  const { isOpen, modalType, modalProps, closeModal } = useModalStore();
  const enabled = isOpen && modalType === MODAL_TYPES.POST_DETAIL;

  useScrollLock(enabled);

  const postId = enabled ? (modalProps?.postId as string | undefined) : undefined;
  const passedPost = enabled ? ((modalProps?.post as Post | undefined) ?? undefined) : undefined;

  useEffect(() => {
    if (!enabled) return;
    if (!postId) closeModal();
  }, [enabled, postId, closeModal]);

  const { post, isLoading, error } = usePostDetail({ enabled, postId, passedPost });
  const isOwner = userId === post?.author.id;
  const safePost = post ?? passedPost ?? EMPTY_POST;

  const likeOverride = usePostReactionOverridesStore((s) => (postId ? s.likesByPostId[postId] : undefined));

  const initialIsLiked = likeOverride?.isLiked ?? post?.isLiked ?? passedPost?.isLiked ?? false;
  const initialLikeCount = likeOverride?.likeCount ?? post?.likeCount ?? passedPost?.likeCount ?? 0;

  const reactions = usePostReactions({
    enabled: Boolean(enabled && postId),
    postId: postId ?? '',
    initialIsLiked,
    initialLikeCount,
  });

  const [likedUsersOpen, setLikedUsersOpen] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    setLikedUsersOpen(false);
  }, [enabled, postId]);

  const likedUsers = useLikedUsers({
    enabled: Boolean(enabled && postId && likedUsersOpen),
    postId: postId ?? '',
  });

  const playMusic = usePlayerStore((s) => s.playMusic);
  const currentMusicId = usePlayerStore((s) => s.currentMusic?.id ?? null);
  const currentMusic = usePlayerStore((s) => s.currentMusic); // UX
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const profileImg = useMemo(() => coalesceImageSrc(safePost.author.profileImgUrl, DEFAULT_IMAGES.PROFILE), [safePost.author.profileImgUrl]);

  // =========================
  // UX 로그 수집(상세모달)
  // =========================
  const openedAtRef = useRef<number>(0);
  const playedMusicIdsRef = useRef<Set<string>>(new Set());
  const listenMsByMusicRef = useRef<Record<string, number>>({});
  const lastTickRef = useRef<number>(0);
  const emittedRef = useRef<boolean>(false); // 중복 방지

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (!enabled || !postId) return;

    openedAtRef.current = Date.now();
    playedMusicIdsRef.current = new Set();
    listenMsByMusicRef.current = {};
    lastTickRef.current = Date.now();
    emittedRef.current = false; // open 시 reset
  }, [enabled, postId]);

  // 모달에서 재생 트리거(곡 id 기록)
  const handlePlayFromPost = useCallback(
    (m: Music) => {
      if (m?.id) playedMusicIdsRef.current.add(m.id);
      playMusic(m);
    },
    [playMusic],
  );

  // listen time 누적(1초 tick)
  useEffect(() => {
    if (!enabled || !postId) return;

    const postMusicIdSet = new Set((safePost.musics ?? []).map((m) => m.id));

    const tick = () => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      // 로그인 사용자만 수집(서버 /api/logs AuthGuard)
      if (!userId) return;

      if (!isPlaying) return;
      if (!currentMusic?.id) return;

      // 상세 모달 "컨텐츠의 음악"을 재생 중인 경우만 누적
      if (!postMusicIdSet.has(currentMusic.id)) return;

      const prev = listenMsByMusicRef.current[currentMusic.id] ?? 0;
      listenMsByMusicRef.current[currentMusic.id] = prev + Math.max(0, delta);
    };

    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [enabled, postId, safePost.musics, userId, isPlaying, currentMusic?.id]);

  const emitPostDetailSummary = useCallback(() => {
    if (!userId) return; // 로그인 사용자만
    if (!postId) return;

    const dwellMs = openedAtRef.current ? Date.now() - openedAtRef.current : 0;
    const playedMusicCount = playedMusicIdsRef.current.size;
    const listenMsByMusic = listenMsByMusicRef.current;

    enqueueLog(
      makePostDetailLog({
        postId,
        dwellMs,
        playedMusicCount,
        listenMsByMusic,
      }),
    );
  }, [userId, postId]);

  // emitOnce 가드 (중복 2회 기록 방지)
  const emitOnce = useCallback(() => {
    if (emittedRef.current) return;
    emittedRef.current = true;
    emitPostDetailSummary();
  }, [emitPostDetailSummary]);

  const handleClose = useCallback(() => {
    emitOnce();
    closeModal();
  }, [emitOnce, closeModal]);

  // 모달 unmount/disable 시에도 summary 전송(백업) — 단, emitOnce라 중복 없음
  useEffect(() => {
    if (!enabled) return;
    return () => {
      emitOnce();
    };
  }, [enabled, emitOnce]);

  if (!enabled || !postId) return null;

  const handleUserClick = (targetUserId: string) => {
    router.push(`/profile/${targetUserId}`);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
        onClick={handleClose}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="bg-white w-full max-w-5xl h-full max-h-[85vh] rounded-2xl border-2 border-primary shadow-2xl flex flex-col md:flex-row overflow-hidden animate-scale-up"
          onClick={(e) => e.stopPropagation()}
        >
          {isLoading ? (
            <LoadingSpinner />
          ) : error ? (
            <div className="flex-1 flex items-center justify-center bg-gray-4">
              <div className="text-sm font-bold text-gray-500">{error}</div>
            </div>
          ) : (
            <PostMedia post={safePost} variant="modal" currentMusicId={currentMusicId} isPlayingGlobal={isPlaying} onPlay={handlePlayFromPost} />
          )}

          <div className="w-full md:w-105 flex flex-col bg-white border-l-2 border-primary">
            <div className="p-4 border-b-2 border-primary/10">
              <PostHeader post={safePost} isOwner={isOwner} onUserClick={() => handleUserClick(safePost.author.id)} />
            </div>

            <PostDetailBody
              profileImg={profileImg}
              nickname={safePost.author.nickname}
              content={safePost.content}
              comments={reactions.comments}
              commentsLoading={reactions.commentsLoading}
            />

            <PostDetailActions
              isAuthenticated={reactions.isAuthenticated}
              isSubmitting={reactions.isSubmittingLike}
              isLiked={reactions.isLiked}
              likeCount={reactions.likeCount}
              onToggleLike={reactions.toggleLike}
              onOpenLikedUsers={() => setLikedUsersOpen(true)}
            />

            <PostDetailCommentComposer
              isAuthenticated={reactions.isAuthenticated}
              isSubmitting={reactions.isSubmittingComment}
              value={reactions.commentText}
              onChange={reactions.setCommentText}
              onSubmit={reactions.submitComment}
            />
          </div>
        </div>
      </div>

      <LikedUsersOverlay
        isOpen={likedUsersOpen}
        onClose={() => setLikedUsersOpen(false)}
        users={likedUsers.users}
        isLoading={likedUsers.isLoading}
        errorMsg={likedUsers.errorMsg}
        onRetry={likedUsers.refetch}
      />
    </>
  );
};
