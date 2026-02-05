'use client';

import { useEffect } from 'react';
import { useFeedInfiniteScroll } from '@/hooks';
import { getFeedPosts } from '@/api';
import { FeedSkeleton } from '../skeleton';
import LoadingSpinner from '../LoadingSpinner';
import FeedList from './FeedList';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';

import { useFeedRefreshStore, usePostReactionOverridesStore } from '@/stores';
import { PostResponseDto } from '@repo/dto';

interface FeedViewProps {
  initialPost?: PostResponseDto;
}

export default function FeedView({ initialPost }: FeedViewProps) {
  const openModal = useModalStore((s) => s.openModal);
  const nonce = useFeedRefreshStore((s) => s.nonce);

  useEffect(() => {
    if (initialPost) {
      openModal(MODAL_TYPES.POST_DETAIL, { postId: initialPost.id, initialPost });
    }
  }, [initialPost, openModal]);

  const { posts, setPosts, hasNext, isInitialLoading, errorMsg, ref } = useFeedInfiniteScroll({
    fetchFn: getFeedPosts,
    resetKey: String(nonce),
    initialData: initialPost ? [initialPost] : [],
  });

  const contentByPostId = usePostReactionOverridesStore((s) => s.contentByPostId);
  const clearContentOverride = usePostReactionOverridesStore((s) => s.clearContentOverride);

  const deletedPostId = usePostReactionOverridesStore((s) => s.deletedPostId);
  const clearDeletedPostId = usePostReactionOverridesStore((s) => s.clearDeletedPostId);

  const updatePostContent = (updatedPostId: string, newContent?: string) => {
    if (!newContent) return;
    setPosts((prev) => prev.map((post) => (post.id === updatedPostId ? { ...post, content: newContent } : post)));
  };

  const updateDeletedPost = (deletedPostId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== deletedPostId));
  };

  useEffect(() => {
    const updatedIds = Object.keys(contentByPostId);
    if (updatedIds.length === 0) return;
    updatedIds.map((id) => {
      updatePostContent(id, contentByPostId[id]?.content);
      clearContentOverride(id);
    });
  }, [contentByPostId]);

  useEffect(() => {
    if (!deletedPostId) return;
    updateDeletedPost(deletedPostId);
    clearDeletedPostId();
  }, [deletedPostId]);

  if (isInitialLoading && !initialPost) return <FeedSkeleton />;

  return (
    <>
      <FeedList posts={posts} />
      {errorMsg && (
        <div className="text-center">
          <p>{errorMsg}</p>
          <p className="text-sm mt-2">다시 시도해주세요.</p>
        </div>
      )}
      {hasNext && (
        <div ref={ref}>
          <LoadingSpinner hStyle="py-6" />
        </div>
      )}
    </>
  );
}
