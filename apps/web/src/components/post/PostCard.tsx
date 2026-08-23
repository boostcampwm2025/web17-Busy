'use client';

import { useCallback } from 'react';

import { PostHeader, PostMedia, PostActions, PostContentPreview } from './index';
import type { MusicResponseDto as Music, PostResponseDto as Post } from '@repo/dto';

import { usePostLikeMutation } from '@/hooks';
import { useModalStore, MODAL_TYPES } from '@/stores';
import { useAuthMe } from '@/hooks/auth/client/useAuthMe';

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
  const { userId, isAuthenticated } = useAuthMe();
  const { openModal } = useModalStore();

  const isOwner = post.author.id === userId;
  const likeMutation = usePostLikeMutation({
    postId: post.id,
  });

  const handleOpenDetail = useCallback(() => onOpenDetail(post), [onOpenDetail, post]);

  const handleToggleLike = useCallback(async () => {
    if (!isAuthenticated) return;
    if (likeMutation.isPending) return;
    await likeMutation.mutateAsync({ isLiked: post.isLiked, likeCount: post.likeCount });
  }, [isAuthenticated, likeMutation, post.isLiked, post.likeCount]);

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
          post={post}
          onClickLike={handleToggleLike}
          onClickComment={handleOpenDetail}
          disabledLike={!isAuthenticated || likeMutation.isPending}
        />

        <PostContentPreview content={post.content} onClickMore={handleOpenDetail} />
      </div>
    </article>
  );
}
