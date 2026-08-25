'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import type { MusicResponseDto as Music, PostResponseDto as Post } from '@repo/dto';

import { useRouter, usePathname } from 'next/navigation';
import PostHeader from '@/components/post/partials/PostHeader';
import { useModalStore, useModalProps, MODAL_TYPES } from '@/stores/useModalStore';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useAuthMe } from '@/hooks/auth/client/useAuthMe';
import useIsMobile from '@/hooks/common/useIsMobile';
import useScrollLock from '@/hooks/common/useScrollLock';
import { usePostDetail } from '@/hooks/post/usePostDetail';
import usePostReactions from '@/hooks/post/usePostReactions';
import { useSwipeToDismiss } from '@/hooks/common/useSwipeToDismiss';

import { EMPTY_POST } from '@/constants/emptyPost';
import { DEFAULT_IMAGES } from '@/constants/defaultImages';
import { LAYER } from '@/constants/layers';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PostMedia from '@/components/post/partials/PostMedia';
import { coalesceImageSrc } from '@/utils/image';
import { toast } from 'react-toastify';
import { useUpdatePostMutation } from '@/hooks/post/use-post-mutations';

import { PostDetailBody, PostDetailActions, PostDetailCommentComposer, LikedUsersOverlay } from './partials';
import { usePostDetailLog } from '@/hooks/post/use-post-detail-log';

export const PostCardDetailModal = () => {
  const { userId } = useAuthMe();
  const router = useRouter();
  const isOpen = useModalStore((s) => s.isOpen);
  const modalType = useModalStore((s) => s.modalType);
  const modalProps = useModalProps(MODAL_TYPES.POST_DETAIL);
  const closeModal = useModalStore((s) => s.closeModal);
  const enabled = isOpen && modalType === MODAL_TYPES.POST_DETAIL;

  useScrollLock(enabled);

  const postId = enabled ? modalProps?.postId : undefined;
  const passedPost = enabled ? modalProps?.post : undefined;

  useEffect(() => {
    if (!enabled) return;
    if (!postId) closeModal();
  }, [enabled, postId, closeModal]);

  const { post, isLoading, error } = usePostDetail({ enabled, postId, passedPost });
  const updatePostMutation = useUpdatePostMutation({ postId: postId ?? '' });
  const isOwner = userId === post?.author.id;
  const safePost = post ?? passedPost ?? EMPTY_POST;

  const initialIsLiked = post?.isLiked ?? passedPost?.isLiked ?? false;
  const initialLikeCount = post?.likeCount ?? passedPost?.likeCount ?? 0;
  const initialCommentCount = post?.commentCount ?? passedPost?.commentCount ?? 0;

  const reactions = usePostReactions({
    enabled: Boolean(enabled && postId),
    postId: postId ?? '',
    initialIsLiked,
    initialLikeCount,
    initialCommentCount,
  });

  const [likedUsersOpen, setLikedUsersOpen] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    setLikedUsersOpen(false);
  }, [enabled, postId]);

  const handleCloseLikedUsers = () => setLikedUsersOpen(false);

  const playMusic = usePlayerStore((s) => s.playMusic);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const selectMusic = usePlayerStore((s) => s.selectMusic);
  const currentMusicId = usePlayerStore((s) => s.currentMusic?.id ?? null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const profileImg = useMemo(() => coalesceImageSrc(safePost.author.profileImgUrl, DEFAULT_IMAGES.PROFILE), [safePost.author.profileImgUrl]);

  // 데스크탑 → 모바일 리사이즈 시, 프로필 페이지에서 열린 모달이면 posts 피드 페이지로 전환
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const isMobileInitializedRef = useRef(false);
  const prevIsMobileRef = useRef(false);
  useEffect(() => {
    if (!isMobileInitializedRef.current) {
      isMobileInitializedRef.current = true;
      prevIsMobileRef.current = isMobile;
      return;
    }
    const prev = prevIsMobileRef.current;
    prevIsMobileRef.current = isMobile;

    if (!prev && isMobile && enabled && postId) {
      const profileMatch = pathname.match(/^\/profile\/([^/]+)$/);
      if (profileMatch) {
        closeModal();
        router.push(`/profile/${profileMatch[1]}/posts?postId=${postId}`);
      }
    }
  }, [isMobile, enabled, pathname, postId, router, closeModal]);

  // 게시글 수정 관련 상태
  const [isEditing, setIsEditing] = useState(modalProps?.initialIsEditing === true);
  const [editedContent, setEditedContent] = useState(modalProps?.initialEditingContent || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = () => {
    setEditedContent(safePost.content);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!postId || isSaving || editedContent === safePost.content) return; // 내용 변경 없으면 저장 안 함

    setIsSaving(true);
    try {
      await updatePostMutation.mutateAsync(editedContent);
      toast.success('게시글을 수정했습니다.');
      setIsEditing(false);
    } catch (err) {
      toast.error('게시글 수정에 실패했습니다.');
      console.error('게시글 수정 실패:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(safePost.content); // 원본 content로 되돌리기
  };

  const postMusicIds = useMemo(() => safePost.musics.map((m) => m.id), [safePost.musics]);
  const { markMusicPlayed } = usePostDetailLog({ enabled, postId, userId, postMusicIds, isPlaying, currentMusicId });

  const handlePlayFromPost = useCallback(
    (m: Music) => {
      if (m?.id) markMusicPlayed(m.id);
      playMusic(m);
    },
    [markMusicPlayed, playMusic],
  );

  // 커버 페이지: 게시글 전체 음악을 큐에 넣고 첫 번째 곡 재생
  const handlePlayAll = useCallback(() => {
    const musics = safePost.musics;
    if (!musics.length) return;
    const firstMusic = musics[0];
    if (!firstMusic) return;
    addToQueue(musics);
    markMusicPlayed(firstMusic.id);
    selectMusic(firstMusic);
  }, [safePost.musics, addToQueue, selectMusic, markMusicPlayed]);

  const handleClose = useCallback(() => {
    closeModal();
  }, [closeModal]);

  if (!enabled || !postId) return null;

  const handleUserClick = (targetUserId: string) => {
    router.push(`/profile/${targetUserId}`);
  };

  const { sheetRef, handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeToDismiss(handleClose);

  return (
    <>
      {/* ── 모바일: 댓글 바텀시트 ── */}
      <div className="lg:hidden">
        {/* 시트는 같은 층이지만 DOM에서 뒤에 오므로 이 배경 위에 그려진다. */}
        <div className={`fixed inset-0 ${LAYER.modal} bg-black/60 backdrop-blur-sm animate-fade-in`} onClick={handleClose} />

        <section
          ref={sheetRef}
          className={`fixed inset-x-0 bottom-0 ${LAYER.modal} h-[90vh] bg-white rounded-t-2xl border-t-2 border-x-2 border-primary flex flex-col animate-slide-up`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* 핸들 + 닫기 버튼 */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0">
            <div className="flex-1" />
            <div className="w-10 h-1 rounded-full bg-gray-3" />
            <div className="flex-1 flex justify-end">
              <button type="button" onClick={handleClose} className="p-2 rounded-full hover:bg-gray-4 text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 댓글 목록 */}
          <PostDetailBody
            profileImg={profileImg}
            nickname={safePost.author.nickname}
            content={safePost.content}
            comments={reactions.comments}
            commentsLoading={reactions.commentsLoading}
          />

          {/* 댓글 입력 */}
          <PostDetailCommentComposer
            isAuthenticated={reactions.isAuthenticated}
            isSubmitting={reactions.isSubmittingComment}
            value={reactions.commentText}
            onChange={reactions.setCommentText}
            onSubmit={reactions.submitComment}
          />
        </section>
      </div>

      {/* ── 데스크탑: 기존 풀 모달 ── */}
      <div
        className={`hidden lg:flex fixed inset-0 ${LAYER.modal} items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in`}
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
            <PostMedia
              post={safePost}
              variant="modal"
              currentMusicId={currentMusicId}
              isPlayingGlobal={isPlaying}
              onPlay={handlePlayFromPost}
              onPlayAll={handlePlayAll}
            />
          )}

          <div className="w-full md:w-105 flex flex-col bg-white border-l-2 border-primary flex-1 min-h-0">
            <div className="mt-4 px-4 py-2 border-b-2 border-primary/10">
              <PostHeader
                post={safePost}
                isOwner={isOwner}
                onUserClick={() => handleUserClick(safePost.author.id)}
                onEditPost={isOwner ? handleStartEdit : undefined}
                onDeletePost={isOwner ? closeModal : undefined}
              />
            </div>

            {isEditing ? (
              <div className="flex-1 overflow-y-auto p-4">
                <textarea
                  className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-accent-cyan transition-all"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={10}
                />
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || editedContent === safePost.content}
                    className="px-4 py-2 text-sm font-bold text-white bg-accent-cyan rounded-lg hover:bg-cyan-500 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
            ) : (
              <PostDetailBody
                profileImg={profileImg}
                nickname={safePost.author.nickname}
                content={safePost.content}
                comments={reactions.comments}
                commentsLoading={reactions.commentsLoading}
              />
            )}

            <PostDetailActions
              isAuthenticated={reactions.isAuthenticated}
              isSubmitting={reactions.isSubmittingLike}
              isLiked={reactions.isLiked}
              likeCount={reactions.likeCount}
              postId={postId}
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

      <LikedUsersOverlay isOpen={likedUsersOpen} postId={postId} onClose={handleCloseLikedUsers} />
    </>
  );
};
