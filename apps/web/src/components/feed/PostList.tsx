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
  const { ref, inView } = useInView({ threshold: 1.0, delay: 500 });

  const [posts, setPosts] = useState(initialData.posts);
  const [hasNext, setHasNext] = useState(initialData.hasNext);
  const [nextCursor, setNextCursor] = useState(initialData.nextCursor);
  const [isLoading, setIsLoading] = useState(false); // 중복 요청 방지 flag

  const loadMorePosts = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    const newData = await getFeedPosts(nextCursor);

    setPosts((prevPosts) => [...prevPosts, ...newData.posts]);
    setHasNext(newData.hasNext);
    setNextCursor(newData.nextCursor);
    setIsLoading(false);
  }, [isLoading]);

  useEffect(() => {
    if (inView && hasNext) loadMorePosts();
  }, [inView, loadMorePosts]);

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
