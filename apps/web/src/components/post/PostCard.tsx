'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { PostHeader, PostMedia, PostActions, PostContentPreview } from './index';
import type { MusicResponseDto as Music, PostResponseDto as Post } from '@repo/dto';

import { addLike, removeLike } from '@/api';
import { useAuthMe } from '@/hooks/auth/client/useAuthMe';
import { usePostReactionOverridesStore } from '@/stores/usePostReactionOverridesStore';

interface PostCardProps {
  post: Post;

  currentMusicId: string | null;
  isPlayingGlobal: boolean;

  onPlay: (music: Music) => void;
  onUserClick: (userId: string) => void;
  onOpenDetail: (post: Post) => void;
}

export default function PostCard({ post, currentMusicId, isPlayingGlobal, onPlay, onUserClick, onOpenDetail }: PostCardProps) {
  const { isAuthenticated } = useAuthMe();

  const override = usePostReactionOverridesStore((s) => s.likesByPostId[post.id]);
  const setLikeOverride = usePostReactionOverridesStore((s) => s.setLikeOverride);

  const baseLiked = Boolean(override?.isLiked ?? post.isLiked);
  const baseLikeCount = override?.likeCount ?? post.likeCount;

  const [optimisticLiked, setOptimisticLiked] = useState(baseLiked);
  const [optimisticLikeCount, setOptimisticLikeCount] = useState(baseLikeCount);
  const [likeSubmitting, setLikeSubmitting] = useState(false);

  const postForActions: Post = useMemo(
    () => ({
      ...post,
      isLiked: optimisticLiked,
      likeCount: optimisticLikeCount,
    }),
    [post, optimisticLiked, optimisticLikeCount],
  );

  /**
   *  핵심: override/서버값 변경 시 로컬 optimistic도 동기화
   * - Detail에서 눌러서 store가 바뀌어도 이 effect로 카드가 즉시 따라감
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

    // optimistic (전역) — 다른 화면/디테일 모달도 즉시 동기화됨
    setLikeOverride(post.id, { isLiked: nextLiked, likeCount: nextCount });

    try {
      if (nextLiked) await addLike({ postId: post.id });
      else await removeLike(post.id);
    } catch {
      // rollback (로컬 + 전역 동일하게 복구)
      setOptimisticLiked(prevLiked);
      setOptimisticLikeCount(prevCount);
      setLikeOverride(post.id, { isLiked: prevLiked, likeCount: prevCount });
    } finally {
      setLikeSubmitting(false);
    }
  }, [isAuthenticated, likeSubmitting, optimisticLiked, optimisticLikeCount, post.id, setLikeOverride]);

  return (
    <article
      onClick={handleOpenDetail}
      className="bg-white border-2 border-primary rounded-2xl p-6 mb-8 shadow-[3px_3px_0px_0px_#00214D]
                 hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_#00EBC7] transition-all duration-300 cursor-pointer"
    >
      <PostHeader post={post} onUserClick={onUserClick} />

      <PostMedia
        post={post}
        variant="card"
        currentMusicId={currentMusicId}
        isPlayingGlobal={isPlayingGlobal}
        onPlay={onPlay}
        onClickContainer={handleOpenDetail}
      />

      <PostActions
        post={postForActions}
        onClickLike={handleToggleLike}
        onClickComment={handleOpenDetail}
        disabledLike={!isAuthenticated || likeSubmitting}
      />

      <PostContentPreview content={post.content} onClickMore={handleOpenDetail} />
    </article>
  );
}
