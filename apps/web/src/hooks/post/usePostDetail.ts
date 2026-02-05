'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PostResponseDto as Post } from '@repo/dto';
import { getPostDetail } from '@/api/internal/post';

type Params = {
  enabled: boolean;
  postId?: string;
  passedPost?: Post;
};

type Result = {
  post: Post | null;
  isLoading: boolean;
  error: string | null;
  updatePostContent: (newContent: string) => void;
};

export function usePostDetail({ enabled, postId, passedPost }: Params): Result {
  const matchedPost = useMemo(() => {
    if (!postId || !passedPost) return null;
    return passedPost.id === postId ? passedPost : null;
  }, [postId, passedPost]);

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const updatePostContent = (newContent: string) => {
    setPost((prev) => {
      if (!prev) return null;
      return { ...prev, content: newContent };
    });
  };

  useEffect(() => {
    if (!enabled) {
      setPost(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!postId) {
      setPost(null);
      setIsLoading(false);
      setError('postId is missing');
      return;
    }

    // passedPost가 정확히 일치하면 즉시 사용 (fetch skip)
    if (matchedPost) {
      setPost(matchedPost);
      setIsLoading(false);
      setError(null);
      return;
    }

    // postId 기준으로 항상 새 요청 보장
    setPost(null);
    setError(null);
    setIsLoading(true);

    const myReqId = ++requestIdRef.current;

    const run = async () => {
      try {
        const detail = await getPostDetail(postId);
        if (requestIdRef.current !== myReqId) return;

        setPost(detail);
        setError(null);
      } catch (e) {
        if (requestIdRef.current !== myReqId) return;

        setPost(null);
        setError(e instanceof Error ? e.message : 'failed to fetch post detail');
      } finally {
        if (requestIdRef.current === myReqId) {
          setIsLoading(false);
        }
      }
    };

    void run();
  }, [enabled, postId, matchedPost]);

  return { post, isLoading, error, updatePostContent };
}
