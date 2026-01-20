'use client';

import { useInfiniteScroll } from '@/hooks';
import { getFeedPosts } from '@/api';
import LoadingSpinner from '../LoadingSpinner';
import FeedList from './FeedList';
import { PostResponseDto as Post } from '@repo/dto';

/** fetch 함수 반환 형식을 무한 스크롤 hook 시그니처에 맞게 변환하는 함수 */
const fetchFeeds = async (cursor?: string) => {
  const { posts, hasNext, nextCursor } = await getFeedPosts(cursor);
  return { items: posts, hasNext, nextCursor };
};

export default function FeedSection() {
  const { items, hasNext, error, ref } = useInfiniteScroll<Post>({
    fetchFn: fetchFeeds,
  });

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
