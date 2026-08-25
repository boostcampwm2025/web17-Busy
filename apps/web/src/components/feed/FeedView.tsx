'use client';

import { useEffect } from 'react';
import { useFeedPostsQuery } from '@/hooks/post/use-post-list-queries';
import { FeedSkeleton } from '@/components/common/skeleton';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import FeedList from './FeedList';
import { useModalStore, MODAL_TYPES } from '@/stores/useModalStore';

import { PostResponseDto } from '@repo/dto';

interface FeedViewProps {
  initialPost?: PostResponseDto;
}

export default function FeedView({ initialPost }: FeedViewProps) {
  const openModal = useModalStore((s) => s.openModal);

  useEffect(() => {
    if (initialPost) {
      openModal(MODAL_TYPES.POST_DETAIL, { postId: initialPost.id, post: initialPost });
    }
  }, [initialPost, openModal]);

  const { items, hasNext, isInitialLoading, errorMsg, ref } = useFeedPostsQuery(initialPost);

  if (isInitialLoading && !initialPost) return <FeedSkeleton />;

  return (
    <>
      <FeedList posts={items} />
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
