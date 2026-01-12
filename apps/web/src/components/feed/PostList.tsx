'use client';

import { getFeedPosts } from '@/api/feed';
import { LoadingSpinner } from '@/components';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  const [posts, setPosts] = useState(initialData.posts);
  const [hasNext, setHasNext] = useState(initialData.hasNext);
  const [nextCursor, setNextCursor] = useState(initialData.nextCursor);
  const [isLoading, setIsLoading] = useState(false); // 중복 요청 방지 flag

  const targetRef = useRef<HTMLDivElement>(null); // fetch 요청 트리거

  const loadMorePosts = useCallback(async () => {
    if (!hasNext || isLoading) return;
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    const newData = await getFeedPosts(nextCursor);

    setPosts((prevPosts) => [...prevPosts, ...newData.posts]);
    setHasNext(newData.hasNext);
    setNextCursor(newData.nextCursor);
    setIsLoading(false);
  }, [isLoading]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMorePosts();
        }
      },
      { threshold: 1.0 },
    );

    const currentTarget = targetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadMorePosts]);

  return (
    <>
      {posts.map((post) => (
        <div key={post.id} className="w-100 min-h-50 bg-gray-2">
          {post.title}
        </div>
      ))}
      {hasNext && (
        <div ref={targetRef}>
          <LoadingSpinner hStyle="py-4" />
        </div>
      )}
    </>
  );
}
