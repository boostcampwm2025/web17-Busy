'use client';

import { useInfiniteScroll } from '@/hooks';
import { getFeedPosts } from '@/api';
import { PostResponseDto as Post } from '@repo/dto';
import { FeedSkeleton } from '../skeleton';
import LoadingSpinner from '../LoadingSpinner';
import FeedList from './FeedList';

export default function FeedSection() {
  const { items, hasNext, isInitialLoading, error, ref } = useInfiniteScroll<Post>({
    fetchFn: getFeedPosts,
  });

  // 최초 요청 대기 중에만 스켈레톤 표시
  if (isInitialLoading) return <FeedSkeleton />;

  return (
    <>
      <FeedList posts={items} />
      {error && (
        <div className="text-center">
          <p>{error}</p>
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
