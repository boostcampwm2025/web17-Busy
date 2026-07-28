'use client';

import type { QueryKey } from '@tanstack/react-query';
import { Cursor, FeedResponseDto, PostResponseDto as Post } from '@repo/dto';

import useInfiniteQueryScroll from './use-infinite-query-scroll';

interface UseInfiniteScrollParams {
  fetchFn: (cursors?: Cursor, limit?: number) => Promise<FeedResponseDto>;
  queryKey?: QueryKey;
  resetKey?: string; // 목록 초기화 트리거
  initialData?: Post[]; // 특정 글 공유 라우트 데이터
}

const selectPosts = (page: FeedResponseDto) => page.posts;
const getHasNext = (page: FeedResponseDto) => page.hasNext;
const getNextCursor = (page: FeedResponseDto) => page.nextCursor;
const dedupePosts = (posts: Post[]) => Array.from(new Map(posts.map((post) => [post.id, post])).values());

export default function useFeedInfiniteScroll({ fetchFn, queryKey, resetKey, initialData = [] }: UseInfiniteScrollParams) {
  const result = useInfiniteQueryScroll<Post, Cursor, FeedResponseDto>({
    queryKey: queryKey ?? ['feed', resetKey ?? 'default'],
    fetchPage: fetchFn,
    selectItems: selectPosts,
    getHasNext,
    getNextCursor,
    initialItems: initialData,
    dedupeItems: dedupePosts,
  });

  return {
    posts: result.items,
    setPosts: result.setItems,
    hasNext: result.hasNext,
    isLoading: result.isLoading,
    isInitialLoading: result.isInitialLoading,
    errorMsg: result.errorMsg,
    ref: result.ref,
    reset: result.reset,
  };
}
