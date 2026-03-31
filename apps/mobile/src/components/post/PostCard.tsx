import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { MusicResponseDto as Music, PostResponseDto as Post } from '@repo/dto';
import { addLike, removeLike } from '@/src/api';
import { useAuthStore, usePostReactionOverridesStore } from '@/src/stores';
import PostHeader from './partials/PostHeader';
import PostMedia from './partials/PostMedia';
import PostActions from './partials/PostActions';
import PostContentPreview from './partials/PostContentPreview';

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

  const likeOverride = usePostReactionOverridesStore((s) => s.likesByPostId[post.id]);
  const setLikeOverride = usePostReactionOverridesStore((s) => s.setLikeOverride);
  const commentOverride = usePostReactionOverridesStore((s) => s.commentsByPostId[post.id]);

  const baseCommentCount = commentOverride?.commentCount ?? post.commentCount;
  const baseLiked = Boolean(likeOverride?.isLiked ?? post.isLiked);
  const baseLikeCount = likeOverride?.likeCount ?? post.likeCount;

  const [optimisticLiked, setOptimisticLiked] = useState(baseLiked);
  const [optimisticLikeCount, setOptimisticLikeCount] = useState(baseLikeCount);
  const [likeSubmitting, setLikeSubmitting] = useState(false);

  const isOwner = post.author.id === userId;

  const postForActions = useMemo<Post>(
    () => ({ ...post, isLiked: optimisticLiked, likeCount: optimisticLikeCount, commentCount: baseCommentCount }),
    [post, optimisticLiked, optimisticLikeCount, baseCommentCount],
  );

  useEffect(() => {
    setOptimisticLiked(baseLiked);
    setOptimisticLikeCount(baseLikeCount);
    setLikeSubmitting(false);
  }, [post.id, baseLiked, baseLikeCount]);

  const handleToggleLike = useCallback(async () => {
    if (!isAuthenticated || likeSubmitting) return;

    const prevLiked = optimisticLiked;
    const prevCount = optimisticLikeCount;
    const nextLiked = !prevLiked;
    const nextCount = prevCount + (nextLiked ? 1 : -1);

    setLikeSubmitting(true);
    setOptimisticLiked(nextLiked);
    setOptimisticLikeCount(nextCount);
    setLikeOverride(post.id, { isLiked: nextLiked, likeCount: nextCount });

    try {
      if (nextLiked) await addLike({ postId: post.id });
      else await removeLike(post.id);
    } catch {
      setOptimisticLiked(prevLiked);
      setOptimisticLikeCount(prevCount);
      setLikeOverride(post.id, { isLiked: prevLiked, likeCount: prevCount });
    } finally {
      setLikeSubmitting(false);
    }
  }, [isAuthenticated, likeSubmitting, optimisticLiked, optimisticLikeCount, post.id, setLikeOverride]);

  return (
    <View style={styles.card}>
      <PostHeader post={post} isOwner={isOwner} onUserClick={onUserClick} />
      <PostMedia
        post={post}
        currentMusicId={currentMusicId}
        isPlayingGlobal={isPlayingGlobal}
        onPlay={onPlay}
        onOpenDetail={() => onOpenDetail(postForActions)}
      />
      <PostActions
        post={postForActions}
        onClickLike={handleToggleLike}
        onClickComment={() => onOpenDetail(postForActions)}
        disabledLike={!isAuthenticated || likeSubmitting}
      />
      <PostContentPreview content={post.content} onClickMore={() => onOpenDetail(postForActions)} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111',
    marginBottom: 8,
  },
});
