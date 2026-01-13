'use client';

import { Post } from '@/types';
import { useInfiniteScroll } from '@/hooks';
import { getFeedPosts } from '@/api';
import LoadingSpinner from '../LoadingSpinner';
import FeedList from './FeedList';

interface FeedSectionProps {
  items: Post[];
  hasNext: boolean;
  nextCursor?: string;
}

export default function FeedSection({ initialData }: { initialData?: FeedSectionProps }) {
  const { items, hasNext, error, ref } = useInfiniteScroll<Post>({ initialData, fetchFn: getFeedPosts });

  return (
    <section className="w-full">
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
    </section>
  );
}
