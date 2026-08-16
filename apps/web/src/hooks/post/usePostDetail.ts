'use client';

import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { PostResponseDto as Post } from '@repo/dto';
import { getPostDetail, queryKeys } from '@/api';
import { setPostPatchInCaches } from './post-cache-updaters';

/**
 * 목록에서 넘겨받은 게시글을 `initialData`로 쓸 때 즉시 재조회되지 않도록 하는 값.
 * 게시글 수정/삭제와 좋아요/댓글 mutation은 cache를 직접 patch하거나 invalidate하므로,
 * 이 값이 사용자 동작 결과의 반영을 늦추지는 않는다.
 */
export const POST_DETAIL_STALE_TIME_MS = 60 * 1000;

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
  const queryClient = useQueryClient();
  const matchedPost = useMemo(() => {
    if (!postId || !passedPost) return null;
    return passedPost.id === postId ? passedPost : null;
  }, [postId, passedPost]);

  const query = useQuery({
    queryKey: queryKeys.posts.detail(postId ?? ''),
    queryFn: () => {
      if (!postId) throw new Error('postId is missing');
      return getPostDetail(postId);
    },
    enabled: Boolean(enabled && postId),
    initialData: matchedPost ?? undefined,
    staleTime: POST_DETAIL_STALE_TIME_MS,
  });

  const updatePostContent = useCallback(
    (newContent: string) => {
      if (!postId) return;
      setPostPatchInCaches(queryClient, postId, { content: newContent });
    },
    [postId, queryClient],
  );

  if (!enabled) return { post: null, isLoading: false, error: null, updatePostContent };
  if (!postId) return { post: null, isLoading: false, error: 'postId is missing', updatePostContent };

  return {
    post: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    updatePostContent,
  };
}
