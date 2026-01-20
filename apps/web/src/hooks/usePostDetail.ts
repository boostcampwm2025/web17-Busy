'use client';

import { useEffect, useMemo, useState } from 'react';
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
};

/**
 * usePostDetail
 * - postId가 있고 passedPost가 없으면: /post/:postId fetch
 * - passedPost가 있고 id가 postId와 일치하면: passedPost 사용(fetch skip)
 */
export function usePostDetail({ enabled, postId, passedPost }: Params): Result {
  const matchedPost = useMemo(() => {
    if (!postId || !passedPost) return null;
    return passedPost.id === postId ? passedPost : null;
  }, [postId, passedPost]);

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    if (matchedPost) {
      setPost(matchedPost);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const detail = await getPostDetail(postId);
        if (cancelled) return;
        setPost(detail);
      } catch (e) {
        if (cancelled) return;
        setPost(null);
        setError(e instanceof Error ? e.message : 'failed to fetch post detail');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [enabled, postId, matchedPost]);

  return { post, isLoading, error };
}
