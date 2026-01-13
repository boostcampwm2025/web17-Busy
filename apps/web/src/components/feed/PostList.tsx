'use client';

import { getFeedPosts } from '@/api/feed';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import LoadingSpinner from '../LoadingSpinner';

interface Post {
  id: string;
  title: string;
}

interface PostListProps {
  items: Post[];
  hasNext: boolean;
  nextCursor?: string;
}

export default function PostList({ initialData }: { initialData?: PostListProps }) {
  const { items, hasNext, error, ref } = useInfiniteScroll<Post>({ initialData, fetchFn: getFeedPosts });

  return (
    <>
      {items.map((item) => (
        <div key={item.id} className="w-100 min-h-50 bg-gray-2">
          {item.title}
        </div>
      ))}
      {error && (
        <div className="text-center mt-4">
          <p>{error}</p>
          <p className="text-sm mt-2">다시 시도해주세요.</p>
        </div>
      )}
      {hasNext && (
        <div ref={ref}>
          <LoadingSpinner hStyle="py-4" />
        </div>
      )}
    </>
  );
}
