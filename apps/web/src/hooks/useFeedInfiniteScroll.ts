'use client';

import type { QueryKey } from '@tanstack/react-query';
import { Cursor, FeedResponseDto, PostResponseDto as Post } from '@repo/dto';

import useInfiniteQueryScroll from './use-infinite-query-scroll';

interface UseInfiniteScrollParams {
  fetchFn: (cursors?: Cursor, limit?: number) => Promise<FeedResponseDto>;
  /** 목록마다 고유해야 한다. 값이 바뀌면 새 query가 되어 목록이 처음부터 다시 로드된다. */
  queryKey: QueryKey;
  initialData?: Post[]; // 특정 글 공유 라우트 데이터
}

const selectPosts = (page: FeedResponseDto) => page.posts;
const getHasNext = (page: FeedResponseDto) => page.hasNext;
const getNextCursor = (page: FeedResponseDto) => page.nextCursor;
const dedupePosts = (posts: Post[]) => Array.from(new Map(posts.map((post) => [post.id, post])).values());

/**
 * 피드 도메인 어댑터. `FeedResponseDto`와 복합 cursor를 공통 훅 계약에 맞추고
 * 피드에만 필요한 초기 데이터와 중복 제거를 붙인다. 반환 형태는 공통 훅을 그대로 따른다.
 */
export default function useFeedInfiniteScroll({ fetchFn, queryKey, initialData = [] }: UseInfiniteScrollParams) {
  return useInfiniteQueryScroll<Post, Cursor, FeedResponseDto>({
    queryKey,
    fetchPage: fetchFn,
    selectItems: selectPosts,
    getHasNext,
    getNextCursor,
    initialItems: initialData,
    dedupeItems: dedupePosts,
  });
}
