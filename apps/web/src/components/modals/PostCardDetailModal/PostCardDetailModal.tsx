'use client';

import { useEffect, useMemo, useState } from 'react';
import type { MusicResponseDto as Music, PostResponseDto as Post } from '@repo/dto';

import { useModalStore, MODAL_TYPES, usePlayerStore } from '@/stores';
import { useScrollLock, usePostDetail, useLikedUsers, usePostReactions } from '@/hooks';
import { usePostReactionOverridesStore } from '@/stores';

import { EMPTY_POST, DEFAULT_IMAGES } from '@/constants';
import { LoadingSpinner, PostMedia } from '@/components';
import { coalesceImageSrc, formatRelativeTime } from '@/utils';

import { PostDetailHeader, PostDetailBody, PostDetailActions, PostDetailCommentComposer, LikedUsersOverlay } from './index';

export const PostCardDetailModal = () => {
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
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const createdAtText = useMemo(() => formatRelativeTime(safePost.createdAt), [safePost.createdAt]);
  const profileImg = useMemo(() => coalesceImageSrc(safePost.author.profileImgUrl, DEFAULT_IMAGES.PROFILE), [safePost.author.profileImgUrl]);

  if (!enabled || !postId) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
        onClick={closeModal}
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
            <PostMedia
              post={safePost}
              variant="modal"
              currentMusicId={currentMusicId}
              isPlayingGlobal={isPlaying}
              onPlay={(m: Music) => playMusic(m)}
            />
          )}

          <div className="w-full md:w-105 flex flex-col bg-white border-l-2 border-primary">
            <PostDetailHeader profileImg={profileImg} nickname={safePost.author.nickname} />

            <PostDetailBody
              profileImg={profileImg}
              nickname={safePost.author.nickname}
              createdAtText={createdAtText}
              content={safePost.content}
              comments={reactions.comments}
              commentsLoading={reactions.commentsLoading}
            />

            <PostDetailActions
              isAuthenticated={reactions.isAuthenticated}
              isSubmitting={reactions.isSubmittingLike}
              isLiked={reactions.isLiked}
              likeCount={reactions.likeCount}
              createdAtText={createdAtText}
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
