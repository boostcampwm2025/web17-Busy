'use client';

import { useEffect } from 'react';
import { useFeedInfiniteScroll } from '@/hooks';
import { getFeedPosts } from '@/api';
import { FeedSkeleton } from '../skeleton';
import LoadingSpinner from '../LoadingSpinner';
import FeedList from './FeedList';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';

import { useFeedRefreshStore } from '@/stores';
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

  const { posts, hasNext, isInitialLoading, errorMsg, ref } = useFeedInfiniteScroll({
    fetchFn: getFeedPosts,
    resetKey: String(nonce),
    initialData: initialPost ? [initialPost] : [],
  });

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
