'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { PostHeader, PostMedia, PostActions, PostContentPreview } from './index';
import type { MusicResponseDto as Music, PostResponseDto as Post } from '@repo/dto';

import { addLike, removeLike } from '@/api';
import { usePostReactionOverridesStore } from '@/stores/usePostReactionOverridesStore';
import { useModalStore, useAuthStore, MODAL_TYPES } from '@/stores';

interface PostCardProps {
  post: Post;

  currentMusicId: string | null;
  isPlayingGlobal: boolean;

  onPlay: (music: Music) => void;
  onUserClick: (userId: string) => void;
  onOpenDetail: (post: Post) => void;
}

export default function PostCard({ post, currentMusicId, isPlayingGlobal, onPlay, onUserClick, onOpenDetail }: PostCardProps) {
  const userId = useAuthStore((s) => s.userId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { openModal } = useModalStore();

  const likeOverride = usePostReactionOverridesStore((s) => s.likesByPostId[post.id]);
  const setLikeOverride = usePostReactionOverridesStore((s) => s.setLikeOverride);

  // 댓글 카운트 override 추가
  const commentOverride = usePostReactionOverridesStore((s) => s.commentsByPostId[post.id]);
  const baseCommentCount = commentOverride?.commentCount ?? post.commentCount;

  const baseLiked = Boolean(likeOverride?.isLiked ?? post.isLiked);
  const baseLikeCount = likeOverride?.likeCount ?? post.likeCount;

  const [optimisticLiked, setOptimisticLiked] = useState(baseLiked);
  const [optimisticLikeCount, setOptimisticLikeCount] = useState(baseLikeCount);
  const [likeSubmitting, setLikeSubmitting] = useState(false);
  const isOwner = post.author.id === userId;

  const postForActions: Post = useMemo(
    () => ({
      ...post,
      isLiked: optimisticLiked,
      likeCount: optimisticLikeCount,
      // 댓글 카운트도 store 반영값 사용
      commentCount: baseCommentCount,
    }),
    [post, optimisticLiked, optimisticLikeCount, baseCommentCount],
  );

  /**
   * 핵심: override/서버값 변경 시 로컬 optimistic도 동기화
   * - Detail에서 눌러서 store가 바뀌어도 카드가 즉시 따라감
   */
  useEffect(() => {
    setOptimisticLiked(baseLiked);
    setOptimisticLikeCount(baseLikeCount);
    setLikeSubmitting(false);
  }, [post.id, baseLiked, baseLikeCount]);

  const handleOpenDetail = useCallback(() => onOpenDetail(postForActions), [onOpenDetail, postForActions]);

  const handleToggleLike = useCallback(async () => {
    if (!isAuthenticated) return;
    if (likeSubmitting) return;

    const prevLiked = optimisticLiked;
    const prevCount = optimisticLikeCount;

    const nextLiked = !prevLiked;
    const nextCount = prevCount + (nextLiked ? 1 : -1);

    setLikeSubmitting(true);

    // optimistic (로컬)
    setOptimisticLiked(nextLiked);
    setOptimisticLikeCount(nextCount);

    // optimistic (전역)
    setLikeOverride(post.id, { isLiked: nextLiked, likeCount: nextCount });

    try {
      if (nextLiked) await addLike({ postId: post.id });
      else await removeLike(post.id);
    } catch {
      // rollback
      setOptimisticLiked(prevLiked);
      setOptimisticLikeCount(prevCount);
      setLikeOverride(post.id, { isLiked: prevLiked, likeCount: prevCount });
    } finally {
      setLikeSubmitting(false);
    }
  }, [isAuthenticated, likeSubmitting, optimisticLiked, optimisticLikeCount, post.id, setLikeOverride]);

  const openEditPostModal = useCallback(() => {
    openModal(MODAL_TYPES.POST_DETAIL, { postId: post.id, initialIsEditing: true, initialEditingContent: post.content });
  }, [openModal, post.id, post.content]);

  return (
    <article onClick={handleOpenDetail} className="bg-white py-6 cursor-pointer">
      {/* 이미지 제외한 텍스트 섹션은 개별 패딩 적용 */}
      <div className="px-4 sm:px-6">
        <PostHeader post={post} isOwner={isOwner} onUserClick={onUserClick} onEditPost={isOwner ? openEditPostModal : undefined} />
      </div>

      {/* 이미지: 패딩 없이 카드 너비 전체를 채움 (xs 미만에서는 FeedList px-0 덕분에 화면 끝까지) */}
      <PostMedia
        post={post}
        variant="card"
        currentMusicId={currentMusicId}
        isPlayingGlobal={isPlayingGlobal}
        onPlay={onPlay}
        onClickContainer={handleOpenDetail}
      />

      <div className="px-4 sm:px-6">
        <PostActions
          post={postForActions}
          onClickLike={handleToggleLike}
          onClickComment={handleOpenDetail}
          disabledLike={!isAuthenticated || likeSubmitting}
        />

        <PostContentPreview content={post.content} onClickMore={handleOpenDetail} />
      </div>
    </article>
  );
}
