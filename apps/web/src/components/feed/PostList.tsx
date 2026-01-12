'use client';

import { getFeedPosts } from '@/api/feed';
import { LoadingSpinner } from '@/components';
import { useCallback, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface Post {
  id: number;
  title: string;
}

interface PostListProps {
  posts: Post[];
  hasNext: boolean;
  nextCursor?: number;
}

export default function PostList({ initialData }: { initialData: PostListProps }) {
  const { ref, inView } = useInView({ threshold: 0.8, rootMargin: '200px' });

  const [posts, setPosts] = useState(initialData.posts);
  const [hasNext, setHasNext] = useState(initialData.hasNext);
  const [nextCursor, setNextCursor] = useState(initialData.nextCursor);
  const [isLoading, setIsLoading] = useState(false); // 중복 요청 방지 flag

  const loadMorePosts = useCallback(async () => {
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 500)); // 로딩 스피너 짧게 노출
    const newData = await getFeedPosts(nextCursor);

    setPosts((prevPosts) => [...prevPosts, ...newData.posts]);
    setHasNext(newData.hasNext);
    setNextCursor(newData.nextCursor);
    setIsLoading(false);
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
      {hasNext && (
        <div ref={ref}>
          <LoadingSpinner hStyle="py-4" />
        </div>
      )}
    </>
  );
}
