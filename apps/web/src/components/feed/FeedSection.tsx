'use client';

import { useInfiniteScroll } from '@/hooks';
import { getFeedPosts } from '@/api';
import type { PostResponseDto as Post } from '@repo/dto';
import { FeedSkeleton } from '../skeleton';
import LoadingSpinner from '../LoadingSpinner';
import FeedList from './FeedList';
import { useFeedRefreshStore } from '@/stores';

export default function FeedSection() {
  const nonce = useFeedRefreshStore((s) => s.nonce);
  const { items, hasNext, isInitialLoading, errorMsg, ref } = useInfiniteScroll<Post>({
    fetchFn: getFeedPosts,
    resetKey: String(nonce), // 글 작성 성공 시 초기화/재조회 트리거
  });

  // 최초 요청 처리 중에만 스켈레톤 표시
  if (isInitialLoading) return <FeedSkeleton />;

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
