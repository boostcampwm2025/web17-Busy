'use client';

import { useInfiniteScroll } from '@/hooks';
import { getFeedPosts } from '@/api';
import { PostResponseDto as Post } from '@repo/dto';
import { FeedSkeleton } from '../skeleton';
import LoadingSpinner from '../LoadingSpinner';
import FeedList from './FeedList';

export default function FeedSection() {
  const { items, hasNext, isInitialLoaded, initialError, errorMsg, ref } = useInfiniteScroll<Post>({
    fetchFn: getFeedPosts,
  });

  // 렌더링 단계에서 발생하는 에러 처리 (데이터 최초 fetch 관련)
  if (initialError) throw initialError;

  // 최초 요청 처리 중에만 스켈레톤 표시
  if (!isInitialLoaded) return <FeedSkeleton />;

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
