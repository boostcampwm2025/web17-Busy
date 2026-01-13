'use client';

import { getFeedPosts } from '@/api/feed';
import { useCallback, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import LoadingSpinner from '../LoadingSpinner';

interface Post {
  id: string;
  title: string;
}

interface PostListProps {
  posts: Post[];
  hasNext: boolean;
  nextCursor?: string;
}

export default function PostList({ initialData }: { initialData: PostListProps }) {
  const { ref, inView } = useInView({ threshold: 0.8, rootMargin: '200px' });

  const [posts, setPosts] = useState(initialData.posts);
  const [hasNext, setHasNext] = useState(initialData.hasNext);
  const [nextCursor, setNextCursor] = useState(initialData.nextCursor);
  const [isLoading, setIsLoading] = useState(false); // 중복 요청 방지 flag
  const [error, setError] = useState<string | null>(null);

  const loadMorePosts = useCallback(async () => {
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // 로딩 스피너 짧게 노출
      const newData = await getFeedPosts(nextCursor);

      setPosts((prevPosts) => [...prevPosts, ...newData.posts]);
      setHasNext(newData.hasNext);
      setNextCursor(newData.nextCursor);
      error && setError(null);
    } catch (e) {
      setError('오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [nextCursor]);

  useEffect(() => {
    if (inView && hasNext && !isLoading) loadMorePosts();
  }, [inView]);

  return (
    <>
      {posts.map((post) => (
        <div key={post.id} className="w-100 min-h-50 bg-gray-2">
          {post.title}
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
          <LoadingSpinner hStyle="py-4 mb-4" />
        </div>
      )}
    </>
  );
}
