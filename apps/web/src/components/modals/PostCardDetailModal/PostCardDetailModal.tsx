'use client';

import { useMemo, useEffect, useState } from 'react';
import { Heart, MoreHorizontal } from 'lucide-react';

import { useModalStore, MODAL_TYPES, usePlayerStore } from '@/stores';
import { useScrollLock, usePostDetail } from '@/hooks';
import usePostReactions from '@/hooks/post/usePostReactions';
import useLikedUsers from '@/hooks/post/useLikedUsers';
import LikedUsersOverlay from './LikedUsersOverlay';

import { formatRelativeTime, coalesceImageSrc } from '@/utils';
import { EMPTY_POST, DEFAULT_IMAGES } from '@/constants';
import { PostMedia, LoadingSpinner } from '@/components';
import type { MusicResponseDto as Music, PostResponseDto as Post } from '@repo/dto';

import { usePostReactionOverridesStore } from '@/stores/usePostReactionOverridesStore';
import { useRouter } from 'next/navigation';
import { PostHeader } from '../../post';
import { useAuthMe } from '@/hooks/auth/client/useAuthMe';

export const PostCardDetailModal = () => {
  const { userId } = useAuthMe();
  const router = useRouter();
  const { isOpen, modalType, modalProps, closeModal } = useModalStore();

  const enabled = isOpen && modalType === MODAL_TYPES.POST_DETAIL;
  useScrollLock(enabled);

  const playMusic = usePlayerStore((s) => s.playMusic);
  const currentMusicId = usePlayerStore((s) => s.currentMusic?.id ?? null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const postId = enabled ? (modalProps?.postId as string | undefined) : undefined;
  const passedPost = enabled ? ((modalProps?.post as Post | undefined) ?? undefined) : undefined;

  useEffect(() => {
    if (!enabled) return;
    setIsLikedUsersOpen(false);
    if (!postId) closeModal();
  }, [enabled, postId, closeModal]);

  const { post, isLoading, error } = usePostDetail({
    enabled,
    postId,
    passedPost,
  });

  const isOwner = userId === post?.author.id;

  // post가 로딩 중이면 EMPTY_POST로 UI가 흔들릴 수 있으니, 렌더용만 fallback 처리
  const safePost = post ?? passedPost ?? EMPTY_POST;

  // override 읽기 (postId 없을 때는 undefined)
  const likeOverride = usePostReactionOverridesStore((s) => (postId ? s.likesByPostId[postId] : undefined));

  // Detail 초기값 = override > 서버(post) > passedPost > 기본값
  const initialIsLiked = likeOverride?.isLiked ?? post?.isLiked ?? passedPost?.isLiked ?? false;
  const initialLikeCount = likeOverride?.likeCount ?? post?.likeCount ?? passedPost?.likeCount ?? 0;

  const createdAtText = useMemo(() => formatRelativeTime(safePost.createdAt), [safePost.createdAt]);
  const profileImg = useMemo(() => coalesceImageSrc(safePost.author.profileImgUrl, DEFAULT_IMAGES.PROFILE), [safePost.author.profileImgUrl]);

  // Reactions: 폴링 포함을 사용
  const reactions = usePostReactions({
    enabled: Boolean(enabled && postId),
    postId: postId ?? '',
    initialIsLiked,
    initialLikeCount,
  });

  const [isLikedUsersOpen, setIsLikedUsersOpen] = useState(false);

  const likedUsers = useLikedUsers({
    enabled: Boolean(enabled && postId && isLikedUsersOpen),
    postId: postId ?? '',
  });

  if (!enabled || !postId) return null;

  const handleBackdropClick = () => closeModal();
  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation();

  const handlePlay = (music: Music) => {
    playMusic(music);
  };

  const handleUserClick = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="bg-white w-full max-w-5xl h-full max-h-[85vh] rounded-2xl border-2 border-primary shadow-2xl flex flex-col md:flex-row overflow-hidden animate-scale-up"
          onClick={handleModalClick}
        >
          {/* Left */}
          {isLoading ? (
            <LoadingSpinner />
          ) : error ? (
            <div className="flex-1 flex items-center justify-center bg-gray-4">
              <div className="text-sm font-bold text-gray-500">{error}</div>
            </div>
          ) : (
            <PostMedia post={safePost} variant="modal" currentMusicId={currentMusicId} isPlayingGlobal={isPlaying} onPlay={handlePlay} />
          )}

          {/* Right */}
          <div className="w-full md:w-105 flex flex-col bg-white border-l-2 border-primary">
            {/* Header */}
            <div className="p-4 border-b-2 border-primary/10">
              <PostHeader
                post={safePost}
                isOwner={isOwner}
                onUserClick={() => {
                  handleUserClick;
                }}
              />
            </div>

            {/* Content + Comments */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
              <div className="flex space-x-3">
                <img
                  src={profileImg}
                  alt={safePost.author.nickname}
                  className="w-9 h-9 rounded-full border border-primary/20 object-cover shrink-0"
                />
                <div className="text-sm min-w-0">
                  <p className="font-bold text-primary mb-1">{safePost.author.nickname}</p>
                  <p className="text-primary/80 leading-relaxed font-medium whitespace-pre-wrap">{safePost.content}</p>
                  <span className="text-[10px] text-gray-400 font-bold block mt-2">{createdAtText}</span>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              <div className="space-y-6">
                {reactions.commentsLoading ? (
                  <LoadingSpinner />
                ) : reactions.comments.length > 0 ? (
                  reactions.comments.map((c) => (
                    <div key={c.id} className="flex space-x-3">
                      <img
                        src={coalesceImageSrc(c.author.profileImgUrl, DEFAULT_IMAGES.PROFILE)}
                        alt={c.author.nickname}
                        className="w-9 h-9 rounded-full border border-primary/10 object-cover shrink-0"
                      />
                      <div className="flex-1 text-sm min-w-0">
                        <p className="font-bold text-primary mb-1 inline-block mr-2">{c.author.nickname}</p>
                        <p className="text-primary/70 inline font-medium">{c.content}</p>
                        <div className="flex items-center space-x-3 mt-2">
                          <span className="text-[10px] text-gray-400 font-bold">{formatRelativeTime(c.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-sm text-gray-400 font-bold">아직 댓글이 없습니다.</p>
                    <p className="text-xs text-gray-300">첫 번째 댓글을 남겨보세요!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Like area */}
            <div className="p-4 border-t-2 border-primary/10 bg-gray-4/30">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void reactions.toggleLike();
                  }}
                  disabled={!reactions.isAuthenticated || reactions.isSubmittingLike}
                  title={reactions.isAuthenticated ? '좋아요' : '로그인 후 사용 가능'}
                  className="disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Heart
                    className={`w-7 h-7 transition-colors ${
                      reactions.isLiked ? 'text-accent-pink fill-accent-pink' : 'text-primary hover:text-accent-pink hover:fill-accent-pink'
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setIsLikedUsersOpen(true)}
                  className="font-black text-sm text-primary hover:underline"
                  title="좋아요한 사용자 보기"
                >
                  좋아요 {reactions.likeCount}개
                </button>
              </div>

              <p className="mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">{createdAtText}</p>
            </div>

            {/* Comment input */}
            <div className="p-4 border-t-2 border-primary flex items-center space-x-3 bg-white">
              <input
                type="text"
                placeholder={reactions.isAuthenticated ? '댓글 달기...' : '로그인 후 댓글을 작성할 수 있어요.'}
                value={reactions.commentText}
                onChange={(e) => reactions.setCommentText(e.target.value)}
                disabled={!reactions.isAuthenticated || reactions.isSubmittingComment}
                className="flex-1 py-1 text-sm font-medium focus:outline-none bg-background disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => void reactions.submitComment()}
                disabled={!reactions.isAuthenticated || !reactions.commentText.trim() || reactions.isSubmittingComment}
                className="text-accent-pink font-black text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 transition-transform"
              >
                게시
              </button>
            </div>
          </div>
        </div>
      </div>

      <LikedUsersOverlay
        isOpen={isLikedUsersOpen}
        onClose={() => setIsLikedUsersOpen(false)}
        users={likedUsers.users}
        isLoading={likedUsers.isLoading}
        errorMsg={likedUsers.errorMsg}
        onRetry={likedUsers.refetch}
      />
    </>
  );
};
