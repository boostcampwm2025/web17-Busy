'use client';

import { useCallback } from 'react';
import type { Cursor, PostResponseDto } from '@repo/dto';

import { getFeedPosts, getUserProfileFeedPosts, getUserProfilePosts } from '@/api/internal/post';
import { queryKeys } from '@/api/queryKeys';
import useInfiniteScroll from '@/hooks/common/use-infinite-scroll';

/**
 * 서버가 페이지 간 중복 게시글을 반환할 수 있어 방어한다. 서버 중복 제거(#392) 이후 존치 여부를 판단한다.
 * 렌더마다 새 참조를 넘기면 목록이 매번 다시 계산되므로 모듈 스코프에 둔다.
 */
const dedupePosts = (posts: PostResponseDto[]) => Array.from(new Map(posts.map((post) => [post.id, post])).values());

/**
 * 홈 피드. 공유 링크로 들어온 경우 해당 게시글을 목록 맨 앞에 고정하므로
 * query key도 그 게시글로 갈라져 다른 진입과 캐시를 섞지 않는다.
 */
export const useFeedPostsQuery = (initialPost?: PostResponseDto) =>
  useInfiniteScroll<PostResponseDto, Cursor>({
    queryKey: queryKeys.posts.feed(initialPost ? { initialPostId: initialPost.id } : undefined),
    fetchFn: getFeedPosts,
    initialItems: initialPost ? [initialPost] : [],
    dedupeItems: dedupePosts,
  });

/** 프로필 격자(썸네일 목록). */
export const useProfilePostsQuery = (userId: string) => {
  const fetchFn = useCallback((cursor?: string, limit?: number) => getUserProfilePosts(userId, cursor, limit), [userId]);

  return useInfiniteScroll({
    queryKey: queryKeys.posts.profile(userId),
    fetchFn,
  });
};

/** 프로필 게시글을 피드 형태로 펼친 목록. 격자와 다른 key를 쓴다. */
export const useProfileFeedPostsQuery = (userId: string) => {
  const fetchFn = useCallback((cursor?: string) => getUserProfileFeedPosts(userId, cursor), [userId]);

  return useInfiniteScroll({
    queryKey: queryKeys.posts.profileFull(userId),
    fetchFn,
  });
};
