import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MusicResponseDto as Music } from '@repo/dto';

import { useModalStore, useModalProps, MODAL_TYPES } from '@/stores/useModalStore';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useAuthMe } from '@/hooks/auth/client/useAuthMe';
import useScrollLock from '@/hooks/common/useScrollLock';
import { useSwipeToDismiss } from '@/hooks/common/useSwipeToDismiss';
import { usePostDetail } from '@/hooks/post/usePostDetail';
import usePostReactions from '@/hooks/post/usePostReactions';
import { usePostDetailLog } from '@/hooks/post/use-post-detail-log';
import { usePostDetailMobileRedirect } from '@/hooks/post/use-post-detail-mobile-redirect';
import { usePostEditing } from '@/hooks/post/use-post-editing';

import { EMPTY_POST } from '@/constants/emptyPost';

import { LikedUsersOverlay, PostDetailDesktopModal, PostDetailMobileSheet } from './partials';

export const PostCardDetailModal = () => {
  const { userId } = useAuthMe();
  const router = useRouter();
  const isOpen = useModalStore((s) => s.isOpen);
  const modalType = useModalStore((s) => s.modalType);
  const modalProps = useModalProps(MODAL_TYPES.POST_DETAIL);
  const closeModal = useModalStore((s) => s.closeModal);
  const isEnabled = isOpen && modalType === MODAL_TYPES.POST_DETAIL;

  useScrollLock(isEnabled);

  const postId = isEnabled ? modalProps?.postId : undefined;
  const passedPost = isEnabled ? modalProps?.post : undefined;

  useEffect(() => {
    if (!isEnabled) return;
    if (!postId) closeModal();
  }, [isEnabled, postId, closeModal]);

  const { post, isLoading, error } = usePostDetail({ enabled: isEnabled, postId, passedPost });
  const isOwner = userId === post?.author.id;
  // 아직 못 받은 동안 쓰는 자리표시자. id만은 진짜여야 링크 복사·좋아요가 엉뚱한 글을 가리키지 않는다.
  const safePost = post ?? passedPost ?? { ...EMPTY_POST, id: postId ?? '' };

  const reactions = usePostReactions({
    enabled: Boolean(isEnabled && postId),
    postId: postId ?? '',
    initialIsLiked: post?.isLiked ?? passedPost?.isLiked ?? false,
    initialLikeCount: post?.likeCount ?? passedPost?.likeCount ?? 0,
    initialCommentCount: post?.commentCount ?? passedPost?.commentCount ?? 0,
  });

  const editing = usePostEditing({
    postId,
    content: safePost.content,
    initialIsEditing: modalProps?.initialIsEditing === true,
    initialContent: modalProps?.initialEditingContent || '',
  });

  usePostDetailMobileRedirect({ enabled: isEnabled, postId });

  const [isLikedUsersOpen, setIsLikedUsersOpen] = useState(false);
  useEffect(() => {
    if (!isEnabled) return;
    setIsLikedUsersOpen(false);
  }, [isEnabled, postId]);

  const playMusic = usePlayerStore((s) => s.playMusic);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const selectMusic = usePlayerStore((s) => s.selectMusic);
  const currentMusicId = usePlayerStore((s) => s.currentMusic?.id ?? null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const postMusicIds = useMemo(() => safePost.musics.map((m) => m.id), [safePost.musics]);
  const { markMusicPlayed } = usePostDetailLog({ enabled: isEnabled, postId, userId, postMusicIds, isPlaying, currentMusicId });

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

  const handleClose = useCallback(() => closeModal(), [closeModal]);
  const handleUserClick = useCallback(() => router.push(`/profile/${safePost.author.id}`), [router, safePost.author.id]);
  const handleOpenLikedUsers = useCallback(() => setIsLikedUsersOpen(true), []);
  const handleCloseLikedUsers = useCallback(() => setIsLikedUsersOpen(false), []);

  const swipe = useSwipeToDismiss(handleClose);

  if (!isEnabled || !postId) return null;

  return (
    <>
      <PostDetailMobileSheet post={safePost} reactions={reactions} swipe={swipe} onClose={handleClose} />

      <PostDetailDesktopModal
        post={safePost}
        isOwner={isOwner}
        isLoading={isLoading}
        error={error}
        currentMusicId={currentMusicId}
        isPlayingGlobal={isPlaying}
        onPlay={handlePlayFromPost}
        onPlayAll={handlePlayAll}
        reactions={reactions}
        editing={editing}
        onClose={handleClose}
        onUserClick={handleUserClick}
        onOpenLikedUsers={handleOpenLikedUsers}
      />

      <LikedUsersOverlay isOpen={isLikedUsersOpen} postId={postId} onClose={handleCloseLikedUsers} />
    </>
  );
};
