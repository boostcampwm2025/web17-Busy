'use client';

import { useFeedInfiniteScroll } from '@/hooks';
import { getFeedPosts } from '@/api';
import { FeedSkeleton } from '../skeleton';
import LoadingSpinner from '../LoadingSpinner';
import FeedList from './FeedList';
import { useFeedRefreshStore } from '@/stores';
import { PostResponseDto } from '@repo/dto';

interface FeedViewProps {
  initialPost?: PostResponseDto;
}

export default function FeedView({ initialPost }: FeedViewProps) {
  const nonce = useFeedRefreshStore((s) => s.nonce);

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
