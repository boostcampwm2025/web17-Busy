'use client';

import { useCallback, useMemo } from 'react';

import { PostHeader, PostMedia, PostActions, PostContentPreview } from './index';
import type { MusicResponseDto as Music, PostResponseDto as Post } from '@repo/dto';

import { getOptimisticLikeState, usePostLikeMutation } from '@/hooks';
import { usePostReactionOverridesStore } from '@/stores/usePostReactionOverridesStore';
import { useModalStore, useAuthStore, MODAL_TYPES } from '@/stores';

interface PostCardProps {
  post: Post;

  currentMusicId: string | null;
  isPlayingGlobal: boolean;

  onPlay: (music: Music) => void;
  onPlayAll?: () => void;
  onUserClick: (userId: string) => void;
  onOpenDetail: (post: Post) => void;
}

export default function PostCard({ post, currentMusicId, isPlayingGlobal, onPlay, onPlayAll, onUserClick, onOpenDetail }: PostCardProps) {
  const userId = useAuthStore((s) => s.userId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { openModal } = useModalStore();

  const likeOverride = usePostReactionOverridesStore((s) => s.likesByPostId[post.id]);

  // 댓글 카운트 override 추가
  const commentOverride = usePostReactionOverridesStore((s) => s.commentsByPostId[post.id]);
  const baseCommentCount = commentOverride?.commentCount ?? post.commentCount;

  const baseLiked = Boolean(likeOverride?.isLiked ?? post.isLiked);
  const baseLikeCount = likeOverride?.likeCount ?? post.likeCount;
  const isOwner = post.author.id === userId;
  const likeMutation = usePostLikeMutation({
    postId: post.id,
  });

  const postForActions: Post = useMemo(
    () => ({
      ...post,
      isLiked: baseLiked,
      likeCount: baseLikeCount,
      // 댓글 카운트도 store 반영값 사용
      commentCount: baseCommentCount,
    }),
    [post, baseLiked, baseLikeCount, baseCommentCount],
  );

  const handleOpenDetail = useCallback(() => onOpenDetail(postForActions), [onOpenDetail, postForActions]);

  const handleToggleLike = useCallback(async () => {
    if (!isAuthenticated) return;
    if (likeMutation.isPending) return;
    await likeMutation.mutateAsync(getOptimisticLikeState({ isLiked: baseLiked, likeCount: baseLikeCount }));
  }, [baseLikeCount, baseLiked, isAuthenticated, likeMutation]);

  const openEditPostModal = useCallback(() => {
    openModal(MODAL_TYPES.POST_DETAIL, { postId: post.id, initialIsEditing: true, initialEditingContent: post.content });
  }, [openModal, post.id, post.content]);

  return (
    <article onClick={handleOpenDetail} className="bg-white py-6 cursor-pointer">
      {/* 이미지 제외한 텍스트 섹션은 개별 패딩 적용 */}
      <div className="px-4 sm:px-6">
        <PostHeader post={post} isOwner={isOwner} onUserClick={onUserClick} onEditPost={isOwner ? openEditPostModal : undefined} />
      </div>

      <div className="xs:px-4 sm:px-6">
        <PostMedia
          post={post}
          variant="card"
          currentMusicId={currentMusicId}
          isPlayingGlobal={isPlayingGlobal}
          onPlay={onPlay}
          onPlayAll={onPlayAll}
          onClickContainer={handleOpenDetail}
        />
      </div>

      <div className="px-4 sm:px-6">
        <PostActions
          post={postForActions}
          onClickLike={handleToggleLike}
          onClickComment={handleOpenDetail}
          disabledLike={!isAuthenticated || likeMutation.isPending}
        />

        <PostContentPreview content={post.content} onClickMore={handleOpenDetail} />
      </div>
    </article>
  );
}
